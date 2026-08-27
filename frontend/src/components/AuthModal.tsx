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
  ArrowRight,
  RefreshCw,
  Hash,
  ShieldCheck,
  GraduationCap,
  Wrench,
} from 'lucide-react';
import { CampusUser, LoginResponse, UserRole } from '../types/chat';
import { apiUrl } from '../api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, user: CampusUser) => void;
  initialRole?: UserRole;
}

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'student',
}: AuthModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  // Student Form State
  const [studentName, setStudentName] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Staff & Host Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Error State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    setStudentName('');
    setStudentRoll('');
    setStudentPassword('');
    setUsername('');
    setPassword('');
  };

  useEffect(() => {
    if (isOpen && initialRole) {
      handleRoleTabChange(initialRole);
    }
  }, [isOpen, initialRole]);

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

  // --- 1. STUDENT LOGIN HANDLER ---
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!studentRoll.trim()) {
      setErrorMsg('Please enter your roll number.');
      return;
    }
    if (!studentPassword.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(apiUrl('/auth/student/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentName.trim(),
          roll_number: studentRoll.trim().toUpperCase(),
          password: studentPassword.trim(),
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data: LoginResponse = await res.json();
        if (!data?.token || !data?.user) {
          setErrorMsg('Authentication failed. Please try again.');
          return;
        }
        localStorage.setItem('campusfix_token', data.token);
        localStorage.setItem('campusfix_user', JSON.stringify(data.user));
        setIsLoading(false);
        onLoginSuccess(data.token, data.user);
        onClose();
        return;
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorMsg(errJson.detail || 'Invalid credentials.');
        return;
      }
    } catch {
      // If backend server is unreachable
      setErrorMsg('Unable to connect to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. STAFF & HOST LOGIN HANDLER ---
  const handleStaffOrHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Please enter your username or NetID.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const targetRole = selectedRole === 'admin' ? 'host' : selectedRole;
      const res = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role: targetRole,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data: LoginResponse = await res.json();
        if (!data?.authenticated || !data?.token || !data?.user) {
          setErrorMsg('Authentication failed. Please try again.');
          return;
        }
        localStorage.setItem('campusfix_token', data.token);
        localStorage.setItem('campusfix_user', JSON.stringify(data.user));
        setIsLoading(false);
        onLoginSuccess(data.token, data.user);
        onClose();
        return;
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorMsg(errJson.detail || 'Invalid credentials.');
        return;
      }
    } catch {
      // If backend server is unreachable
      setErrorMsg('Unable to connect to authentication server.');
    } finally {
      setIsLoading(false);
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
            background: 'var(--bg-surface, #111111)',
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
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.35)',
                }}
              >
                <Sparkles size={20} />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #F9FAFB)', fontFamily: 'var(--font-heading)' }}>
                CampusFix.AI
              </span>
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary, #F9FAFB)', lineHeight: 1.3, marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>
              Enterprise Campus IT Operations & Incident Intelligence
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.55 }}>
              Powered by NVIDIA Nemotron 3 Ultra & verified Vignan University geospatial telemetry.
            </p>

            {/* Dynamic Role Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.75rem' }}>
              {selectedRole === 'student' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span>Direct Name + Roll Number + Password login</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span>Instant AI diagnosis for Eduroam & Canvas</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span>Personalized student incident tracking</span>
                  </div>
                </>
              ) : selectedRole === 'technician' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    <CheckCircle2 size={16} style={{ color: '#60a5fa', flexShrink: 0 }} />
                    <span>Technician specialization queue access</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    <CheckCircle2 size={16} style={{ color: '#60a5fa', flexShrink: 0 }} />
                    <span>Action audit logging & resolution workflow</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    <CheckCircle2 size={16} style={{ color: '#60a5fa', flexShrink: 0 }} />
                    <span>Tier-2 escalation & Tech Bar dispatch</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    <CheckCircle2 size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
                    <span>Executive SLA & operational governance</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    <CheckCircle2 size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
                    <span>Technician provisioning & role management</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    <CheckCircle2 size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
                    <span>Campus infrastructure satellite telemetry</span>
                  </div>
                </>
              )}
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
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary, #F9FAFB)', fontFamily: 'var(--font-heading)' }}>
                  Welcome to CampusFix.AI
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  {selectedRole === 'student'
                    ? 'Student Sign In'
                    : selectedRole === 'technician'
                    ? 'Staff & Technician Sign In'
                    : 'Host & Administrator Sign In'}
                </p>
              </div>
              <button
                type="button"
                className="btn-saas-ghost"
                style={{ padding: '0.4rem', color: 'var(--text-muted, #71717A)', borderRadius: '8px', cursor: 'pointer', background: 'none', border: 'none' }}
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
                  background: selectedRole === 'student' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                  color: selectedRole === 'student' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
                onClick={() => handleRoleTabChange('student')}
              >
                <GraduationCap size={14} />
                <span>Student</span>
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
                  background: selectedRole === 'technician' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                  color: selectedRole === 'technician' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
                onClick={() => handleRoleTabChange('technician')}
              >
                <Wrench size={14} />
                <span>Staff</span>
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
                  background: selectedRole === 'host' || selectedRole === 'admin' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                  color: selectedRole === 'host' || selectedRole === 'admin' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
                onClick={() => handleRoleTabChange('host')}
              >
                <ShieldCheck size={14} />
                <span>Host</span>
              </button>
            </div>

            {/* Error Message */}
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

            {/* =========================================================================
                A) STUDENT LOGIN FORM: NAME + ROLL NUMBER + PASSWORD
                ========================================================================= */}
            {selectedRole === 'student' && (
              <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #A1A1AA)', display: 'block', marginBottom: '0.35rem' }}>
                    Full Name
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
                        width: '100%',
                      }}
                      placeholder="Enter your full name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #A1A1AA)', display: 'block', marginBottom: '0.35rem' }}>
                    Roll Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Hash size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #71717A)' }} />
                    <input
                      type="text"
                      className="saas-input"
                      style={{
                        paddingLeft: '2.5rem',
                        background: 'var(--bg-surface, #111111)',
                        border: '1px solid var(--border-default, #27272A)',
                        color: 'var(--text-primary, #F8FAFC)',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        width: '100%',
                      }}
                      placeholder="Enter roll number (e.g. 211FA04001)"
                      value={studentRoll}
                      onChange={(e) => setStudentRoll(e.target.value.toUpperCase())}
                      required
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
                      type={showStudentPassword ? 'text' : 'password'}
                      className="saas-input"
                      style={{
                        paddingLeft: '2.5rem',
                        paddingRight: '2.5rem',
                        background: 'var(--bg-surface, #111111)',
                        border: '1px solid var(--border-default, #27272A)',
                        color: 'var(--text-primary, #F8FAFC)',
                        borderRadius: '12px',
                        width: '100%',
                      }}
                      placeholder="Enter password"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted, #71717A)', cursor: 'pointer' }}
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                    >
                      {showStudentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    marginTop: '0.4rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In as Student</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* =========================================================================
                B) STAFF & HOST LOGIN FORM: USERNAME/NAME + PASSWORD
                ========================================================================= */}
            {selectedRole !== 'student' && (
              <form onSubmit={handleStaffOrHostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #A1A1AA)', display: 'block', marginBottom: '0.35rem' }}>
                    {selectedRole === 'host' ? 'Username / Name' : 'Username / Name'}
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
                        width: '100%',
                      }}
                      placeholder={selectedRole === 'host' ? 'Enter host username or NetID' : 'Enter staff username or NetID'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoFocus
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
                        width: '100%',
                      }}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
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

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    marginTop: '0.4rem',
                    borderRadius: '12px',
                    background:
                      selectedRole === 'host'
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow:
                      selectedRole === 'host'
                        ? '0 4px 14px rgba(245, 158, 11, 0.35)'
                        : '0 4px 14px rgba(37, 99, 235, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In as {selectedRole === 'technician' ? 'Staff' : 'Host'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-default, #27272A)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #71717A)' }}>
              🔒 Protected by CampusFix RBAC session encryption
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
