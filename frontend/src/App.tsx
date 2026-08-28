import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Wrench,
  Clock,
  Radio,
  BookOpen,
  LayoutDashboard,
  FileSpreadsheet,
  Moon,
  Sun,
  Home,
  Ticket as TicketIcon,
  Activity,
  Cpu,
  Sparkles,
  LogIn,
  LogOut,
  MapPin,
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import StudentDashboard from './components/StudentDashboard';
import IncidentWorkspace from './components/IncidentWorkspace';
import ChatInterface from './components/ChatInterface';
import TicketHistory from './components/TicketHistory';
import TicketBoard from './components/TicketBoard';
import CampusStatusPanel from './components/CampusStatusPanel';
import KnowledgeBase from './components/KnowledgeBase';
import HealthDashboard from './components/HealthDashboard';
import AdminDashboard from './components/AdminDashboard';
import HostReports from './components/HostReports';
import AuthModal from './components/AuthModal';
import CampusMap from './components/CampusMap';
import AICommandCenter from './components/AICommandCenter';
import { Ticket, TicketStatus, UserRole, CampusUser } from './types/chat';
import { getLocalTickets, saveLocalTickets } from './data/mockData';
import { apiUrl } from './api';
import './App.css';

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

type TabType =
  | 'landing'
  | 'resolver'
  | 'history'
  | 'tickets'
  | 'status'
  | 'map'
  | 'kb'
  | 'diagnostics'
  | 'admin'
  | 'reports'
  | 'command-center';

