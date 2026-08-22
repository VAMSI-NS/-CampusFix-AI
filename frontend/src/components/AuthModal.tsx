import { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Wrench,
  GraduationCap,
  Sparkles,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
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
  { id: 'Network', label: 'Network Technician (Wi-Fi, RADIUS, DNS, VPN)' },
  { id: 'Hardware', label: 'Hardware Technician (PaperCut, Printers, Terminals)' },
  { id: 'Software', label: 'Software Technician (Canvas, LMS, Academic Apps)' },
  { id: 'Support', label: 'Support Technician (Walkup Help Bar, Triage)' },
  { id: 'IAM / Access', label: 'IAM/Access Technician (Duo 2FA, NetID, SSO)' },
];

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'student',
}: AuthModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  const handleFillDemo = (role: UserRole, user: string, pass: string, spec?: TechnicianSpecialization) => {
    setSelectedRole(role);
    setUsername(user);
    setPassword(pass);
    if (spec) setSpecialization(spec);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const payload: Record<string, unknown> = {
        username: username.trim(),
        password: password.trim(),
        role: selectedRole === 'host' ? 'host' : selectedRole === 'technician' ? 'technician' : 'student',
      };

      if (selectedRole === 'technician') {
        payload.specialization = specialization;
      }

      let successData: LoginResponse | null = null;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data && data.token && data.user) {
              successData = data as LoginResponse;
            }
          }
        }
      } catch (networkErr) {
        console.warn('Backend login endpoint unavailable, trying client fallback:', networkErr);
      }

      // If backend was not reached or returned non-JSON (e.g. on static GitHub Pages), authenticate with client mock accounts
      if (!successData) {
        const cleanU = username.trim().toLowerCase();
        const cleanP = password.trim();
        const matched = authenticateClientMockUser(cleanU, cleanP, selectedRole, specialization);
        if (matched) {
          successData = matched;
        } else {
          throw new Error('Invalid credentials. Please verify your username and password.');
        }
      }

      // Persist auth tokens
      localStorage.setItem('campusfix_token', successData.token);
      localStorage.setItem('campusfix_user', JSON.stringify(successData.user));

      onLoginSuccess(successData.token, successData.user);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div
        className="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface, #1e293b)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.15)',
          maxWidth: '480px',
          width: '92%',
          padding: '1.75rem',
          position: 'relative',
          color: 'var(--text-primary, #f8fafc)',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary, #94a3b8)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Close Login Modal"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 0.75rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(99, 102, 241, 0.3))',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}
          >
            {selectedRole === 'host' ? (
              <ShieldCheck size={26} />
            ) : selectedRole === 'technician' ? (
              <Wrench size={26} />
            ) : (
              <GraduationCap size={26} />
            )}
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.25rem' }}>
            {selectedRole === 'host'
              ? 'Host / Executive Access'
              : selectedRole === 'technician'
              ? 'Technician Workspace Login'
              : 'Student Helpdesk Access'}
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary, #94a3b8)', margin: 0 }}>
            {selectedRole === 'host'
              ? 'Full platform authority, technician provisioning & executive reports'
              : selectedRole === 'technician'
              ? 'Role-validated diagnostic workbench & incident lifecycle resolver'
              : 'Interactive campus IT troubleshooting & ticket tracking'}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0.35rem',
            background: 'var(--bg-card, rgba(15, 23, 42, 0.6))',
            padding: '0.25rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          }}
        >
          <button
            type="button"
            onClick={() => handleRoleTabChange('student')}
            style={{
              padding: '0.5rem 0.25rem',
              borderRadius: '8px',
              border: 'none',
              background: selectedRole === 'student' ? 'var(--primary-600, #2563eb)' : 'transparent',
              color: selectedRole === 'student' ? '#fff' : 'var(--text-secondary, #94a3b8)',
              fontWeight: selectedRole === 'student' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <GraduationCap size={14} />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('technician')}
            style={{
              padding: '0.5rem 0.25rem',
              borderRadius: '8px',
              border: 'none',
              background: selectedRole === 'technician' ? 'var(--primary-600, #2563eb)' : 'transparent',
              color: selectedRole === 'technician' ? '#fff' : 'var(--text-secondary, #94a3b8)',
              fontWeight: selectedRole === 'technician' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Wrench size={14} />
            <span>Technician</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('host')}
            style={{
              padding: '0.5rem 0.25rem',
              borderRadius: '8px',
              border: 'none',
              background: selectedRole === 'host' ? 'var(--primary-600, #2563eb)' : 'transparent',
              color: selectedRole === 'host' ? '#fff' : 'var(--text-secondary, #94a3b8)',
              fontWeight: selectedRole === 'host' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <ShieldCheck size={14} />
            <span>Host / Admin</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '0.82rem',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {/* Username / NetID */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary, #94a3b8)',
                marginBottom: '0.35rem',
              }}
            >
              Username / Campus NetID
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary, #64748b)',
                }}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={selectedRole === 'host' ? 'e.g. VAMSI' : selectedRole === 'technician' ? 'e.g. sarah, dave, alex, ramu' : 'e.g. student'}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                  borderRadius: '8px',
                  background: 'var(--bg-input, rgba(15, 23, 42, 0.8))',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                  color: 'var(--text-primary, #fff)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
          </div>

          {/* Technician Specialization Dropdown */}
          {selectedRole === 'technician' && (
            <div>
              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #94a3b8)',
                  marginBottom: '0.35rem',
                }}
              >
                <span>Assigned Specialization</span>
                <span style={{ fontSize: '0.72rem', color: '#60a5fa' }}>Backend Validated</span>
              </label>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value as TechnicianSpecialization)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  background: 'var(--bg-input, rgba(15, 23, 42, 0.8))',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                  color: 'var(--text-primary, #fff)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                {SPECIALIZATIONS.map((spec) => (
                  <option key={spec.id} value={spec.id} style={{ background: '#0f172a', color: '#fff' }}>
                    {spec.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Password */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary, #94a3b8)',
                marginBottom: '0.35rem',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary, #64748b)',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                style={{
                  width: '100%',
                  padding: '0.65rem 2.5rem 0.65rem 2.25rem',
                  borderRadius: '8px',
                  background: 'var(--bg-input, rgba(15, 23, 42, 0.8))',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                  color: 'var(--text-primary, #fff)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary, #94a3b8)',
                  cursor: 'pointer',
                  padding: '0.2rem',
                }}
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            {isLoading ? (
              <span>Verifying credentials...</span>
            ) : (
              <>
                <CheckCircle2 size={17} />
                <span>
                  {selectedRole === 'host'
                    ? 'Authenticate as Host'
                    : selectedRole === 'technician'
                    ? `Sign in as ${specialization} Tech`
                    : 'Sign in to CampusFix'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials helper */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
            <Sparkles size={13} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #94a3b8)' }}>
              Quick Fill Demo Credentials
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => handleFillDemo('host', 'VAMSI', 'vamsi@123')}
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#fbbf24',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>👑 Host: VAMSI</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('technician', 'ramu', 'ramu@123', 'Network')}
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                color: '#60a5fa',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>🛠️ Network: Ramu</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('technician', 'sarah', 'sarah@123', 'IAM / Access')}
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                color: '#c084fc',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>🔑 IAM: Sarah</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('technician', 'dave', 'dave@123', 'Hardware')}
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(234, 88, 12, 0.12)',
                border: '1px solid rgba(234, 88, 12, 0.35)',
                color: '#fb923c',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>🖨️ Hardware: Dave</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('technician', 'alex', 'alex@123', 'Software')}
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(14, 165, 233, 0.12)',
                border: '1px solid rgba(14, 165, 233, 0.35)',
                color: '#38bdf8',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>💻 Software: Alex</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('technician', 'priya', 'priya@123', 'Support')}
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>🤝 Support: Priya</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
