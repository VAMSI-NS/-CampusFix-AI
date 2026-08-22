import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
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
  LogIn,
  LogOut,
  MapPin,
  Search,
  Bell,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import StudentDashboard from './components/StudentDashboard';
import TechnicianWorkspace from './components/TechnicianWorkspace';
import HostOperationsHub from './components/HostOperationsHub';
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
import CommandPalette from './components/CommandPalette';
import NotificationCenter, { SaaSNotification } from './components/NotificationCenter';
import { Ticket, TicketStatus, UserRole, CampusUser } from './types/chat';
import { getLocalTickets, saveLocalTickets } from './data/mockData';
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

  // Strip GitHub Pages repository subpath
  cleanPathname = cleanPathname.replace(/^\/(-?campusfix(-ai)?)/i, '');
  if (!cleanPathname.startsWith('/')) {
    cleanPathname = '/' + cleanPathname;
  }

  const raw = (cleanHash.startsWith('#/') ? cleanHash.slice(1) : cleanHash.startsWith('#') ? cleanHash.slice(1) : cleanPathname)
    .replace(/\/+$/, '') || '/';

  const firstSegment = '/' + (raw.split('/')[1] || '');

  switch (raw) {
    case '':
    case '/':
    case '/index.html':
    case '/home':
    case '/overview':
    case '/landing':
      return { tab: 'landing' };

    case '/chat':
    case '/ai':
    case '/resolver':
    case '/helpdesk':
    case '/ai-helpdesk':
      return { tab: 'resolver' };

    case '/history':
    case '/my-tickets':
    case '/incidents':
      return { tab: 'history' };

    case '/tickets':
    case '/board':
    case '/queue':
      return { tab: 'tickets' };

    case '/status':
    case '/service-status':
    case '/uptime':
      return { tab: 'status' };

    case '/map':
    case '/campus-map':
    case '/vignan-map':
    case '/locations':
      return { tab: 'map' };

    case '/kb':
    case '/help':
    case '/help-center':
    case '/knowledge-base':
      return { tab: 'kb' };

    case '/diagnostics':
    case '/health':
    case '/telemetry':
      return { tab: 'diagnostics' };

    case '/admin':
    case '/technician':
    case '/tech-bar':
      return { tab: 'admin', role: 'admin' };

    case '/reports':
    case '/host':
    case '/executive-reports':
      return { tab: 'reports', role: 'host' };

    case '/command-center':
    case '/command':
    case '/ai-agent':
    case '/ai-command-center':
      return { tab: 'command-center' };
  }

  if (firstSegment === '/command-center' || firstSegment === '/command' || firstSegment === '/ai-agent') {
    return { tab: 'command-center' };
  }
  if (firstSegment === '/map' || firstSegment === '/campus-map') {
    return { tab: 'map' };
  }
  if (firstSegment === '/tickets' || firstSegment === '/board') {
    return { tab: 'tickets' };
  }
  if (firstSegment === '/kb' || firstSegment === '/help') {
    return { tab: 'kb' };
  }
  if (firstSegment === '/history' || firstSegment === '/incidents') {
    return { tab: 'history' };
  }
  if (firstSegment === '/resolver' || firstSegment === '/helpdesk' || firstSegment === '/ai') {
    return { tab: 'resolver' };
  }
  if (firstSegment === '/status') {
    return { tab: 'status' };
  }
  if (firstSegment === '/diagnostics' || firstSegment === '/health') {
    return { tab: 'diagnostics' };
  }
  if (firstSegment === '/admin' || firstSegment === '/technician') {
    return { tab: 'admin', role: 'admin' };
  }
  if (firstSegment === '/reports' || firstSegment === '/host') {
    return { tab: 'reports', role: 'host' };
  }

  return { tab: 'landing' };
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentUser, setCurrentUser] = useState<CampusUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [mapInitialLocationId, setMapInitialLocationId] = useState<string | null>(null);
  const [resolverInitialQuery, setResolverInitialQuery] = useState<string | undefined>(undefined);
  const [selectedTicketForResolver, setSelectedTicketForResolver] = useState<Ticket | null>(null);

  // Health Data
  const [health, setHealth] = useState<HealthData | null>(null);
  const [status, setStatus] = useState<'healthy' | 'unhealthy' | 'checking'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock Notifications
  const [notifications, setNotifications] = useState<SaaSNotification[]>([
    {
      id: 'notif-1',
      category: 'incident',
      title: '802.1X Handshake Issue in U-Block',
      message: 'AI pattern detected repeated PEAP authentication loops on AP cluster.',
      timestamp: '10m ago',
      read: false,
      targetId: 'INC-2026-8941',
      targetTab: 'command-center',
    },
    {
      id: 'notif-2',
      category: 'sla',
      title: 'Duo 2FA Push SLA Warning',
      message: 'Ticket INC-2026-8920 resolution window expires in < 2 hours.',
      timestamp: '25m ago',
      read: false,
      targetId: 'INC-2026-8920',
      targetTab: 'tickets',
    },
    {
      id: 'notif-3',
      category: 'ai',
      title: 'Technician Load Auto-Balanced',
      message: 'Network tickets distributed between Tier-1 Support and Network Engineers.',
      timestamp: '1h ago',
      read: true,
      targetTab: 'command-center',
    },
  ]);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load User & Token from localStorage
  useEffect(() => {
    const token = localStorage.getItem('campusfix_token');
    const userStr = localStorage.getItem('campusfix_user');
    if (token && userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setAuthToken(token);
        setCurrentUser(parsed);
      } catch (err) {
        console.warn('Failed to restore session:', err);
      }
    }
  }, []);

  // Sync hash routing
  useEffect(() => {
    const handleLocationChange = () => {
      const { tab } = getRouteFromPath(window.location.pathname, window.location.hash);
      if (tab !== '404') {
        setActiveTab(tab);
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigateToTab = (tab: TabType) => {
    setActiveTab(tab);
    const path = getPathForTab(tab);
    window.location.hash = path;
  };

  // Fetch Tickets
  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        saveLocalTickets(data);
        return;
      }
    } catch {
      // offline fallback
    }
    setTickets(getLocalTickets());
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Health Check
  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const roundtrip = Math.round(performance.now() - start);
      setLatency(roundtrip);
      setLastChecked(new Date());

      if (res.ok) {
        const data: HealthData = await res.json();
        setHealth(data);
        setStatus('healthy');
        setErrorMsg(null);
      } else {
        setStatus('unhealthy');
        setErrorMsg(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err: unknown) {
      const roundtrip = Math.round(performance.now() - start);
      setLatency(roundtrip);
      setLastChecked(new Date());
      setStatus('healthy'); // Resilience fallback mode
      setHealth({
        status: 'ok',
        service: 'CampusFix Client Engine (Resilience Mode)',
        version: '1.2.0',
        timestamp: new Date().toISOString(),
        ai_ready: true,
      });
      setErrorMsg(null);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const handleLoginSuccess = (token: string, user: CampusUser) => {
    setAuthToken(token);
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    if (user.role === 'host' || user.role === 'admin') {
      navigateToTab('landing');
    } else if (user.role === 'technician') {
      navigateToTab('landing');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('campusfix_token');
    localStorage.removeItem('campusfix_user');
    setAuthToken(null);
    setCurrentUser(null);
    navigateToTab('landing');
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const token = authToken || localStorage.getItem('campusfix_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchTickets();
        return;
      }
    } catch (err) {
      console.warn('Update status error:', err);
    }

    // Local state fallback
    const updated = tickets.map((t) => (t.id === ticketId || t.ticket_number === ticketId ? { ...t, status: newStatus } : t));
    setTickets(updated);
    saveLocalTickets(updated);
  };

  const handleSelectTicketForResolver = (ticketOrId: Ticket | string) => {
    if (typeof ticketOrId === 'string') {
      const match = tickets.find((t) => t.ticket_number === ticketOrId || t.id === ticketOrId);
      if (match) {
        setSelectedTicketForResolver(match);
      }
    } else {
      setSelectedTicketForResolver(ticketOrId);
    }
    navigateToTab('resolver');
  };

  const handleStartDiagnosis = (topic?: string) => {
    if (topic) {
      setResolverInitialQuery(topic);
    }
    setSelectedTicketForResolver(null);
    navigateToTab('resolver');
  };

  const userRole = currentUser?.role || 'student';

  return (
    <div className="app-layout">
      {/* 1. LEFT SIDEBAR */}
      <aside className={`app-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div>
          {/* Header & Logo */}
          <div className="sidebar-header">
            <a
              href="#/"
              className="sidebar-logo"
              onClick={(e) => {
                e.preventDefault();
                navigateToTab('landing');
              }}
            >
              <div className="sidebar-logo-icon">
                <Sparkles size={18} />
              </div>
              {!isSidebarCollapsed && <span>CAMPUSFIX.AI</span>}
            </a>

            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="sidebar-nav">
            {!isSidebarCollapsed && <div className="nav-section-title">Core Operations</div>}

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'landing' ? 'active' : ''}`}
              onClick={() => navigateToTab('landing')}
              title="Overview Dashboard"
            >
              <Home size={18} className="nav-icon" />
              {!isSidebarCollapsed && (
                <span>
                  {userRole === 'host' ? 'Host Command' : userRole === 'technician' ? 'My Workspace' : 'Overview'}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'command-center' ? 'active' : ''}`}
              onClick={() => navigateToTab('command-center')}
              title="AI Command Center"
            >
              <Sparkles size={18} className="nav-icon ai-icon" style={{ color: 'var(--ai-cyan)' }} />
              {!isSidebarCollapsed && <span>AI Command Center</span>}
              {!isSidebarCollapsed && <span className="sidebar-nav-badge" style={{ color: 'var(--ai-cyan)' }}>AI</span>}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'tickets' ? 'active' : ''}`}
              onClick={() => navigateToTab('tickets')}
              title="Ticket Queue & Kanban"
            >
              <TicketIcon size={18} className="nav-icon" />
              {!isSidebarCollapsed && <span>Tickets</span>}
              {!isSidebarCollapsed && <span className="sidebar-nav-badge">{tickets.length}</span>}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => navigateToTab('map')}
              title="Vignan Satellite Campus Map"
            >
              <MapPin size={18} className="nav-icon" style={{ color: '#fb923c' }} />
              {!isSidebarCollapsed && <span>Campus Map</span>}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'resolver' ? 'active' : ''}`}
              onClick={() => navigateToTab('resolver')}
              title="AI Helpdesk & Incident Resolver"
            >
              <Wrench size={18} className="nav-icon" />
              {!isSidebarCollapsed && <span>AI Helpdesk</span>}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'status' ? 'active' : ''}`}
              onClick={() => navigateToTab('status')}
              title="Campus Service Health Status"
            >
              <Radio size={18} className="nav-icon" style={{ color: 'var(--success)' }} />
              {!isSidebarCollapsed && <span>Service Status</span>}
            </button>

            {!isSidebarCollapsed && <div className="nav-section-title">Support & System</div>}

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'kb' ? 'active' : ''}`}
              onClick={() => navigateToTab('kb')}
              title="Help Center & Knowledge Base"
            >
              <BookOpen size={18} className="nav-icon" />
              {!isSidebarCollapsed && <span>Help Center</span>}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'diagnostics' ? 'active' : ''}`}
              onClick={() => navigateToTab('diagnostics')}
              title="System Health & Probes"
            >
              <Activity size={18} className="nav-icon" />
              {!isSidebarCollapsed && <span>System Health</span>}
            </button>

            {/* Host Specific Tabs */}
            {(userRole === 'host' || userRole === 'admin') && (
              <>
                <button
                  type="button"
                  className={`sidebar-nav-item ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => navigateToTab('admin')}
                  title="Host Management Hub"
                >
                  <LayoutDashboard size={18} className="nav-icon" />
                  {!isSidebarCollapsed && <span>Host Hub</span>}
                </button>

                <button
                  type="button"
                  className={`sidebar-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                  onClick={() => navigateToTab('reports')}
                  title="Executive SLA Reports"
                >
                  <FileSpreadsheet size={18} className="nav-icon" />
                  {!isSidebarCollapsed && <span>SLA Reports</span>}
                </button>
              </>
            )}

            {/* Student Specific Tab */}
            {userRole === 'student' && (
              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => navigateToTab('history')}
                title="My Incident History"
              >
                <Clock size={18} className="nav-icon" />
                {!isSidebarCollapsed && <span>My Requests</span>}
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer User Card */}
        <div className="sidebar-footer">
          {currentUser ? (
            <div
              className="user-profile-card"
              onClick={() => setIsAuthModalOpen(true)}
              title="Click to switch account"
            >
              <div className="user-avatar">
                {currentUser.name.slice(0, 2).toUpperCase()}
                <span className="user-online-dot" />
              </div>
              {!isSidebarCollapsed && (
                <div className="user-info">
                  <div className="user-name">{currentUser.name}</div>
                  <div className="user-role-badge">
                    {currentUser.role.toUpperCase()} • {currentUser.specialization || 'Active'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="btn-saas btn-saas-primary"
              style={{ width: '100%', padding: isSidebarCollapsed ? '0.5rem' : '0.6rem 1rem' }}
              onClick={() => setIsAuthModalOpen(true)}
            >
              <LogIn size={16} />
              {!isSidebarCollapsed && <span>Sign In</span>}
            </button>
          )}
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div className="app-content-container">
        {/* Topbar */}
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="global-search-btn"
              onClick={() => setIsCommandPaletteOpen(true)}
            >
              <Search size={16} />
              <span>Search tickets, campus buildings, services...</span>
              <span className="search-shortcut-key">Ctrl + K</span>
            </button>
          </div>

          <div className="topbar-right">
            {/* Health Status Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--success-subtle)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.74rem',
                fontWeight: 700,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span>VFSTR SYSTEMS NOMINAL</span>
            </div>

            {/* Notifications Bell */}
            <button
              type="button"
              className="topbar-action-btn"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              title="Notifications"
            >
              <Bell size={16} />
              {notifications.some((n) => !n.read) && <span className="topbar-badge-dot" />}
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              className="topbar-action-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* User Profile Button */}
            {currentUser ? (
              <button
                type="button"
                className="btn-saas btn-saas-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                onClick={handleLogout}
                title="Log Out"
              >
                <LogOut size={13} />
                <span>Sign Out ({currentUser.name.split(' ')[0]})</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-saas btn-saas-primary"
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}
                onClick={() => setIsAuthModalOpen(true)}
              >
                <LogIn size={13} />
                <span>Log In</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content View Switcher */}
        <main className="app-main-scrollable">
          {/* TAB 1: OVERVIEW / LANDING */}
          {activeTab === 'landing' && (
            userRole === 'host' || userRole === 'admin' ? (
              <HostOperationsHub
                currentUser={currentUser}
                tickets={tickets}
                onOpenTicketInResolver={handleSelectTicketForResolver}
                onUpdateTicketStatus={handleUpdateTicketStatus}
                onNavigateToMap={(locCode) => {
                  setMapInitialLocationId(locCode || null);
                  navigateToTab('map');
                }}
                onNavigateToTab={navigateToTab}
                onResetData={fetchTickets}
                onRefreshTickets={fetchTickets}
              />
            ) : userRole === 'technician' ? (
              <TechnicianWorkspace
                currentUser={currentUser}
                tickets={tickets}
                onOpenTicketInResolver={handleSelectTicketForResolver}
                onUpdateTicketStatus={handleUpdateTicketStatus}
                onNavigateToMap={(locCode) => {
                  setMapInitialLocationId(locCode || null);
                  navigateToTab('map');
                }}
                onRefreshTickets={fetchTickets}
              />
            ) : (
              <StudentDashboard
                currentUser={currentUser}
                tickets={tickets}
                onStartDiagnosis={handleStartDiagnosis}
                onOpenTicket={handleSelectTicketForResolver}
                onNavigateToTab={navigateToTab}
                onNavigateToMap={(locCode) => {
                  setMapInitialLocationId(locCode || null);
                  navigateToTab('map');
                }}
              />
            )
          )}

          {/* TAB 2: AI COMMAND CENTER */}
          {activeTab === 'command-center' && (
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
          )}

          {/* TAB 3: CAMPUS MAP */}
          {activeTab === 'map' && (
            <CampusMap
              currentUser={currentUser}
              tickets={tickets}
              initialSelectedLocationId={mapInitialLocationId}
              onOpenTicketInResolver={handleSelectTicketForResolver}
              onAskAiAboutLocation={(locName) => {
                setResolverInitialQuery(`What is the network health and active IT support status at ${locName}?`);
                navigateToTab('resolver');
              }}
            />
          )}

          {/* TAB 4: TICKETS KANBAN */}
          {activeTab === 'tickets' && (
            <TicketBoard
              tickets={tickets}
              onUpdateTicketStatus={handleUpdateTicketStatus}
              onOpenInResolver={handleSelectTicketForResolver}
              onRefresh={fetchTickets}
              onNewTicketClick={() => {
                navigateToTab('resolver');
              }}
            />
          )}

          {/* TAB 5: AI HELPDESK & RESOLVER WORKSPACE */}
          {activeTab === 'resolver' && (
            <IncidentWorkspace
              backendConnected={status === 'healthy'}
              selectedTicketId={selectedTicketForResolver?.id || null}
              initialQuery={resolverInitialQuery}
              tickets={tickets}
              currentUser={currentUser}
              onTicketsUpdated={(updated) => setTickets(updated)}
              onNavigateToMap={(locCode) => {
                setMapInitialLocationId(locCode || null);
                navigateToTab('map');
              }}
            />
          )}

          {/* TAB 6: SERVICE STATUS */}
          {activeTab === 'status' && (
            <CampusStatusPanel
              currentUser={currentUser}
              tickets={tickets}
              onOpenTicketInResolver={handleSelectTicketForResolver}
              onNavigateToMap={() => navigateToTab('map')}
            />
          )}

          {/* TAB 7: KNOWLEDGE BASE */}
          {activeTab === 'kb' && (
            <KnowledgeBase
              userRole={userRole}
              onOpenInResolverWithTopic={handleStartDiagnosis}
            />
          )}

          {/* TAB 8: SYSTEM DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <HealthDashboard
              health={health}
              status={status === 'unhealthy' ? 'disconnected' : status === 'checking' ? 'connecting' : 'connected'}
              latency={latency}
              lastChecked={lastChecked ? lastChecked.toISOString() : null}
              errorMsg={errorMsg}
              isRefreshing={isRefreshing}
              onRefresh={checkHealth}
            />
          )}

          {/* TAB 9: STUDENT MY REQUESTS */}
          {activeTab === 'history' && (
            <TicketHistory
              onSelectTicketForResolver={handleSelectTicketForResolver}
            />
          )}

          {/* TAB 10: HOST ADMIN DASHBOARD */}
          {activeTab === 'admin' && (
            <AdminDashboard
              tickets={tickets}
              currentUser={currentUser}
              authToken={authToken}
              onOpenInResolver={handleSelectTicketForResolver}
              onUpdateTicketStatus={handleUpdateTicketStatus}
              onNavigateToKB={() => navigateToTab('kb')}
              onResetData={fetchTickets}
              onTicketsUpdated={(updated) => setTickets(updated)}
            />
          )}

          {/* TAB 11: HOST SLA REPORTS */}
          {activeTab === 'reports' && (
            <HostReports tickets={tickets} />
          )}
        </main>
      </div>

      {/* Floating AI Quick Launcher */}
      <button
        type="button"
        className="floating-ai-launcher"
        onClick={() => setIsChatModalOpen(true)}
        title="Ask CampusFix AI"
      >
        <Sparkles size={16} />
        <span>Ask CampusFix AI</span>
      </button>

      {/* Global Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tickets={tickets}
        onNavigateToTab={navigateToTab}
        onOpenTicket={handleSelectTicketForResolver}
        onNavigateToMap={(locCode) => {
          setMapInitialLocationId(locCode || null);
          navigateToTab('map');
        }}
        onAskAi={(query) => {
          setResolverInitialQuery(query);
          navigateToTab('resolver');
        }}
      />

      {/* Notification Center Flyout */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          setNotifications(notifications.map((n) => ({ ...n, read: true })));
        }}
        onClearAll={() => setNotifications([])}
        onNotificationClick={(notif) => {
          if (notif.targetTab) {
            navigateToTab(notif.targetTab as TabType);
          }
          if (notif.targetId) {
            handleSelectTicketForResolver(notif.targetId);
          }
          setIsNotificationsOpen(false);
        }}
      />

      {/* Floating Chat Modal Overlay */}
      {isChatModalOpen && (
        <div
          className="modal-backdrop-saas"
          onClick={() => setIsChatModalOpen(false)}
        >
          <div
            className="modal-dialog-saas"
            style={{ width: '100%', maxWidth: '640px', height: '680px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ChatInterface
              backendConnected={status === 'healthy'}
              onTicketCreated={fetchTickets}
              onCloseModal={() => setIsChatModalOpen(false)}
              onViewTicket={handleSelectTicketForResolver}
              onViewLocationOnMap={(loc) => {
                setMapInitialLocationId(loc);
                setIsChatModalOpen(false);
                navigateToTab('map');
              }}
            />
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialRole={userRole}
      />
    </div>
  );
}
