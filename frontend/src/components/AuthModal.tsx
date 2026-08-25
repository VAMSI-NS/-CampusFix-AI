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
  Phone,
  Hash,
  Clock,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  GraduationCap,
  Wrench,
} from 'lucide-react';
import { CampusUser, LoginResponse, TechnicianSpecialization, UserRole, StudentSendOTPResponse } from '../types/chat';
import { authenticateClientMockUser, sendClientStudentOTP, verifyClientStudentOTP } from '../data/mockData';

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

  // Student Flow State
  const [studentStep, setStudentStep] = useState<'details' | 'otp'>('details');
  const [studentName, setStudentName] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentOtp, setStudentOtp] = useState('');
  const [devOtpInfo, setDevOtpInfo] = useState<string | null>(null);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Staff / Host State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState<TechnicianSpecialization>('Network');
  const [showPassword, setShowPassword] = useState(false);

  // Common UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    setSuccessNotice(null);
    setStudentStep('details');
    // Clear inputs — NEVER prefill credentials
    setUsername('');
    setPassword('');
    setStudentOtp('');
    setDevOtpInfo(null);
  };

  // Sync initial role when opened
  useEffect(() => {
    if (isOpen && initialRole) {
      handleRoleTabChange(initialRole);
    }
  }, [isOpen, initialRole]);

  // Live Timer for OTP expiry and resend cooldown
  useEffect(() => {
    if (!isOpen || studentStep !== 'otp') return;

    const interval = setInterval(() => {
      setOtpExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, studentStep]);

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

  // Format expiry seconds into mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- 1. STUDENT FLOW: SEND OTP ---
  const handleStudentSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setErrorMsg('Please enter your full student name.');
      return;
    }
    if (!studentRoll.trim() || studentRoll.trim().length < 3) {
      setErrorMsg('Please enter a valid student roll number (e.g. 211FA04001).');
      return;
    }
    if (!studentPhone.trim() || studentPhone.trim().replace(/\D/g, '').length < 7) {
      setErrorMsg('Please enter a valid phone number with area/country code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/student/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentName.trim(),
          roll_number: studentRoll.trim().toUpperCase(),
          phone: studentPhone.trim(),
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data: StudentSendOTPResponse = await res.json();
        setStudentStep('otp');
        setOtpExpirySeconds(data.expires_in_seconds || 300);
        setResendCooldown(data.cooldown_seconds || 30);
        if (data.dev_otp) {
          setDevOtpInfo(data.dev_otp);
        }
        setSuccessNotice('OTP generated successfully. (Dev mode: check development badge)');
        return;
      } else if (res.status === 404 || res.status === 405 || !contentType.includes('application/json')) {
        throw new Error('Static host fallback');
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorMsg(errJson.detail || 'Failed to send OTP. Please check your details.');
        return;
      }
    } catch {
      // Offline fallback: use client mock OTP generator
      const mockRes = sendClientStudentOTP(studentName, studentRoll, studentPhone);
      setStudentStep('otp');
      setOtpExpirySeconds(mockRes.expires_in_seconds);
      setResendCooldown(mockRes.cooldown_seconds);
      setDevOtpInfo(mockRes.dev_otp);
      setSuccessNotice('OTP generated successfully.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. STUDENT FLOW: RESEND OTP ---
  const handleStudentResendOTP = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/student/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: studentPhone.trim(),
          roll_number: studentRoll.trim().toUpperCase(),
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data: StudentSendOTPResponse = await res.json();
        setOtpExpirySeconds(data.expires_in_seconds || 300);
        setResendCooldown(data.cooldown_seconds || 30);
        if (data.dev_otp) {
          setDevOtpInfo(data.dev_otp);
        }
        setSuccessNotice('New verification OTP sent.');
        return;
      } else if (res.status === 404 || res.status === 405 || !contentType.includes('application/json')) {
        throw new Error('Static host fallback');
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorMsg(errJson.detail || 'Failed to resend OTP.');
        return;
      }
    } catch {
      const mockRes = sendClientStudentOTP(studentName, studentRoll, studentPhone);
      setOtpExpirySeconds(mockRes.expires_in_seconds);
      setResendCooldown(mockRes.cooldown_seconds);
      setDevOtpInfo(mockRes.dev_otp);
      setSuccessNotice('New OTP generated.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. STUDENT FLOW: VERIFY OTP ---
  const handleStudentVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentOtp.trim() || studentOtp.trim().length !== 6) {
      setErrorMsg('Please enter the full 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/student/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: studentPhone.trim(),
          roll_number: studentRoll.trim().toUpperCase(),
          otp: studentOtp.trim(),
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data: LoginResponse = await res.json();
        localStorage.setItem('campusfix_token', data.token);
        localStorage.setItem('campusfix_user', JSON.stringify(data.user));
        setIsLoading(false);
        onLoginSuccess(data.token, data.user);
        onClose();
        return;
      } else if (res.status === 404 || res.status === 405 || !contentType.includes('application/json')) {
        throw new Error('Static host fallback');
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorMsg(errJson.detail || 'Invalid or expired OTP. Please verify and try again.');
        return;
      }
    } catch {
      // Offline fallback
      const mockResult = verifyClientStudentOTP(studentPhone, studentRoll, studentOtp);
      if ('error' in mockResult) {
        setErrorMsg(mockResult.error);
        return;
      }

      localStorage.setItem('campusfix_token', mockResult.token);
      localStorage.setItem('campusfix_user', JSON.stringify(mockResult.user));
      setIsLoading(false);
      onLoginSuccess(mockResult.token, mockResult.user);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. STAFF & HOST FLOW: USERNAME & PASSWORD LOGIN ---
  const handleStaffOrHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username/NetID and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const targetRole = selectedRole === 'admin' ? 'host' : selectedRole;
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role: targetRole,
          specialization: selectedRole === 'technician' ? specialization : undefined,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data: LoginResponse = await res.json();
        localStorage.setItem('campusfix_token', data.token);
        localStorage.setItem('campusfix_user', JSON.stringify(data.user));
        setIsLoading(false);
        onLoginSuccess(data.token, data.user);
        onClose();
        return;
      } else if (res.status === 404 || res.status === 405 || !contentType.includes('application/json')) {
        // GitHub Pages / Static hosting fallback
        throw new Error('Static host fallback');
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorMsg(errJson.detail || 'Authentication failed. Incorrect username or password.');
        return;
      }
    } catch {
      // Offline client fallback
      const targetRole = selectedRole === 'admin' ? 'host' : selectedRole;
      const mockResult = authenticateClientMockUser(
        username.trim(),
        password.trim(),
        targetRole,
        selectedRole === 'technician' ? specialization : undefined
      );

      if (mockResult) {
        localStorage.setItem('campusfix_token', mockResult.token);
        localStorage.setItem('campusfix_user', JSON.stringify(mockResult.user));
        setIsLoading(false);
        onLoginSuccess(mockResult.token, mockResult.user);
        onClose();
        return;
      } else {
        setErrorMsg('Authentication failed. Incorrect username or password.');
      }
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
                    <span>One-time mobile OTP authentication</span>
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
                  Sign in to CampusFix
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  {selectedRole === 'student'
                    ? 'Student verification via OTP'
                    : selectedRole === 'technician'
                    ? 'Staff & Technician credentials'
                    : 'Host & Administrator access'}
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

            {/* Success Notice */}
            {successNotice && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  color: '#10b981',
                  fontSize: '0.76rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{successNotice}</span>
              </div>
            )}

            {/* =========================================================================
                A) STUDENT AUTHENTICATION FORM (STEP 1: DETAILS & STEP 2: OTP)
                ========================================================================= */}
            {selectedRole === 'student' && studentStep === 'details' && (
              <form onSubmit={handleStudentSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #A1A1AA)', display: 'block', marginBottom: '0.35rem' }}>
                    Student Full Name
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
                      placeholder="e.g. Aarav Sharma"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #A1A1AA)', display: 'block', marginBottom: '0.35rem' }}>
                    Roll Number / Student ID
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
                      placeholder="e.g. 211FA04001"
                      value={studentRoll}
                      onChange={(e) => setStudentRoll(e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #A1A1AA)', display: 'block', marginBottom: '0.35rem' }}>
                    Phone Number (for OTP verification)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #71717A)' }} />
                    <input
                      type="tel"
                      className="saas-input"
                      style={{
                        paddingLeft: '2.5rem',
                        background: 'var(--bg-surface, #111111)',
                        border: '1px solid var(--border-default, #27272A)',
                        color: 'var(--text-primary, #F8FAFC)',
                        borderRadius: '12px',
                        width: '100%',
                      }}
                      placeholder="+91 98765 43210"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      required
                    />
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
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Verification</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {selectedRole === 'student' && studentStep === 'otp' && (
              <form onSubmit={handleStudentVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-surface, #111111)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-default, #27272A)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    <span>Student: <strong style={{ color: '#ffffff' }}>{studentName}</strong></span>
                    <span>Roll: <strong style={{ color: '#ffffff' }}>{studentRoll}</strong></span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted, #71717A)', marginTop: '0.2rem' }}>
                    Sent OTP to: {studentPhone}
                  </div>
                </div>

                {/* Clearly Marked Development Mode OTP Notice */}
                {devOtpInfo && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      color: '#fbbf24',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                      <KeyRound size={14} />
                      <span>DEVELOPMENT OTP MODE</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', marginTop: '0.25rem', color: '#fef3c7' }}>
                      Verification OTP: <strong style={{ letterSpacing: '2px', fontSize: '1.05rem', color: '#fbbf24' }}>{devOtpInfo}</strong>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      (No live SMS gateway billed in development. Code logged to server console.)
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #A1A1AA)' }}>
                      Enter 6-Digit OTP Code
                    </label>
                    <span style={{ fontSize: '0.74rem', color: otpExpirySeconds > 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {otpExpirySeconds > 0 ? `Expires in ${formatTime(otpExpirySeconds)}` : 'OTP Expired'}
                    </span>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    className="saas-input"
                    style={{
                      textAlign: 'center',
                      letterSpacing: '8px',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      background: 'var(--bg-surface, #111111)',
                      border: '1px solid var(--border-default, #27272A)',
                      color: 'var(--text-primary, #F8FAFC)',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      width: '100%',
                    }}
                    placeholder="••••••"
                    value={studentOtp}
                    onChange={(e) => setStudentOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary, #94a3b8)',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: 0,
                    }}
                    onClick={() => {
                      setStudentStep('details');
                      setErrorMsg(null);
                      setStudentOtp('');
                    }}
                  >
                    <ArrowLeft size={13} />
                    <span>Change details</span>
                  </button>

                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCooldown === 0 ? '#10b981' : 'var(--text-muted, #71717A)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: resendCooldown === 0 ? 'pointer' : 'not-allowed',
                      padding: 0,
                    }}
                    onClick={handleStudentResendOTP}
                    disabled={resendCooldown > 0 || isLoading}
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    marginTop: '0.2rem',
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
                  }}
                  disabled={isLoading || studentOtp.length !== 6 || otpExpirySeconds === 0}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Access Student Portal</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* =========================================================================
                B) STAFF & HOST AUTHENTICATION FORM (NO PREFILLED PASSWORDS)
                ========================================================================= */}
            {selectedRole !== 'student' && (
              <form onSubmit={handleStaffOrHostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #A1A1AA)', display: 'block', marginBottom: '0.35rem' }}>
                    {selectedRole === 'host' ? 'Host Username / NetID' : 'Staff NetID / Username'}
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
                      placeholder={selectedRole === 'host' ? 'Enter Host username...' : 'e.g. sarah, dave, alex, ramu...'}
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
                      placeholder="Enter password..."
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
                        width: '100%',
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
