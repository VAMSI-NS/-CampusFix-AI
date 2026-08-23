import { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in CampusFix UI:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    try {
      localStorage.removeItem('campusfix_tickets');
      localStorage.removeItem('campusfix_technicians');
      localStorage.removeItem('campusfix_chat_history');
      localStorage.removeItem('campusfix_user');
      localStorage.removeItem('campusfix_token');
    } catch {
      // ignore
    }
    window.location.href = window.location.pathname;
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary, #0B0B0C)',
            color: 'var(--text-primary, #F8FAFC)',
            padding: '2rem 1rem',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: 580,
              width: '100%',
              background: 'var(--bg-surface, #111111)',
              border: '1px solid var(--border-default, #27272A)',
              borderRadius: 20,
              padding: '2.5rem 2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <ShieldAlert size={32} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
              CampusFix IT Platform Recovery
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #A1A1AA)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              The application encountered a display glitch. You can reload the page or reset local storage cache to restore full operation.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  padding: '0.85rem 1rem',
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle, #27272A)',
                  textAlign: 'left',
                  fontSize: '0.78rem',
                  color: '#F87171',
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: '1.5rem',
                  overflowX: 'auto',
                  maxHeight: 140,
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--primary-600, #22C55E)',
                  color: '#0B0B0C',
                  border: 'none',
                  borderRadius: 10,
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={15} />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleResetData}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--text-primary, #F8FAFC)',
                  border: '1px solid var(--border-default, #27272A)',
                  borderRadius: 10,
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={15} />
                <span>Clear Cache & Reset</span>
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'transparent',
                  color: 'var(--text-secondary, #A1A1AA)',
                  border: '1px solid transparent',
                  borderRadius: 10,
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Home size={15} />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