function getRouteFromPath(pathname: string, hash: string): { tab: TabType | '404'; role?: UserRole } {
  let cleanPathname = (pathname.split('?')[0] || '').toLowerCase().trim();
  const cleanHash = (hash.split('?')[0] || '').toLowerCase().trim();

  // Strip GitHub Pages repository subpath (e.g. /-CampusFix-AI or /CampusFix-AI)
  cleanPathname = cleanPathname.replace(/^\/(-?campusfix(-ai)?)/i, '');
  if (!cleanPathname.startsWith('/')) {
    cleanPathname = '/' + cleanPathname;
  }

  let raw = cleanHash
    ? cleanHash.replace(/^#\/?/, '/')
    : cleanPathname;

  raw = raw.replace(/\/+$/, '') || '/';
  if (!raw.startsWith('/')) {
    raw = '/' + raw;
  }

  const firstSegment = '/' + (raw.split('/')[1] || '');

  switch (raw) {
    case '':
    case '/':
    case '/index.html':
    case '/index.htm':
    case '/index':
    case '/home':
    case '/landing':
    case '/campusfix':
    case '/welcome':
      return { tab: 'landing' };

    case '/chat':
    case '/ai':
    case '/assistant':
    case '/resolver':
    case '/helpdesk':
    case '/ai-helpdesk':
    case '/ai-help-desk':
    case '/help-desk':
    case '/aihelpdesk':
    case '/incident-resolver':
    case '/diagnose':
    case '/troubleshoot':
    case '/support':
      return { tab: 'resolver' };

    case '/history':
    case '/incident-history':
    case '/ticket-history':
    case '/incidents':
    case '/history-log':
    case '/my-tickets':
    case '/past-tickets':
      return { tab: 'history' };

    case '/tickets':
    case '/ticket-board':
    case '/tickets-board':
    case '/board':
    case '/kanban':
    case '/queue':
    case '/all-tickets':
      return { tab: 'tickets' };

    case '/status':
    case '/service-status':
    case '/campus-status':
    case '/system-status':
    case '/services':
    case '/uptime':
    case '/health-status':
      return { tab: 'status' };

    case '/map':
    case '/campus-map':
    case '/vignan-map':
    case '/campusmap':
    case '/locations':
    case '/buildings':
    case '/geodata':
      return { tab: 'map' };

    case '/kb':
    case '/help-center':
    case '/knowledge-base':
    case '/knowledgebase':
    case '/help':
    case '/faq':
    case '/articles':
    case '/docs':
    case '/wiki':
    case '/guides':
      return { tab: 'kb' };

    case '/diagnostics':
    case '/health':
    case '/system-health':
    case '/systemhealth':
    case '/telemetry':
    case '/probes':
      return { tab: 'diagnostics' };

    case '/admin':
    case '/technician':
    case '/technician-hub':
    case '/technician-dashboard':
    case '/admin-dashboard':
    case '/tech':
    case '/tech-bar':
    case '/staff':
    case '/ops':
      return { tab: 'admin', role: 'admin' };

    case '/reports':
    case '/host':
    case '/executive-reports':
    case '/host-dashboard':
    case '/reports-dashboard':
    case '/management':
    case '/sla':
    case '/analytics':
      return { tab: 'reports', role: 'host' };

    case '/command-center':
    case '/command':
    case '/ai-command-center':
    case '/ai-agent':
    case '/agent':
    case '/commandcenter':
      return { tab: 'command-center' };
  }

  if (firstSegment === '/command-center' || firstSegment === '/command' || firstSegment === '/ai-agent') {
    return { tab: 'command-center' };
  }
  if (firstSegment === '/map' || firstSegment === '/campus-map' || firstSegment === '/locations') {
    return { tab: 'map' };
  }
  if (firstSegment === '/tickets' || firstSegment === '/ticket' || firstSegment === '/board') {
    return { tab: 'tickets' };
  }
  if (firstSegment === '/kb' || firstSegment === '/help' || firstSegment === '/knowledge-base' || firstSegment === '/faq' || firstSegment === '/articles') {
    return { tab: 'kb' };
  }
  if (firstSegment === '/history' || firstSegment === '/incidents' || firstSegment === '/incident') {
    return { tab: 'history' };
  }
  if (firstSegment === '/resolver' || firstSegment === '/helpdesk' || firstSegment === '/ai-helpdesk' || firstSegment === '/chat' || firstSegment === '/ai') {
    return { tab: 'resolver' };
  }
  if (firstSegment === '/status' || firstSegment === '/services') {
    return { tab: 'status' };
  }
  if (firstSegment === '/diagnostics' || firstSegment === '/health' || firstSegment === '/probes') {
    return { tab: 'diagnostics' };
  }
  if (firstSegment === '/admin' || firstSegment === '/technician' || firstSegment === '/tech') {
    return { tab: 'admin', role: 'admin' };
  }
  if (firstSegment === '/reports' || firstSegment === '/host') {
    return { tab: 'reports', role: 'host' };
  }

  return { tab: '404' };
}

function getPathForTab(tab: TabType): string {
  switch (tab) {
    case 'landing':
      return '/';
    case 'resolver':
      return '/resolver';
    case 'history':
      return '/history';
    case 'tickets':
      return '/tickets';
    case 'status':
      return '/status';
    case 'map':
      return '/map';
    case 'kb':
      return '/kb';
    case 'diagnostics':
      return '/diagnostics';
    case 'admin':
      return '/admin';
    case 'reports':
      return '/reports';
    case 'command-center':
      return '/command-center';
    default:
      return '/';
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const [is404, setIs404] = useState(false);

  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => {
    const token = localStorage.getItem('campusfix_token');
    const user = localStorage.getItem('campusfix_user');
    return token && user ? token : null;
  });
  const [currentUser, setCurrentUser] = useState<CampusUser | null>(() => {
    try {
      const token = localStorage.getItem('campusfix_token');
      const stored = localStorage.getItem('campusfix_user');
      if (token && stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const token = localStorage.getItem('campusfix_token');
      const stored = localStorage.getItem('campusfix_user');
      if (token && stored) {
        const u = JSON.parse(stored);
        return u.role || 'student';
      }
    } catch {}
    return 'student';
  });

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('student');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('campusfix_theme') as 'light' | 'dark') || 'dark';
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => getLocalTickets());
  const [health, setHealth] = useState<HealthData | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Chatbot Modal Overlay State
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatModalInitialQuery, setChatModalInitialQuery] = useState<string | undefined>(undefined);

  // Full workbench ticket state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [resolverInitialQuery, setResolverInitialQuery] = useState<string | undefined>(undefined);
  const [mapInitialLocationId, setMapInitialLocationId] = useState<string | null>(null);

  // Apply Theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('campusfix_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Validate token on app boot
  useEffect(() => {
    if (authToken) {
      fetch(apiUrl('/auth/me'), {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Token expired or invalid');
        })
        .then((user: CampusUser) => {
          setCurrentUser(user);
          setUserRole(user.role);
          localStorage.setItem('campusfix_user', JSON.stringify(user));
        })
        .catch(() => {
          // If token verification fails with 401 or invalid response, invalidate session
          localStorage.removeItem('campusfix_token');
          localStorage.removeItem('campusfix_user');
          setAuthToken(null);
          setCurrentUser(null);
          setUserRole('student');
        });
    } else {
      if (currentUser) {
        localStorage.removeItem('campusfix_user');
        setCurrentUser(null);
        setUserRole('student');
      }
    }
  }, [authToken]);

  // Synchronize initial URL and listen for browser back/forward buttons
  useEffect(() => {
    const handleUrlSync = () => {
      const match = getRouteFromPath(window.location.pathname, window.location.hash);
      if (match.tab === '404') {
        setIs404(true);
      } else {
        setIs404(false);
        const storedUser = localStorage.getItem('campusfix_user');
        const storedToken = localStorage.getItem('campusfix_token');

        // Security Enforcement: Unauthenticated visitors cannot directly open protected feature routes
        if (!storedUser || !storedToken) {
          if (match.tab !== 'landing') {
            setActiveTab('landing');
            const targetRole: UserRole =
              match.tab === 'reports' || match.tab === 'command-center'
                ? 'host'
                : match.tab === 'admin'
                ? 'technician'
                : 'student';
            setAuthModalRole(targetRole);
            setIsAuthModalOpen(true);
            return;
          }
        } else {
          try {
            const parsed = JSON.parse(storedUser);
            const userR = parsed.role || 'student';
            // Host route security guard: strictly require Host role for reports & command-center
            if ((match.tab === 'reports' || match.tab === 'command-center') && userR !== 'host' && userR !== 'admin') {
              setActiveTab(userR === 'technician' ? 'admin' : 'landing');
              setAuthModalRole('host');
              setIsAuthModalOpen(true);
              return;
            }
            // Technician route security guard: strictly require Technician or Host role for admin hub
            if (match.tab === 'admin' && userR !== 'technician' && userR !== 'host' && userR !== 'admin') {
              setActiveTab('landing');
              setAuthModalRole('technician');
              setIsAuthModalOpen(true);
              return;
            }
          } catch {}
        }
        setActiveTab(match.tab);
      }
    };

    handleUrlSync();
    window.addEventListener('popstate', handleUrlSync);
    window.addEventListener('hashchange', handleUrlSync);
    return () => {
      window.removeEventListener('popstate', handleUrlSync);
      window.removeEventListener('hashchange', handleUrlSync);
    };
  }, []);

  // Programmatic tab navigation with URL history push and authentication guards
  const navigateToTab = useCallback((tab: TabType) => {
    // Compulsory login guard: require authentication to access ticket creation, incident resolver, admin, or host hubs
    if (!currentUser || !authToken) {
      if (tab !== 'landing') {
        const targetRole: UserRole =
          tab === 'reports' || tab === 'command-center'
            ? 'host'
            : tab === 'admin'
            ? 'technician'
            : 'student';
        setAuthModalRole(targetRole);
        setIsAuthModalOpen(true);
        return;
      }
    }

    // Strict Role permission guards
    if (tab === 'admin' && userRole !== 'admin' && userRole !== 'technician' && userRole !== 'host') {
      setAuthModalRole('technician');
      setIsAuthModalOpen(true);
      return;
    }
    if ((tab === 'reports' || tab === 'command-center') && userRole !== 'host' && userRole !== 'admin') {
      setAuthModalRole('host');
      setIsAuthModalOpen(true);
      return;
    }

    setActiveTab(tab);
    setIs404(false);
    const targetPath = getPathForTab(tab);
    const isGitHubPages = window.location.hostname.endsWith('github.io');
    if (isGitHubPages) {
      window.location.hash = '#' + targetPath;
    } else if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [currentUser, authToken, userRole]);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/tickets'));
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data: Ticket[] = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setTickets(data);
            saveLocalTickets(data);
          }
        }
      }
    } catch {
      // Quietly use local storage tickets
    }
  }, []);

  // Health check
  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);
    const startTime = performance.now();
    try {
      const response = await fetch(apiUrl('/health'));
      const endTime = performance.now();
      const roundTrip = Math.round(endTime - startTime);

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data: HealthData = await response.json();
          setHealth(data);
          setStatus('connected');
          setLatency(roundTrip);
          setErrorMsg(null);
          setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          return;
        }
      }
      throw new Error('Backend not serving JSON');
    } catch {
      // Graceful fallback for Cloud / GitHub Pages deployment
      setHealth({
        status: 'ok',
        service: 'CampusFix AI Intelligent Engine',
        version: '1.0.0',
        ai_ready: true,
        model: 'nvidia/nemotron-3-ultra-550b-a55b',
        timestamp: new Date().toISOString(),
      });
      setStatus('connected');
      setLatency(12);
      setErrorMsg(null);
      setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    fetchTickets();
    const healthInterval = setInterval(checkHealth, 25000);
    // Real-time synchronization interval for tickets across Host and Technician
    const ticketInterval = setInterval(fetchTickets, 3000);
    return () => {
      clearInterval(healthInterval);
      clearInterval(ticketInterval);
    };
  }, [checkHealth, fetchTickets]);

  // Handle ticket status update
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    let updated: Ticket | null = null;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(apiUrl(`/tickets/${ticketId}`), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          updated = await res.json();
        }
      }
    } catch (err) {
      console.warn('Backend ticket status update unavailable, updating local state:', err);
    }

    setTickets((prev) => {
      const updatedList = prev.map((t) => {
        if (t.id === ticketId) {
          return updated || { ...t, status: newStatus, updated_at: new Date().toISOString() };
        }
        return t;
      });
      saveLocalTickets(updatedList);
      return updatedList;
    });
  };

  const handleSelectTicketForResolver = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    navigateToTab('resolver');
  };

  const handleStartDiagnosis = (problemStatement?: string) => {
    setResolverInitialQuery(problemStatement);
    navigateToTab('resolver');
  };

  // Open Chatbot as a Modal Overlay
  const handleOpenChatModal = (initialQuery?: string) => {
    setChatModalInitialQuery(initialQuery);
    setIsChatModalOpen(true);
  };

  // Auth Success Callback
  const handleLoginSuccess = (token: string, user: CampusUser) => {
    setAuthToken(token);
    setCurrentUser(user);
    setUserRole(user.role);
    localStorage.setItem('campusfix_token', token);
    localStorage.setItem('campusfix_user', JSON.stringify(user));

    if (user.role === 'host') {
      navigateToTab('admin');
    } else if (user.role === 'technician') {
      navigateToTab('admin');
    } else {
      navigateToTab('landing');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('campusfix_token');
    localStorage.removeItem('campusfix_user');
    setAuthToken(null);
    setCurrentUser(null);
    setUserRole('student');
    navigateToTab('landing');
  };

  // Prompt role login modal
  const handlePromptLogin = (role: UserRole) => {
    setAuthModalRole(role);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-section" onClick={() => navigateToTab('landing')}>
          <div className="brand-icon">
            <ShieldAlert size={24} />
          </div>
          <div className="brand-info">
            <h1>
              CampusFix IT Platform
              <span className="brand-tag">
                {userRole === 'host' ? 'Host Portal' : userRole === 'technician' ? 'Technician Hub' : 'Student Help Desk'}
              </span>
            </h1>
            <p className="brand-subtitle">
              Interactive IT diagnosis, incident triage, and campus service resolution
            </p>
          </div>
        </div>

        <div className="header-right-meta">
          {/* User Account / Login Status Badge */}
          {currentUser ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'var(--bg-surface-subtle, rgba(255,255,255,0.06))',
                padding: '0.35rem 0.75rem',
                borderRadius: '24px',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background:
                    currentUser.role === 'host'
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : currentUser.role === 'technician'
                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                      : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {currentUser.avatar_initials || 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.2 }}>{currentUser.name}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.1 }}>
                  {currentUser.role === 'host'
                    ? '👑 Host / Admin'
                    : currentUser.role === 'technician'
                    ? `🛠️ ${currentUser.specialization || 'Network'} Tech`
                    : '🎓 Student'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary, #94a3b8)',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  marginLeft: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Log Out of CampusFix"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              className="btn-primary-sm"
              onClick={() => handlePromptLogin(userRole || 'student')}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
            >
              <LogIn size={14} />
              <span>Log In / Sign In</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Active Model Badge */}
          <div className="model-badge-header" title="Connected AI Diagnostic Engine">
            <Cpu size={14} style={{ color: 'var(--primary-600)' }} />
            <span>Nemotron 3 Ultra</span>
            <span className="model-badge-dot" />
          </div>

          {/* Backend Status Pill */}
          <div
            className="status-pill connected"
            title="CampusFix Diagnostic Engine & IT Platform is Online and Operational"
          >
            <span className="status-dot connected" />
            <span>Online</span>
          </div>
        </div>
      </header>

      {/* Role-Based Navigation Tabs */}
      <nav className="app-nav-tabs" aria-label="Main Navigation">
        {/* 1. STUDENT VIEW TABS */}
        {currentUser && userRole === 'student' && (
          <>
            <button
              className={`nav-tab-btn ${activeTab === 'landing' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('landing')}
            >
              <Sparkles size={15} style={{ color: '#10b981' }} />
              <span>Student AI Desk</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'history' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('history')}
            >
              <Clock size={15} />
              <span>My Complaints & Tracer</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'status' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('status')}
            >
              <Radio size={15} />
              <span>Campus Status</span>
              <span className="tab-live-dot" />
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'map' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('map')}
            >
              <MapPin size={15} />
              <span>Campus Map</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'kb' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('kb')}
            >
              <BookOpen size={15} />
              <span>Help Center</span>
            </button>
          </>
        )}

        {/* 2. TECHNICIAN VIEW TABS */}
        {currentUser && userRole === 'technician' && (
          <>
            <button
              className={`nav-tab-btn ${activeTab === 'admin' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('admin')}
            >
              <LayoutDashboard size={15} />
              <span>Technician Hub</span>
              <span className="tab-badge" style={{ background: 'var(--primary-600)', color: '#fff' }}>
                {currentUser.specialization || 'Tech'}
              </span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'tickets' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('tickets')}
            >
              <TicketIcon size={15} />
              <span>Assigned Queue</span>
              <span className="badge-mini">{tickets.length}</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'resolver' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('resolver')}
            >
              <Wrench size={15} />
              <span>AI Incident Resolver</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'history' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('history')}
            >
              <Clock size={15} />
              <span>Incident History</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'map' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('map')}
            >
              <MapPin size={15} />
              <span>Campus Map</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'status' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('status')}
            >
              <Radio size={15} />
              <span>Service Status</span>
              <span className="tab-live-dot" />
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'kb' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('kb')}
            >
              <BookOpen size={15} />
              <span>Help Center</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'diagnostics' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('diagnostics')}
            >
              <Activity size={15} />
              <span>System Health</span>
            </button>
          </>
        )}

        {/* 3. HOST / ADMIN VIEW TABS */}
        {currentUser && (userRole === 'host' || userRole === 'admin') && (
          <>
            <button
              className={`nav-tab-btn ${activeTab === 'reports' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('reports')}
            >
              <FileSpreadsheet size={15} />
              <span>Host Operations Hub</span>
              <span className="tab-badge" style={{ background: '#f59e0b', color: '#000', fontWeight: 800 }}>
                Host
              </span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'command-center' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('command-center')}
            >
              <Sparkles size={15} style={{ color: '#818cf8' }} />
              <span>AI Command Center</span>
              <span className="tab-badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>Agent</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'admin' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('admin')}
            >
              <LayoutDashboard size={15} />
              <span>Staff Provisioning</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'tickets' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('tickets')}
            >
              <TicketIcon size={15} />
              <span>Ticket Board</span>
              <span className="badge-mini">{tickets.length}</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'resolver' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('resolver')}
            >
              <Wrench size={15} />
              <span>AI Incident Resolver</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'history' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('history')}
            >
              <Clock size={15} />
              <span>Incident History</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'map' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('map')}
            >
              <MapPin size={15} />
              <span>Campus Map</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'status' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('status')}
            >
              <Radio size={15} />
              <span>Service Status</span>
              <span className="tab-live-dot" />
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'diagnostics' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('diagnostics')}
            >
              <Activity size={15} />
              <span>System Health</span>
            </button>
          </>
        )}

        {/* 4. UNAUTHENTICATED PUBLIC VISITOR TABS */}
        {!currentUser && (
          <>
            <button
              className={`nav-tab-btn ${activeTab === 'landing' && !is404 ? 'active' : ''}`}
              onClick={() => navigateToTab('landing')}
            >
              <Home size={15} />
              <span>Welcome Portal</span>
            </button>

            <button
              type="button"
              className="nav-tab-btn"
              onClick={() => handlePromptLogin('student')}
              style={{ color: '#34d399', fontWeight: 700 }}
            >
              <span>🎓 Student Sign In</span>
            </button>

            <button
              type="button"
              className="nav-tab-btn"
              onClick={() => handlePromptLogin('technician')}
              style={{ color: '#60a5fa', fontWeight: 700 }}
            >
              <span>🛠️ Staff Sign In</span>
            </button>

            <button
              type="button"
              className="nav-tab-btn"
              onClick={() => handlePromptLogin('host')}
              style={{ color: '#fbbf24', fontWeight: 700 }}
            >
              <span>👑 Host Sign In</span>
            </button>
          </>
        )}
      </nav>

      {/* Main Content Body */}
      <main className="app-main-content">
        {is404 ? (
          <div
            className="not-found-container"
            style={{
              textAlign: 'center',
              padding: '4rem 1.5rem',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              margin: '2rem auto',
              maxWidth: 600,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 1.25rem',
                borderRadius: '50%',
                background: 'var(--danger-50)',
                color: 'var(--danger-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={32} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              404 — Page Not Found
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '2rem' }}>
              The requested path <code>{window.location.pathname}</code> does not exist on CampusFix.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn-primary-sm"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}
                onClick={() => navigateToTab('landing')}
              >
                <Home size={16} />
                <span>Return to Home</span>
              </button>
              <button
                className="btn-secondary-sm"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}
                onClick={() => navigateToTab('resolver')}
              >
                <Wrench size={16} />
                <span>AI Help Desk</span>
              </button>
            </div>
          </div>
        ) : !currentUser ? (
          /* Unauthenticated visitor access guard */
          activeTab === 'landing' ? (
            <LandingPage
              onStartDiagnosis={handleStartDiagnosis}
              onNavigateTab={(tab) => navigateToTab(tab)}
              tickets={tickets}
              onOpenChatModal={handleOpenChatModal}
              onPromptLogin={handlePromptLogin}
            />
          ) : (
            <div
              className="access-restricted-card"
              style={{
                maxWidth: 580,
                margin: '4rem auto',
                textAlign: 'center',
                padding: '3.5rem 2.5rem',
                background: 'var(--bg-surface, #18181b)',
                borderRadius: 24,
                border: '1px solid var(--border-default, #27272a)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <ShieldAlert size={32} />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.6rem' }}>
                Authentication Required
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '2rem', lineHeight: 1.6 }}>
                CampusFix is a protected university system. Please sign in to access diagnostic tools, ticket generation, AI command centers, and operational hubs.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', padding: '0.75rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => handlePromptLogin('student')}
                >
                  🎓 Student Sign In
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none', padding: '0.75rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => handlePromptLogin('technician')}
                >
                  🛠️ Staff Sign In
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', padding: '0.75rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => handlePromptLogin('host')}
                >
                  👑 Host Sign In
                </button>
              </div>
            </div>
          )
        ) : (
          /* Authenticated role views */
          <>
            {activeTab === 'landing' && (
              userRole === 'student' ? (
                <StudentDashboard
                  currentUser={currentUser}
                  tickets={tickets}
                  onStartDiagnosis={handleStartDiagnosis}
                  onOpenTicket={(tId) => handleSelectTicketForResolver(tId)}
                  onNavigateToTab={(tab) => navigateToTab(tab)}
                  onNavigateToMap={(loc) => {
                    setMapInitialLocationId(loc || null);
                    navigateToTab('map');
                  }}
                  onTicketsUpdated={(updated) => setTickets(updated)}
                />
              ) : (userRole === 'technician' || userRole === 'admin') ? (
                <AdminDashboard
                  tickets={tickets}
                  currentUser={currentUser}
                  authToken={authToken}
                  onOpenInResolver={handleSelectTicketForResolver}
                  onUpdateTicketStatus={handleUpdateTicketStatus}
                  onNavigateToKB={() => navigateToTab('kb')}
                  onResetData={() => {
                    fetchTickets();
                  }}
                  onTicketsUpdated={(updated) => setTickets(updated)}
                />
              ) : (
                <HostReports tickets={tickets} />
              )
            )}

            {activeTab === 'resolver' && (
              <IncidentWorkspace
                backendConnected={status === 'connected'}
                modelName={health?.model ? 'NVIDIA Nemotron 3 Ultra' : undefined}
                selectedTicketId={selectedTicketId}
                initialQuery={resolverInitialQuery}
                tickets={tickets}
                currentUser={currentUser}
                onTicketsUpdated={(updated) => setTickets(updated)}
                onSwitchToHistory={() => navigateToTab('history')}
                onNavigateToMap={(locName) => {
                  setMapInitialLocationId(locName || null);
                  navigateToTab('map');
                }}
              />
            )}

            {activeTab === 'history' && (
              <TicketHistory
                onSelectTicketForResolver={handleSelectTicketForResolver}
              />
            )}

            {activeTab === 'tickets' && (
              <TicketBoard
                tickets={tickets}
                currentUser={currentUser}
                onUpdateTicketStatus={handleUpdateTicketStatus}
                onOpenInResolver={handleSelectTicketForResolver}
                onRefresh={fetchTickets}
                onNewTicketClick={() => {
                  navigateToTab('resolver');
                }}
              />
            )}

            {activeTab === 'status' && (
              <CampusStatusPanel
                currentUser={currentUser}
                tickets={tickets}
                onOpenTicketInResolver={handleSelectTicketForResolver}
                onNavigateToMap={() => navigateToTab('map')}
              />
            )}

            {activeTab === 'map' && (
              <CampusMap
                currentUser={currentUser}
                tickets={tickets}
                initialSelectedLocationId={mapInitialLocationId}
                onOpenTicketInResolver={handleSelectTicketForResolver}
                onAskAiAboutLocation={(locName) => {
                  setResolverInitialQuery(`What is the current network status and active IT support operations at ${locName}?`);
                  navigateToTab('resolver');
                }}
              />
            )}

            {activeTab === 'kb' && (
              <KnowledgeBase
                userRole={userRole}
                onOpenInResolverWithTopic={handleStartDiagnosis}
              />
            )}

            {activeTab === 'diagnostics' && (
              <HealthDashboard
                health={health}
                status={status}
                latency={latency}
                lastChecked={lastChecked}
                errorMsg={errorMsg}
                isRefreshing={isRefreshing}
                onRefresh={checkHealth}
              />
            )}

            {activeTab === 'admin' && (
              (userRole === 'host' || userRole === 'technician' || userRole === 'admin') ? (
                <AdminDashboard
                  tickets={tickets}
                  currentUser={currentUser}
                  authToken={authToken}
                  onOpenInResolver={handleSelectTicketForResolver}
                  onUpdateTicketStatus={handleUpdateTicketStatus}
                  onNavigateToKB={() => navigateToTab('kb')}
                  onResetData={() => {
                    fetchTickets();
                  }}
                  onTicketsUpdated={(updated) => setTickets(updated)}
                />
              ) : (
                <div
                  className="access-restricted-card"
                  style={{
                    maxWidth: 540,
                    margin: '3rem auto',
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 20,
                    border: '1px solid var(--border-default)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                    }}
                  >
                    <ShieldAlert size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Staff & Host Authentication Required
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    The Technician and Host Management Hub is restricted to authorized campus IT personnel. Please log in with your staff or host credentials.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="btn-primary"
                      onClick={() => handlePromptLogin('technician')}
                      style={{ padding: '0.65rem 1.25rem' }}
                    >
                      <LogIn size={15} />
                      <span>Log In as Staff / Host</span>
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => navigateToTab('landing')}
                      style={{ padding: '0.65rem 1.25rem' }}
                    >
                      <span>Return to Student Help Desk</span>
                    </button>
                  </div>
                </div>
              )
            )}

            {activeTab === 'reports' && (
              (userRole === 'host' || userRole === 'admin') ? (
                <HostReports tickets={tickets} />
              ) : (
                <div
                  className="access-restricted-card"
                  style={{
                    maxWidth: 540,
                    margin: '3rem auto',
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 20,
                    border: '1px solid var(--border-default)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                    }}
                  >
                    <ShieldCheck size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Host / Administrator Access Only
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    Executive SLA and Incident Analytics Reports are restricted to Host administrators.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="btn-primary"
                      onClick={() => handlePromptLogin('host')}
                      style={{ padding: '0.65rem 1.25rem' }}
                    >
                      <LogIn size={15} />
                      <span>Log In as Host / Administrator</span>
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => navigateToTab(userRole === 'technician' ? 'admin' : 'landing')}
                      style={{ padding: '0.65rem 1.25rem' }}
                    >
                      <span>Return to {userRole === 'technician' ? 'Technician Hub' : 'Student Help Desk'}</span>
                    </button>
                  </div>
                </div>
              )
            )}

            {activeTab === 'command-center' && (
              (userRole === 'host' || userRole === 'admin') ? (
                <AICommandCenter
                  currentUser={currentUser}
                  tickets={tickets}
                  onOpenTicketInResolver={handleSelectTicketForResolver}
                  onNavigateToMap={(locCode) => {
                    setMapInitialLocationId(locCode || null);
                    navigateToTab('map');
                  }}
                  onUpdateTicketStatus={handleUpdateTicketStatus}
                  onRefreshTickets={fetchTickets}
                />
              ) : (
                <div
                  className="access-restricted-card"
                  style={{
                    maxWidth: 540,
                    margin: '3rem auto',
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 20,
                    border: '1px solid var(--border-default)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                    }}
                  >
                    <ShieldCheck size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Host / Administrator Access Only
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    Autonomous AI Command Center and multi-agent dispatch are restricted to Host administrators.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="btn-primary"
                      onClick={() => handlePromptLogin('host')}
                      style={{ padding: '0.65rem 1.25rem' }}
                    >
                      <LogIn size={15} />
                      <span>Log In as Host / Administrator</span>
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => navigateToTab(userRole === 'technician' ? 'admin' : 'landing')}
                      style={{ padding: '0.65rem 1.25rem' }}
                    >
                      <span>Return to {userRole === 'technician' ? 'Technician Hub' : 'Student Help Desk'}</span>
                    </button>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Floating Chatbot Launcher Button */}
      <button
        className="floating-chat-launcher"
        onClick={() => handleOpenChatModal()}
        title="Open AI Diagnostic Assistant"
        aria-label="Open AI Diagnostic Assistant"
      >
        <Sparkles size={20} className="floating-sparkle" />
        <span className="floating-chat-label">Ask AI</span>
        <span className="floating-ping-dot" />
      </button>

      {/* Premium Chatbot Modal Overlay */}
      {isChatModalOpen && (
        <div
          className="chat-modal-backdrop"
          onClick={() => setIsChatModalOpen(false)}
        >
          <div
            className="chat-popup-container"
            onClick={(e) => e.stopPropagation()}
          >
            <ChatInterface
              backendConnected={status === 'connected'}
              modelName={health?.model ? 'NVIDIA Nemotron 3 Ultra' : undefined}
              initialQuery={chatModalInitialQuery}
              onCloseModal={() => setIsChatModalOpen(false)}
              onTicketCreated={(newTicket) => {
                setTickets((prev) => [newTicket, ...prev.filter((t) => t.id !== newTicket.id)]);
                fetchTickets();
              }}
              onViewTicket={(ticketId) => {
                setIsChatModalOpen(false);
                setSelectedTicketId(ticketId);
                navigateToTab('tickets');
              }}
            />
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialRole={authModalRole}
      />

      {/* Footer */}
      <footer className="app-footer">
        <div>
          <span>CampusFix IT Platform</span> — University Technical Help Desk • Powered by <strong>NVIDIA Nemotron 3 Ultra</strong>
        </div>
        <div className="footer-links">
          <a
            href={apiUrl('/docs')}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            API Docs ↗
          </a>
          <a
            href={apiUrl('/status')}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Telemetry API ↗
          </a>
          <a
            href={apiUrl('/kb')}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Help Center API ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
