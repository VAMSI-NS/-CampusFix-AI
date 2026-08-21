import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Wrench,
  Clock,
  Radio,
  BookOpen,
  LayoutDashboard,
  FileSpreadsheet,
  Moon,
  Sun,
  UserCheck,
  Home,
  Ticket as TicketIcon,
  Activity,
  Cpu,
  Sparkles,
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import IncidentWorkspace from './components/IncidentWorkspace';
import ChatInterface from './components/ChatInterface';
import TicketHistory from './components/TicketHistory';
import TicketBoard from './components/TicketBoard';
import CampusStatusPanel from './components/CampusStatusPanel';
import KnowledgeBase from './components/KnowledgeBase';
import HealthDashboard from './components/HealthDashboard';
import AdminDashboard from './components/AdminDashboard';
import HostReports from './components/HostReports';
import { Ticket, TicketStatus, UserRole } from './types/chat';
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
  | 'kb'
  | 'diagnostics'
  | 'admin'
  | 'reports';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('campusfix_theme') as 'light' | 'dark') || 'dark';
  });

  const [tickets, setTickets] = useState<Ticket[]>([]);
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

  // Apply Theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('campusfix_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data: Ticket[] = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Failed to load tickets in App:', err);
    }
  }, []);

  // Health check
  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);
    const startTime = performance.now();
    try {
      const response = await fetch('/api/health');
      const endTime = performance.now();
      const roundTrip = Math.round(endTime - startTime);
      setLatency(roundTrip);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data: HealthData = await response.json();
      setHealth(data);
      setStatus('connected');
      setErrorMsg(null);
      setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      setStatus('disconnected');
      setErrorMsg(err instanceof Error ? err.message : 'Unable to connect to backend');
      setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    fetchTickets();
    const interval = setInterval(checkHealth, 25000);
    return () => clearInterval(interval);
  }, [checkHealth, fetchTickets]);

  // Handle ticket status update
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated: Ticket = await res.json();
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    }
  };

  const handleSelectTicketForResolver = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveTab('resolver');
  };

  const handleStartDiagnosis = (problemStatement?: string) => {
    setResolverInitialQuery(problemStatement);
    setActiveTab('resolver');
  };

  // Open Chatbot as a Premium Modal Overlay directly on the Home Page
  const handleOpenChatModal = (initialQuery?: string) => {
    setChatModalInitialQuery(initialQuery);
    setIsChatModalOpen(true);
  };

  // Role changes
  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    if (newRole === 'host') {
      setActiveTab('reports');
    } else if (newRole === 'admin' && activeTab === 'reports') {
      setActiveTab('admin');
    } else if (newRole === 'student' && (activeTab === 'admin' || activeTab === 'reports')) {
      setActiveTab('landing');
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-section" onClick={() => userRole !== 'host' && setActiveTab('landing')}>
          <div className="brand-icon">
            <ShieldAlert size={24} />
          </div>
          <div className="brand-info">
            <h1>
              CampusFix IT Platform
              <span className="brand-tag">Student Help Desk</span>
            </h1>
            <p className="brand-subtitle">
              Interactive IT diagnosis, incident triage, and campus service resolution
            </p>
          </div>
        </div>

        <div className="header-right-meta">
          {/* Role Switcher */}
          <div className="role-switcher-wrap">
            <UserCheck size={14} style={{ color: 'var(--primary-600)' }} />
            <select
              className="role-select"
              value={userRole}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              title="Switch user access role"
            >
              <option value="student">Student / User View</option>
              <option value="admin">IT Technician View</option>
              <option value="host">Management (Reports Only)</option>
            </select>
          </div>

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
          <div className={`status-pill ${status}`}>
            <span className={`status-dot ${status}`} />
            <span>
              {status === 'connected' && 'Online'}
              {status === 'connecting' && 'Connecting...'}
              {status === 'disconnected' && 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="app-nav-tabs" aria-label="Main Navigation">
        {userRole === 'host' ? (
          <button className="nav-tab-btn active" onClick={() => setActiveTab('reports')}>
            <FileSpreadsheet size={15} />
            <span>Executive SLA Reports</span>
            <span className="tab-badge read-only">Read-Only</span>
          </button>
        ) : (
          <>
            <button
              className={`nav-tab-btn ${activeTab === 'landing' ? 'active' : ''}`}
              onClick={() => setActiveTab('landing')}
            >
              <Home size={15} />
              <span>Home</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'resolver' ? 'active' : ''}`}
              onClick={() => setActiveTab('resolver')}
            >
              <Wrench size={15} />
              <span>AI Help Desk</span>
              <span className="tab-badge">Diagnostic</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <Clock size={15} />
              <span>Incident History</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
              onClick={() => setActiveTab('tickets')}
            >
              <TicketIcon size={15} />
              <span>Ticket Board</span>
              <span className="badge-mini">{tickets.length}</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'status' ? 'active' : ''}`}
              onClick={() => setActiveTab('status')}
            >
              <Radio size={15} />
              <span>Service Status</span>
              <span className="tab-live-dot" />
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'kb' ? 'active' : ''}`}
              onClick={() => setActiveTab('kb')}
            >
              <BookOpen size={15} />
              <span>Help Center</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
              onClick={() => setActiveTab('diagnostics')}
            >
              <Activity size={15} />
              <span>System Health</span>
            </button>

            {userRole === 'admin' && (
              <button
                className={`nav-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <LayoutDashboard size={15} />
                <span>Technician Hub</span>
              </button>
            )}
          </>
        )}
      </nav>

      {/* Main Content Body */}
      <main className="app-main-content">
        {userRole === 'host' ? (
          <HostReports tickets={tickets} />
        ) : (
          <>
            {activeTab === 'landing' && (
              <LandingPage
                onStartDiagnosis={handleStartDiagnosis}
                onNavigateTab={(tab) => setActiveTab(tab)}
                tickets={tickets}
                onOpenChatModal={handleOpenChatModal}
              />
            )}

            {activeTab === 'resolver' && (
              <IncidentWorkspace
                backendConnected={status === 'connected'}
                modelName={health?.model ? 'NVIDIA Nemotron 3 Ultra' : undefined}
                selectedTicketId={selectedTicketId}
                initialQuery={resolverInitialQuery}
                tickets={tickets}
                onTicketsUpdated={(updated) => setTickets(updated)}
                onSwitchToHistory={() => setActiveTab('history')}
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
                onUpdateTicketStatus={handleUpdateTicketStatus}
                onOpenInResolver={handleSelectTicketForResolver}
                onRefresh={fetchTickets}
                onNewTicketClick={() => {
                  setActiveTab('resolver');
                }}
              />
            )}

            {activeTab === 'status' && (
              <CampusStatusPanel />
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

            {activeTab === 'admin' && userRole === 'admin' && (
              <AdminDashboard
                tickets={tickets}
                onOpenInResolver={handleSelectTicketForResolver}
                onUpdateTicketStatus={handleUpdateTicketStatus}
                onNavigateToKB={() => setActiveTab('kb')}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Chatbot Launcher Button */}
      {userRole !== 'host' && (
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
      )}

      {/* Premium Chatbot Modal Overlay with Backdrop Blur */}
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
                setActiveTab('tickets');
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div>
          <span>CampusFix IT Platform</span> — University Technical Help Desk • Powered by <strong>NVIDIA Nemotron 3 Ultra</strong>
        </div>
        <div className="footer-links">
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            API Docs ↗
          </a>
          <a
            href="http://127.0.0.1:8000/api/status"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Telemetry API ↗
          </a>
          <a
            href="http://127.0.0.1:8000/api/kb"
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
