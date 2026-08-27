import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Ticket,
  TicketStatus,
  AnalyticsGraphsResponse,
  CampusUser,
  DiagnosticsReportResponse,
  TechnicianSpecialization,
} from '../types/chat';
import {
  INITIAL_MOCK_ANALYTICS_GRAPHS,
  INITIAL_MOCK_PROBES,
  getLocalTechnicians,
  saveLocalTechnicians,
  saveLocalTickets,
  createClientMockTechnician,
  saveLocalUserPassword,
  resetLocalSystemData,
} from '../data/mockData';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  Cpu,
  Wifi,
  Users,
  Database,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  RotateCcw,
  Zap,
  UserPlus,
  Edit2,
  Key,
  Lock,
  Power,
  ShieldCheck,
  TrendingUp,
  PieChart,
  Activity,
  Download,
  Sparkles,
  UserCheck,
  Trash2,
  MapPin,
} from 'lucide-react';
import CampusMap from './CampusMap';

interface AdminDashboardProps {
  tickets: Ticket[];
  currentUser?: CampusUser | null;
  authToken?: string | null;
  onOpenInResolver: (ticketId: string) => void;
  onUpdateTicketStatus?: (ticketId: string, newStatus: TicketStatus) => Promise<void>;
  onNavigateToKB?: () => void;
  onResetData?: () => void;
  onTicketsUpdated?: (tickets: Ticket[]) => void;
}

type AdminTab =
  | 'overview'
  | 'tickets'
  | 'escalations'
  | 'technicians'
  | 'campus_map'
  | 'analytics'
  | 'network'
  | 'database'
  | 'settings';

const SPECIALIZATIONS: TechnicianSpecialization[] = [
  'Network Technician',
  'Hardware Technician',
  'Software Technician',
  'Support Technician',
  'IAM/Access Technician',
  'Network',
  'Hardware',
  'Software',
  'Support',
  'IAM / Access',
  'Other',
];

export const CORE_SPECIALIZATION_OPTIONS: { id: TechnicianSpecialization; label: string; department: string }[] = [
  { id: 'Network Technician', label: 'Network Technician', department: 'Network & Wireless Engineering' },
  { id: 'Hardware Technician', label: 'Hardware Technician', department: 'Campus Hardware & Printing Infrastructure' },
  { id: 'Software Technician', label: 'Software Technician', department: 'Academic Software & Licensing' },
  { id: 'Support Technician', label: 'Support Technician', department: 'Student IT Help Bar & Walkup Center' },
  { id: 'IAM/Access Technician', label: 'IAM/Access Technician', department: 'Identity & Access Management' },
];

export function normalizeSpecialization(spec?: string | null): string {
  if (!spec) return 'General Support';
  const s = spec.toLowerCase().trim();
  if (s.includes('network')) return 'Network';
  if (s.includes('hardware')) return 'Hardware';
  if (s.includes('software')) return 'Software';
  if (s.includes('iam') || s.includes('access') || s.includes('identity')) return 'IAM / Access';
  if (s.includes('support')) return 'Support';
  return spec.trim();
}

// Maps ticket categories to technician specializations for role-based queue filtering
const CATEGORY_TO_SPECIALIZATION: Record<string, string[]> = {
  'Eduroam Wi-Fi': ['Network'],
  'Dorm ResNet': ['Network'],
  'VPN': ['Network'],
  'Canvas / SSO': ['Software', 'IAM / Access'],
  'Software': ['Software'],
  'Lab / Computer Access': ['Hardware', 'Software'],
  'PaperCut Printing': ['Hardware'],
  'Duo MFA': ['IAM / Access'],
  'NetID / Password': ['IAM / Access'],
  'Email': ['IAM / Access', 'Software'],
  'Other': ['Support', 'Other'],
};

/** Returns true if a ticket's category matches the given technician specialization */
function ticketMatchesSpecialization(ticket: Ticket, specialization: string): boolean {
  const normSpec = normalizeSpecialization(specialization);
  const specs = CATEGORY_TO_SPECIALIZATION[ticket.category] || ['Support', 'Other'];
  if (specs.map((s) => normalizeSpecialization(s)).includes(normSpec)) return true;
  if (ticket.escalation_info?.target_specialization && normalizeSpecialization(ticket.escalation_info.target_specialization) === normSpec) {
    return true;
  }
  return false;
}

export default function AdminDashboard({
  tickets,
  currentUser,
  authToken,
  onOpenInResolver,
  onUpdateTicketStatus,
  onResetData,
  onTicketsUpdated,
}: AdminDashboardProps) {
  const isHost = currentUser?.role === 'host' || currentUser?.role === 'admin';
  const isTechnician = currentUser?.role === 'technician';
  const techSpecialization = currentUser?.specialization || '';
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [graphs, setGraphs] = useState<AnalyticsGraphsResponse | null>(() => INITIAL_MOCK_ANALYTICS_GRAPHS);
  const [technicians, setTechnicians] = useState<CampusUser[]>(() => getLocalTechnicians().filter((u) => u.role === 'technician' || u.role === 'host'));
  const [probes, setProbes] = useState<DiagnosticsReportResponse | null>(() => ({
    overall_health: 'healthy',
    probes_passed: INITIAL_MOCK_PROBES.length,
    probes_total: INITIAL_MOCK_PROBES.length,
    probes: INITIAL_MOCK_PROBES,
    run_timestamp: new Date().toISOString(),
    summary: 'All telemetry nodes reporting nominal connectivity.',
  }));
  const [databaseInfo, setDatabaseInfo] = useState<{
    database_status: string;
    schema_version: string;
    total_records: number;
    tables: { table_name: string; count: number; description: string }[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [techSpecFilter, setTechSpecFilter] = useState<string>('All');

  // Technician Modals State
  const [isAddTechModalOpen, setIsAddTechModalOpen] = useState(false);
  const [isEditTechModalOpen, setIsEditTechModalOpen] = useState(false);
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [selectedTech, setSelectedTech] = useState<CampusUser | null>(null);

  // Reassignment Modal State
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignTicket, setReassignTicket] = useState<Ticket | null>(null);
  const [reassignTechName, setReassignTechName] = useState('');
  const [reassignNotes, setReassignNotes] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  // System Data Reset Modal State
  const [isResetDataModalOpen, setIsResetDataModalOpen] = useState(false);
  const [isResettingData, setIsResettingData] = useState(false);

  // Form Fields for Add Technician
  const [newTechName, setNewTechName] = useState('');
  const [newTechUsername, setNewTechUsername] = useState('');
  const [newTechEmail, setNewTechEmail] = useState('');
  const [newTechPassword, setNewTechPassword] = useState('');
  const [newTechSpec, setNewTechSpec] = useState<TechnicianSpecialization>('Network');
  const [newTechDept, setNewTechDept] = useState('Network & Wireless Engineering');
  const [newTechPhone, setNewTechPhone] = useState('');

  // Form Fields for Edit Technician
  const [editTechName, setEditTechName] = useState('');
  const [editTechUsername, setEditTechUsername] = useState('');
  const [editTechEmail, setEditTechEmail] = useState('');
  const [editTechSpec, setEditTechSpec] = useState<TechnicianSpecialization>('Network');
  const [editTechDept, setEditTechDept] = useState('');
  const [editTechPhone, setEditTechPhone] = useState('');
  const [editTechActive, setEditTechActive] = useState(true);

  // Interactive SaaS Analytics & Chart State (Host View)
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [hoveredCategoryKey, setHoveredCategoryKey] = useState<string | null>(null);
  const [trendTimeframe, setTrendTimeframe] = useState<'7D' | '30D' | '90D'>('7D');

  // Reset Password Modal State
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Host Password Change Form
  const [currentHostPwd, setCurrentHostPwd] = useState('');
  const [newHostPwd, setNewHostPwd] = useState('');
  const [pwdChangeMsg, setPwdChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Action Notice
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Computed Interactive Daily Inflow & Resolution Velocity Trend Data
  const trendData = useMemo(() => {
    return [
      { day: 'Mon', date: 'Aug 17', total: 19, resolved: 15, escalated: 2, triageTime: '14.2s' },
      { day: 'Tue', date: 'Aug 18', total: 27, resolved: 23, escalated: 3, triageTime: '16.8s' },
      { day: 'Wed', date: 'Aug 19', total: 34, resolved: 29, escalated: 4, triageTime: '18.1s' },
      { day: 'Thu', date: 'Aug 20', total: 28, resolved: 24, escalated: 2, triageTime: '15.5s' },
      { day: 'Fri', date: 'Aug 21', total: 38, resolved: 33, escalated: 3, triageTime: '19.4s' },
      { day: 'Sat', date: 'Aug 22', total: 16, resolved: 14, escalated: 1, triageTime: '12.0s' },
      { day: 'Sun', date: 'Aug 23', total: 21, resolved: 18, escalated: 2, triageTime: '13.6s' },
    ];
  }, []);

  // Computed Category Distribution with Percentages and Hues
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });

    const palette = [
      { key: 'Eduroam Wi-Fi', color: '#6366f1', count: counts['Eduroam Wi-Fi'] || 8 },
      { key: 'Canvas / SSO', color: '#8b5cf6', count: counts['Canvas / SSO'] || 6 },
      { key: 'Duo MFA', color: '#3b82f6', count: counts['Duo MFA'] || 5 },
      { key: 'PaperCut Printing', color: '#06b6d4', count: counts['PaperCut Printing'] || 4 },
      { key: 'Dorm ResNet', color: '#10b981', count: counts['Dorm ResNet'] || 3 },
      { key: 'Hardware & Lab', color: '#f59e0b', count: counts['Lab / Computer Access'] || 2 },
    ];
    const totalCount = palette.reduce((sum, item) => sum + item.count, 0) || 1;
    return palette.map((item) => ({
      ...item,
      percentage: Math.round((item.count / totalCount) * 100),
    }));
  }, [tickets]);

  // Computed Technician Domain Workload Matrix
  const domainWorkloads = useMemo(() => {
    return [
      { name: 'Network Engineering', spec: 'Network', load: 12, capacity: 20, status: 'Optimal', color: '#3b82f6' },
      { name: 'Hardware & Printing', spec: 'Hardware', load: 8, capacity: 15, status: 'Normal', color: '#f97316' },
      { name: 'Academic Software', spec: 'Software', load: 14, capacity: 18, status: 'Heavy', color: '#06b6d4' },
      { name: 'Student Help Bar', spec: 'Support', load: 19, capacity: 25, status: 'Normal', color: '#10b981' },
      { name: 'Identity & Access (IAM)', spec: 'IAM / Access', load: 9, capacity: 16, status: 'Optimal', color: '#a855f7' },
    ];
  }, []);

  // Export Incident Log as CSV
  const handleExportCSV = () => {
    const headers = ['Ticket Number', 'Title', 'Category', 'Priority', 'Status', 'NetID', 'Assigned Tech', 'Location'];
    const rows = tickets.map((t) => [
      t.ticket_number,
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.priority,
      t.status,
      t.netid,
      t.assigned_technician || 'CampusFix AI',
      `"${t.location.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CampusFix_IT_Incidents_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionNotice({ type: 'success', text: 'Incidents report CSV downloaded successfully.' });
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const [gRes, uRes, tRes, pRes, dRes] = await Promise.all([
        fetch('/api/analytics/graphs', { headers }),
        fetch('/api/users', { headers }),
        fetch('/api/technicians', { headers }).catch(() => null),
        fetch('/api/diagnostics/probes', { headers }),
        fetch('/api/admin/database', { headers }),
      ]);

      if (gRes.ok) setGraphs(await gRes.json());
      if (tRes && tRes.ok) {
        setTechnicians(await tRes.json());
      } else if (uRes.ok) {
        const allUsers: CampusUser[] = await uRes.json();
        setTechnicians(allUsers.filter((u) => u.role === 'technician' || u.role === 'admin'));
      }
      if (pRes.ok) setProbes(await pRes.json());
      if (dRes.ok) setDatabaseInfo(await dRes.json());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, tickets]);

  // Specialization-scoped tickets — technicians see only their specialization, hosts see all
  const roleFilteredTickets = useMemo(() => {
    if (isHost) return tickets;
    if (isTechnician && techSpecialization) {
      return tickets.filter((t) => ticketMatchesSpecialization(t, techSpecialization));
    }
    return tickets;
  }, [tickets, isHost, isTechnician, techSpecialization]);

  // Filtered ticket queue (search + priority + status on top of role filter)
  const filteredTickets = useMemo(() => {
    return roleFilteredTickets.filter((t) => {
      const matchSearch =
        searchQuery === '' ||
        t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.netid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.assigned_technician && t.assigned_technician.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;

      return matchSearch && matchPriority && matchStatus;
    });
  }, [roleFilteredTickets, searchQuery, priorityFilter, statusFilter]);

  // Escalated Tickets
  const escalatedTickets = useMemo(() => {
    return roleFilteredTickets.filter((t) => t.status === 'Escalated' || t.escalation_info !== null);
  }, [roleFilteredTickets]);

  // Derived KPIs
  const urgentCount = useMemo(
    () => roleFilteredTickets.filter((t) => (t.priority === 'High' || t.priority === 'Urgent' || t.priority === 'Critical') && t.status !== 'Resolved').length,
    [roleFilteredTickets]
  );
  const openCount = useMemo(
    () => roleFilteredTickets.filter((t) => t.status === 'New' || t.status === 'Diagnosing' || t.status === 'Waiting for Student').length,
    [roleFilteredTickets]
  );
  const escalatedCount = useMemo(
    () => roleFilteredTickets.filter((t) => t.status === 'Escalated').length,
    [roleFilteredTickets]
  );
  const resolvedCount = useMemo(
    () => roleFilteredTickets.filter((t) => t.status === 'Resolved').length,
    [roleFilteredTickets]
  );

  // Host Ticket Assignment / Reassignment Handler
  const handleAssignTicket = async (ticketId: string, assignedTechName: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken || localStorage.getItem('campusfix_token')}`,
        },
        body: JSON.stringify({ assigned_technician: assignedTechName }),
      });
      if (res.ok) {
        const updated: Ticket = await res.json();
        setActionNotice({
          type: 'success',
          text: `Assigned incident ${updated.ticket_number} to ${assignedTechName}.`,
        });
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err) {
      console.error('Failed to assign ticket:', err);
    }
  };

  // Technician Management Handlers
  const handleOpenAddTech = () => {
    setNewTechName('');
    setNewTechUsername('');
    setNewTechEmail('');
    setNewTechPassword('');
    setNewTechSpec('Network');
    setNewTechDept('Network & Wireless Engineering');
    setNewTechPhone('');
    setIsAddTechModalOpen(true);
  };

  const handleCreateTechnicianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName || !newTechUsername || !newTechEmail || !newTechPassword) return;

    let created: CampusUser | null = null;
    const techPayload = {
      name: newTechName.trim(),
      username: newTechUsername.trim().toLowerCase(),
      email: newTechEmail.trim().toLowerCase(),
      password: newTechPassword.trim(),
      specialization: newTechSpec,
      department: newTechDept.trim(),
      phone: newTechPhone.trim() || undefined,
      is_active: true,
      skills: [`${newTechSpec} Operations`, 'Campus IT Support'],
    };

    try {
      const res = await fetch('/api/technicians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken || localStorage.getItem('campusfix_token')}`,
        },
        body: JSON.stringify(techPayload),
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          created = await res.json();
        }
      }
    } catch (networkErr) {
      console.warn('Backend technician creation unavailable, using client generator:', networkErr);
    }

    if (!created) {
      created = createClientMockTechnician(techPayload);
    } else {
      if (techPayload.password) {
        saveLocalUserPassword(created.username || techPayload.username, techPayload.password);
      }
    }

    const updated = [...technicians.filter((t) => t.id !== created!.id), created];
    setTechnicians(updated);
    saveLocalTechnicians(updated);
    setIsAddTechModalOpen(false);
    setActionNotice({ type: 'success', text: `Technician '${created.name}' (${created.technician_id}) provisioned successfully!` });
    fetchDashboardData();
  };

  const handleOpenEditTech = (tech: CampusUser) => {
    setSelectedTech(tech);
    setEditTechName(tech.name);
    setEditTechUsername(tech.username || tech.netid);
    setEditTechEmail(tech.email);
    setEditTechSpec((tech.specialization as TechnicianSpecialization) || 'Network');
    setEditTechDept(tech.department);
    setEditTechPhone(tech.phone || '');
    setEditTechActive(tech.is_active !== false);
    setIsEditTechModalOpen(true);
  };

  const handleUpdateTechnicianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTech) return;

    let updated: CampusUser | null = null;
    const updatePayload = {
      name: editTechName.trim(),
      username: editTechUsername.trim().toLowerCase(),
      email: editTechEmail.trim().toLowerCase(),
      specialization: editTechSpec,
      department: editTechDept.trim(),
      phone: editTechPhone.trim() || undefined,
      is_active: editTechActive,
    };

    try {
      const res = await fetch(`/api/technicians/${selectedTech.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken || localStorage.getItem('campusfix_token')}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          updated = await res.json();
        }
      }
    } catch (err) {
      console.warn('Backend technician update unavailable, updating client state:', err);
    }

    if (!updated) {
      updated = {
        ...selectedTech,
        ...updatePayload,
      };
    }

    const updatedList = technicians.map((t) => (t.id === updated!.id ? updated! : t));
    setTechnicians(updatedList);
    saveLocalTechnicians(updatedList);
    setIsEditTechModalOpen(false);
    setActionNotice({ type: 'success', text: `Technician '${updated.name}' profile updated successfully.` });
  };

  const handleOpenResetPwd = (tech: CampusUser) => {
    setSelectedTech(tech);
    setResetNewPassword('');
    setIsResetPwdModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTech || !resetNewPassword.trim()) return;

    try {
      await fetch(`/api/technicians/${selectedTech.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken || localStorage.getItem('campusfix_token')}`,
        },
        body: JSON.stringify({ new_password: resetNewPassword.trim() }),
      });
    } catch (err) {
      console.warn('Backend password reset unavailable, recording client state:', err);
    }

    saveLocalUserPassword(selectedTech.username || selectedTech.netid, resetNewPassword.trim());
    setIsResetPwdModalOpen(false);
    setActionNotice({ type: 'success', text: `Password successfully reset to '${resetNewPassword}' for '${selectedTech.name}'.` });
  };

  const handleToggleTechActive = async (tech: CampusUser) => {
    const nextActive = tech.is_active === false ? true : false;
    let updated: CampusUser = { ...tech, is_active: nextActive };

    try {
      const res = await fetch(`/api/technicians/${tech.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken || localStorage.getItem('campusfix_token')}`,
        },
        body: JSON.stringify({ is_active: nextActive }),
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          updated = await res.json();
        }
      }
    } catch (err) {
      console.warn('Backend status update unavailable, toggling client state:', err);
    }

    const updatedList = technicians.map((t) => (t.id === updated.id ? updated : t));
    setTechnicians(updatedList);
    saveLocalTechnicians(updatedList);
    setActionNotice({
      type: 'success',
      text: `Technician '${tech.name}' is now ${nextActive ? 'Active on duty' : 'Deactivated'}.`,
    });
  };

  // Host Change Password Handler
  const handleHostPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHostPwd || !newHostPwd) return;

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken || localStorage.getItem('campusfix_token')}`,
        },
        body: JSON.stringify({
          current_password: currentHostPwd.trim(),
          new_password: newHostPwd.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to change password');
      }

      setPwdChangeMsg({ type: 'success', text: data.message || 'Password changed successfully!' });
      setCurrentHostPwd('');
      setNewHostPwd('');
    } catch (err) {
      setPwdChangeMsg({ type: 'error', text: err instanceof Error ? err.message : 'Password change failed.' });
    }
  };

  // Host Open Reassign Modal
  const handleOpenReassign = (ticket: Ticket) => {
    setReassignTicket(ticket);
    const availableTechs = technicians.filter((u) => u.role === 'technician' && u.name !== ticket.assigned_technician);
    const defaultTech = availableTechs.length > 0
      ? `${availableTechs[0].name} (${availableTechs[0].specialization || 'Tech'})`
      : 'Anand Sen (Network)';
    setReassignTechName(defaultTech);
    setReassignNotes(`Host reassigning from '${ticket.assigned_technician || 'Previous Tech'}' to specialized technician.`);
    setIsReassignModalOpen(true);
  };

  // Host Submit Reassignment
  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTicket || !reassignTechName) return;

    setIsReassigning(true);
    let updated: Ticket | null = null;
    try {
      const res = await fetch(`/api/tickets/${reassignTicket.id}/reassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken || localStorage.getItem('campusfix_token')}`,
        },
        body: JSON.stringify({
          new_technician: reassignTechName,
          reassignment_notes: reassignNotes.trim() || undefined,
        }),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          updated = await res.json();
        }
      }
    } catch (err) {
      console.warn('Backend reassign unreachable, updating local state:', err);
    }

    if (!updated) {
      const nowIso = new Date().toISOString();
      const prevTech = reassignTicket.assigned_technician || 'Previous Tech';
      updated = {
        ...reassignTicket,
        assigned_technician: reassignTechName,
        status: 'Diagnosing',
        actions_taken: [
          ...(reassignTicket.actions_taken || []),
          {
            id: `act-${Date.now()}`,
            timestamp: nowIso,
            action: `Incident reassigned to ${reassignTechName}`,
            result: `Reassigned by Host. Note: ${reassignNotes.trim() || 'Direct dispatch transfer.'}`,
            actor: 'technician',
          },
        ],
        notes: [
          ...(reassignTicket.notes || []),
          {
            id: `note-${Date.now()}`,
            author: currentUser?.name || 'Host Administrator',
            author_role: 'system' as const,
            text: `[Host Reassignment] Reassigned from '${prevTech}' to '${reassignTechName}'. Notes: ${reassignNotes.trim()}`,
            created_at: nowIso,
          },
        ],
        updated_at: nowIso,
      };
    }

    const finalTicket: Ticket = updated;
    const updatedList = tickets.map((t) => (t.id === finalTicket.id ? finalTicket : t));
    saveLocalTickets(updatedList);
    if (onTicketsUpdated) onTicketsUpdated(updatedList);
    setIsReassignModalOpen(false);
    setIsReassigning(false);
    setActionNotice({
      type: 'success',
      text: `Successfully reassigned incident ${finalTicket.ticket_number} to ${reassignTechName}!`,
    });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Host System Data Reset (Clean Slate)
  const handleSystemDataReset = async () => {
    setIsResettingData(true);
    try {
      await fetch('/api/admin/reset-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken || localStorage.getItem('campusfix_token')}`,
        },
      }).catch((e) => console.warn('Backend reset call:', e));
    } catch (e) {
      console.warn('Backend reset:', e);
    }

    const resetState = resetLocalSystemData();
    setTechnicians(resetState.technicians);
    saveLocalTechnicians(resetState.technicians);
    saveLocalTickets(resetState.tickets);
    if (onTicketsUpdated) onTicketsUpdated(resetState.tickets);
    if (onResetData) onResetData();

    setIsResetDataModalOpen(false);
    setIsResettingData(false);
    setActionNotice({
      type: 'success',
      text: '✨ System data completely reset! Tickets and technicians restored to clean fresh slate.',
    });
    setTimeout(() => setActionNotice(null), 5000);
    fetchDashboardData();
  };

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="specialist-avatar" style={{ width: 34, height: 34 }}>
            {isHost ? <ShieldCheck size={18} /> : <LayoutDashboard size={18} />}
          </div>
          <div>
            <h3>{isHost ? 'Host Management' : 'Technician Hub'}</h3>
            <span>{isHost ? 'Executive Governance' : `${techSpecialization || 'Operations'} • Triage`}</span>
          </div>
        </div>

        <nav className="admin-nav-menu">
          <button
            className={`admin-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={16} />
            <span>Overview & Queue</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <TicketIcon size={16} />
            <span>{isTechnician ? `My Incidents (${roleFilteredTickets.length})` : `All Incidents (${tickets.length})`}</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'escalations' ? 'active' : ''}`}
            onClick={() => setActiveTab('escalations')}
          >
            <ShieldAlert size={16} />
            <span>Escalation Queue ({escalatedTickets.length})</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'technicians' ? 'active' : ''}`}
            onClick={() => setActiveTab('technicians')}
          >
            <Users size={16} />
            <span>Technician Roster ({technicians.length})</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'campus_map' ? 'active' : ''}`}
            onClick={() => setActiveTab('campus_map')}
          >
            <MapPin size={16} />
            <span>Campus Map</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Cpu size={16} />
            <span>AI Reasoning SLA</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'network' ? 'active' : ''}`}
            onClick={() => setActiveTab('network')}
          >
            <Wifi size={16} />
            <span>Infrastructure Probes</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'database' ? 'active' : ''}`}
            onClick={() => setActiveTab('database')}
          >
            <Database size={16} />
            <span>Storage & Database</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} />
            <span>{isHost ? 'Host & IT Settings' : 'IT Settings'}</span>
          </button>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            className="btn-secondary-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={fetchDashboardData}
            disabled={isLoading}
          >
            <RotateCcw size={14} className={isLoading ? 'spin-animation' : ''} />
            <span>Refresh Dashboard</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-panel">
        {/* Action Notice Alert */}
        {actionNotice && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              background: actionNotice.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${actionNotice.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              color: actionNotice.type === 'success' ? '#34d399' : '#fca5a5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{actionNotice.text}</span>
            <button
              onClick={() => setActionNotice(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* =========================================================================
            EXECUTIVE HOST OPERATIONS SAAS BANNER (Host View)
            ========================================================================= */}
        {isHost && (
          <div className="saas-host-hero-banner" style={{ marginBottom: '1.5rem' }}>
            <div className="saas-host-hero-left">
              <div className="saas-host-badge">
                <Sparkles size={14} className="saas-sparkle-spin" />
                <span>Executive IT Governance Center</span>
                <span className="saas-badge-sep">•</span>
                <span className="saas-pulse-dot" />
                <span style={{ color: '#34d399' }}>Live Telemetry Active</span>
              </div>
              <h2 className="saas-host-title">Host Operations & SLA Command Center</h2>
              <p className="saas-host-subtitle">
                Campus-wide incident routing, automated AI diagnostic reasoning, technician capacity allocation, and SLA compliance monitoring.
              </p>
            </div>
            <div className="saas-host-actions">
              <button className="btn-primary" onClick={() => setIsAddTechModalOpen(true)}>
                <UserPlus size={15} />
                <span>+ Provision Technician</span>
              </button>
              <button className="btn-secondary" onClick={handleExportCSV}>
                <Download size={15} />
                <span>Export Log (CSV)</span>
              </button>
              <button className="btn-secondary" onClick={fetchDashboardData} disabled={isLoading}>
                <RotateCcw size={14} className={isLoading ? 'spin-animation' : ''} />
                <span>Sync</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            1. OVERVIEW & QUEUE TAB
            ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="admin-section-content">
            {/* KPI Cards */}
            <div className="admin-kpis-grid">
              <div className="admin-kpi-card">
                <div className="metric-icon-wrap" style={{ background: 'var(--danger-50)', color: 'var(--danger-600)' }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className="kpi-number">{urgentCount}</div>
                  <div className="kpi-label">High / Critical Urgency</div>
                  <div className="kpi-sub">Priority response required</div>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="metric-icon-wrap" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div className="kpi-number">{openCount}</div>
                  <div className="kpi-label">Open Active Queue</div>
                  <div className="kpi-sub">Under active diagnosis / triage</div>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="metric-icon-wrap" style={{ background: 'var(--warning-50)', color: 'var(--warning-600)' }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="kpi-number">{escalatedCount}</div>
                  <div className="kpi-label">Escalations</div>
                  <div className="kpi-sub">Routed to Tier-2 & Walkup Bar</div>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="metric-icon-wrap" style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="kpi-number">{resolvedCount}</div>
                  <div className="kpi-label">Resolved Today</div>
                  <div className="kpi-sub">Successfully closed cases</div>
                </div>
              </div>
            </div>

            {/* Interactive SaaS Analytics Grid (Host View) */}
            {isHost && (
              <div className="saas-analytics-interactive-grid" style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.25rem' }}>
                {/* Trend Chart Card */}
                <div className="admin-table-card saas-chart-card">
                  <div className="card-header-flex" style={{ padding: '1.15rem 1.35rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <TrendingUp size={18} style={{ color: '#818cf8' }} />
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Incident Velocity & Autonomous Resolution</h3>
                      </div>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                        Daily ticket inflow vs. AI autonomous triage and technician escalations
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      {(['7D', '30D', '90D'] as const).map((tf) => (
                        <button
                          key={tf}
                          type="button"
                          className={`saas-timeframe-btn ${trendTimeframe === tf ? 'active' : ''}`}
                          onClick={() => setTrendTimeframe(tf)}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SVG Interactive Multi-Line / Area Chart */}
                  <div style={{ padding: '1.25rem 1.35rem 0.75rem', position: 'relative' }}>
                    <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                      <svg viewBox="0 0 700 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Gridlines */}
                        {[40, 90, 140, 190].map((y, idx) => (
                          <line key={idx} x1="30" y1={y} x2="680" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                        ))}

                        {/* Total Inflow Area */}
                        <path
                          d="M 50 140 C 130 90, 180 120, 250 50 C 320 80, 380 40, 450 30 C 520 150, 580 130, 650 110 L 650 190 L 50 190 Z"
                          fill="url(#totalGradient)"
                        />
                        {/* Total Inflow Line */}
                        <path
                          d="M 50 140 C 130 90, 180 120, 250 50 C 320 80, 380 40, 450 30 C 520 150, 580 130, 650 110"
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />

                        {/* Resolved Line */}
                        <path
                          d="M 50 155 C 130 110, 180 135, 250 75 C 320 100, 380 65, 450 50 C 520 160, 580 145, 650 125"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeDasharray="6 3"
                          strokeLinecap="round"
                        />

                        {/* Interactive Data Points */}
                        {trendData.map((item, idx) => {
                          const xPos = 50 + idx * 100;
                          const yMap: Record<number, number> = { 0: 140, 1: 95, 2: 50, 3: 80, 4: 30, 5: 150, 6: 110 };
                          const yPos = yMap[idx] || 100;
                          const isHovered = hoveredTrendIndex === idx;

                          return (
                            <g
                              key={idx}
                              onMouseEnter={() => setHoveredTrendIndex(idx)}
                              onMouseLeave={() => setHoveredTrendIndex(null)}
                              style={{ cursor: 'pointer' }}
                            >
                              {isHovered && (
                                <line x1={xPos} y1="10" x2={xPos} y2="190" stroke="rgba(99, 102, 241, 0.5)" strokeWidth="1.5" strokeDasharray="3 3" />
                              )}
                              <circle
                                cx={xPos}
                                cy={yPos}
                                r={isHovered ? 7 : 4.5}
                                fill={isHovered ? '#818cf8' : '#6366f1'}
                                stroke="#fff"
                                strokeWidth={isHovered ? 2.5 : 1.5}
                                style={{ transition: 'all 0.2s ease' }}
                              />
                              <text
                                x={xPos}
                                y="208"
                                textAnchor="middle"
                                fill={isHovered ? '#818cf8' : 'var(--text-muted)'}
                                fontSize="11"
                                fontWeight={isHovered ? '800' : '600'}
                              >
                                {item.day}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {/* Floating SaaS Interactive Tooltip */}
                      {hoveredTrendIndex !== null && (
                        <div
                          className="saas-chart-tooltip"
                          style={{
                            position: 'absolute',
                            top: '15px',
                            left: `${Math.min(Math.max(hoveredTrendIndex * 14 + 8, 8), 75)}%`,
                            background: 'rgba(13, 18, 31, 0.95)',
                            border: '1px solid rgba(99, 102, 241, 0.4)',
                            borderRadius: '12px',
                            padding: '0.65rem 0.85rem',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(12px)',
                            pointerEvents: 'none',
                            zIndex: 10,
                            minWidth: '150px',
                          }}
                        >
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#818cf8', marginBottom: '0.35rem' }}>
                            {trendData[hoveredTrendIndex].date} ({trendData[hoveredTrendIndex].day})
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', margin: '0.15rem 0' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Total Inflow:</span>
                            <strong style={{ color: '#fff' }}>{trendData[hoveredTrendIndex].total}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', margin: '0.15rem 0' }}>
                            <span style={{ color: '#34d399' }}>AI Resolved:</span>
                            <strong style={{ color: '#34d399' }}>{trendData[hoveredTrendIndex].resolved}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', margin: '0.15rem 0' }}>
                            <span style={{ color: '#f87171' }}>Escalated:</span>
                            <strong style={{ color: '#f87171' }}>{trendData[hoveredTrendIndex].escalated}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.25rem' }}>
                            <span>Avg Triage:</span>
                            <span>{trendData[hoveredTrendIndex].triageTime}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginTop: '1.25rem', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', fontWeight: 700 }}>
                        <span style={{ width: 12, height: 3, background: '#6366f1', borderRadius: 2 }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Total Inflow</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', fontWeight: 700 }}>
                        <span style={{ width: 12, height: 3, background: '#10b981', borderRadius: 2 }} />
                        <span style={{ color: 'var(--text-secondary)' }}>AI Auto-Resolved</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', fontWeight: 700 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#818cf8', border: '2px solid #fff' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Interactive Telemetry</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Donut Category Breakdown Card */}
                <div className="admin-table-card saas-chart-card">
                  <div className="card-header-flex" style={{ padding: '1.15rem 1.35rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <PieChart size={18} style={{ color: '#a855f7' }} />
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Category Distribution</h3>
                      </div>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                        Distribution across campus infrastructure domains
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                      {/* SVG Donut Ring */}
                      <div style={{ width: '130px', height: '130px', position: 'relative', flexShrink: 0 }}>
                        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                          <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
                          {categoryBreakdown.map((item, idx) => {
                            const totalPct = categoryBreakdown.slice(0, idx).reduce((s, x) => s + x.percentage, 0);
                            const strokeDasharray = `${item.percentage * 2.38} 238`;
                            const strokeDashoffset = `-${totalPct * 2.38}`;
                            const isHovered = hoveredCategoryKey === item.key;

                            return (
                              <circle
                                key={item.key}
                                cx="50"
                                cy="50"
                                r="38"
                                fill="none"
                                stroke={item.color}
                                strokeWidth={isHovered ? "17" : "14"}
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                style={{ transition: 'all 0.25s ease', cursor: 'pointer' }}
                                onMouseEnter={() => setHoveredCategoryKey(item.key)}
                                onMouseLeave={() => setHoveredCategoryKey(null)}
                              />
                            );
                          })}
                        </svg>
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                            {hoveredCategoryKey ? `${categoryBreakdown.find((c) => c.key === hoveredCategoryKey)?.percentage}%` : `${tickets.length}`}
                          </span>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            {hoveredCategoryKey ? 'Share' : 'Total'}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Legend List */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: '180px' }}>
                        {categoryBreakdown.map((item) => {
                          const isHovered = hoveredCategoryKey === item.key;
                          return (
                            <div
                              key={item.key}
                              onMouseEnter={() => setHoveredCategoryKey(item.key)}
                              onMouseLeave={() => setHoveredCategoryKey(null)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '8px',
                                background: isHovered ? 'rgba(255,255,255,0.06)' : 'transparent',
                                transition: 'all 0.15s ease',
                                cursor: 'pointer',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                                <span style={{ fontSize: '0.78rem', fontWeight: isHovered ? 800 : 600, color: isHovered ? '#fff' : 'var(--text-secondary)' }}>
                                  {item.key}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: isHovered ? item.color : 'var(--text-primary)' }}>
                                {item.count} ({item.percentage}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Technician Domain Workload Matrix (Host View) */}
            {isHost && (
              <div className="admin-table-card saas-chart-card" style={{ marginTop: '1.25rem' }}>
                <div className="card-header-flex" style={{ padding: '1.15rem 1.35rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Activity size={18} style={{ color: '#38bdf8' }} />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Specialization Workload & Capacity</h3>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                      Real-time incident distribution vs. active duty technician capacity across campus domains
                    </p>
                  </div>
                  <button className="btn-secondary-sm" onClick={() => setActiveTab('technicians')}>
                    <span>Manage Roster →</span>
                  </button>
                </div>

                <div style={{ padding: '1.25rem 1.35rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
                  {domainWorkloads.map((item) => {
                    const pct = Math.round((item.load / item.capacity) * 100);
                    return (
                      <div
                        key={item.spec}
                        style={{
                          background: 'var(--bg-surface-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '12px',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.65rem',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{item.name}</strong>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.spec} Domain</div>
                          </div>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background: item.status === 'Optimal' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                              color: item.status === 'Optimal' ? '#34d399' : '#60a5fa',
                              border: `1px solid ${item.status === 'Optimal' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                            }}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Queue Load:</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{item.load} / {item.capacity} cases ({pct}%)</strong>
                          </div>
                          <div style={{ width: '100%', height: '7px', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                                height: '100%',
                                background: item.color,
                                borderRadius: '9999px',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Queue Table */}
            <div className="admin-table-card" style={{ marginTop: '1.5rem' }}>
              <div className="card-header-flex" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                    {isTechnician ? `${techSpecialization} — Active Queue` : 'Active Incident Queue'}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {isTechnician
                      ? `Showing tickets matching your ${techSpecialization} specialization`
                      : 'Immediate triage workbench for on-duty technicians and administrators'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Search incidents or NetID..."
                    className="form-input-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: 220 }}
                  />
                  <select
                    className="form-select-sm"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="All">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Title & Location</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned Tech</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.slice(0, 10).map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className="ticket-badge-mono">{t.ticket_number}</span>
                      </td>
                      <td>
                        <strong>{t.title}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.location}</div>
                      </td>
                      <td>
                        <span className="category-tag">{t.category}</span>
                      </td>
                      <td>
                        <span className={`priority-tag priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
                      </td>
                      <td>
                        <span className={`status-tag status-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        {isHost ? (
                          <select
                            className="form-select-sm"
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', maxWidth: '160px' }}
                            value={t.assigned_technician || 'CampusFix AI'}
                            onChange={(e) => handleAssignTicket(t.id, e.target.value)}
                            title="Host: Assign / Reassign incident to technician"
                          >
                            <option value="CampusFix AI">CampusFix AI</option>
                            <option value="Tier-1 AI Queue">Tier-1 AI Queue</option>
                            {technicians.map((u) => (
                              <option key={u.id} value={`${u.name} (${u.specialization || 'Tech'})`}>
                                {u.name} ({u.specialization || 'Tech'})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                            {t.assigned_technician || 'CampusFix AI'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {isTechnician && (t.status === 'New' || t.status === 'Waiting for Student') && (
                            <button
                              className="btn-secondary-sm"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.4)' }}
                              onClick={async () => {
                                if (onUpdateTicketStatus) {
                                  await onUpdateTicketStatus(t.id, 'Diagnosing');
                                  setActionNotice({ type: 'success', text: `Started work on ${t.ticket_number} (Status: In Progress)` });
                                  setTimeout(() => setActionNotice(null), 3000);
                                }
                              }}
                              title="Start Work / Mark Diagnosing"
                            >
                              ▶ Start Work
                            </button>
                          )}
                          <button
                            className="btn-primary-sm"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                            onClick={() => onOpenInResolver(t.id)}
                            title="Open in AI Diagnostic Workbench"
                          >
                            Workbench ↗
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            2. ALL INCIDENTS TAB
            ========================================================================= */}
        {activeTab === 'tickets' && (
          <div className="admin-section-content">
            <div className="admin-table-card">
              <div className="card-header-flex" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                {isTechnician ? `${techSpecialization} Incident Directory (${roleFilteredTickets.length})` : `Complete Incident Directory (${tickets.length})`}
              </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    className="form-input-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="form-select-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="New">New</option>
                    <option value="Diagnosing">Diagnosing</option>
                    <option value="Waiting for Student">Waiting for Student</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                  </select>
                </div>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Title & Location</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned Tech</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((t) => (
                    <tr key={t.id}>
                      <td><span className="ticket-badge-mono">{t.ticket_number}</span></td>
                      <td>
                        <strong>{t.title}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.location}</div>
                      </td>
                      <td><span className="category-tag">{t.category}</span></td>
                      <td><span className={`priority-tag priority-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                      <td>
                        <span className={`status-tag status-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        {isHost ? (
                          <select
                            className="form-select-sm"
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', maxWidth: '160px' }}
                            value={t.assigned_technician || 'CampusFix AI'}
                            onChange={(e) => handleAssignTicket(t.id, e.target.value)}
                            title="Host: Assign / Reassign incident to technician"
                          >
                            <option value="CampusFix AI">CampusFix AI</option>
                            <option value="Tier-1 AI Queue">Tier-1 AI Queue</option>
                            {technicians.map((u) => (
                              <option key={u.id} value={`${u.name} (${u.specialization || 'Tech'})`}>
                                {u.name} ({u.specialization || 'Tech'})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                            {t.assigned_technician || 'CampusFix AI'}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {isTechnician && (t.status === 'New' || t.status === 'Waiting for Student') && (
                            <button
                              className="btn-secondary-sm"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.4)' }}
                              onClick={async () => {
                                if (onUpdateTicketStatus) {
                                  await onUpdateTicketStatus(t.id, 'Diagnosing');
                                  setActionNotice({ type: 'success', text: `Started work on ${t.ticket_number} (Status: In Progress)` });
                                  setTimeout(() => setActionNotice(null), 3000);
                                }
                              }}
                              title="Start Work / Mark Diagnosing"
                            >
                              ▶ Start Work
                            </button>
                          )}
                          <button
                            className="btn-primary-sm"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                            onClick={() => onOpenInResolver(t.id)}
                            title="Open in AI Diagnostic Workbench"
                          >
                            Workbench ↗
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            3. ESCALATION QUEUE TAB
            ========================================================================= */}
        {activeTab === 'escalations' && (
          <div className="admin-section-content">
            <div className="admin-table-card">
              <div className="card-header-flex" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Escalated IT Incidents ({escalatedTickets.length})</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Tickets requiring Tier-2 engineering intervention or Tech Bar walkup resolution
                  </p>
                </div>
              </div>

              {escalatedTickets.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={32} style={{ color: 'var(--success-500)', margin: '0 auto 0.5rem' }} />
                  <p>No escalated incidents pending. All queues are running smoothly!</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ticket #</th>
                      <th>Incident Title</th>
                      <th>Target Team / Specialization</th>
                      <th>Original Tech</th>
                      <th>Escalation Reason</th>
                      <th>Escalated At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escalatedTickets.map((t) => {
                      const isReportedToHost =
                        t.escalation_info?.department === 'Host / Admin' ||
                        t.escalation_info?.tier === 'Host Reassignment Queue' ||
                        t.escalation_info?.assigned_to === 'Host Dispatcher';

                      return (
                        <tr key={t.id} style={{ background: isReportedToHost ? 'rgba(245, 158, 11, 0.06)' : undefined }}>
                          <td>
                            <span className="ticket-badge-mono">{t.ticket_number}</span>
                            {isReportedToHost && (
                              <div style={{ marginTop: '0.2rem' }}>
                                <span
                                  className="status-tag"
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '0.15rem 0.4rem',
                                    background: 'rgba(245, 158, 11, 0.2)',
                                    color: '#fbbf24',
                                    border: '1px solid rgba(245, 158, 11, 0.5)',
                                  }}
                                >
                                  ⚠ Host Reassign
                                </span>
                              </div>
                            )}
                          </td>
                          <td>
                            <strong>{t.title}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.category} • {t.location}</div>
                          </td>
                          <td>
                            <span className="category-tag">
                              {t.escalation_info?.target_specialization || t.escalation_info?.department || 'Tier-2 Engineering'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                              {t.escalation_info?.original_technician || t.assigned_technician || 'CampusFix Tech'}
                            </span>
                          </td>
                          <td style={{ maxWidth: '280px', fontSize: '0.8rem' }}>
                            {t.escalation_info?.reason || 'Hardware / Access Token escalation'}
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {t.escalation_info?.escalated_at
                              ? new Date(t.escalation_info.escalated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Recent'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              {isHost && (
                                <button
                                  className="btn-secondary-sm"
                                  style={{
                                    padding: '0.25rem 0.55rem',
                                    fontSize: '0.75rem',
                                    borderColor: 'var(--warning-500, #f59e0b)',
                                    color: 'var(--warning-400, #fbbf24)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                  }}
                                  onClick={() => handleOpenReassign(t)}
                                  title="Host: Reassign this incident to another technician"
                                >
                                  <UserCheck size={12} />
                                  <span>Reassign</span>
                                </button>
                              )}
                              <button
                                className="btn-primary-sm"
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                                onClick={() => onOpenInResolver(t.id)}
                              >
                                Workbench ↗
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            4. TECHNICIAN ROSTER & MANAGEMENT TAB (Host & Staff)
            ========================================================================= */}
        {activeTab === 'technicians' && (
          <div className="admin-section-content">
            {/* Modern Glassmorphism Hero Stats Card */}
            <div className="tech-mgmt-hero-card">
              <div className="tech-mgmt-header-row">
                <div>
                  <div className="tech-mgmt-badge">
                    <ShieldCheck size={13} />
                    <span>{isHost ? 'Host Management Portal' : 'Technician Roster'}</span>
                  </div>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0.2rem 0', color: '#fff' }}>
                    {isHost ? 'Technician Provisioning & Role Management' : 'Campus IT Engineering Roster'}
                  </h2>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary, #94a3b8)', margin: 0 }}>
                    {isHost
                      ? 'Create technician accounts, assign specializations, manage credentials, and audit active staff.'
                      : 'Live roster of authenticated university IT technicians, assigned domains, and availability.'}
                  </p>
                </div>
                {isHost && (
                  <button
                    className="btn-primary"
                    onClick={handleOpenAddTech}
                    style={{
                      padding: '0.7rem 1.35rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      gap: '0.5rem',
                      boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.5)',
                    }}
                  >
                    <UserPlus size={18} />
                    <span>+ Provision New Technician</span>
                  </button>
                )}
              </div>

              {/* Live Status Stats Grid */}
              <div className="tech-mgmt-stats-grid">
                <div className="tech-stat-pill">
                  <div className="tech-stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <div className="tech-stat-num">{technicians.length}</div>
                    <div className="tech-stat-label">Total Technicians</div>
                  </div>
                </div>

                <div className="tech-stat-pill">
                  <div className="tech-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div className="tech-stat-num">
                      {technicians.filter((t) => t.is_active !== false).length}
                    </div>
                    <div className="tech-stat-label">Active on Duty</div>
                  </div>
                </div>

                <div className="tech-stat-pill">
                  <div className="tech-stat-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <div className="tech-stat-num">5 Specializations</div>
                    <div className="tech-stat-label">Domains Covered</div>
                  </div>
                </div>

                <div className="tech-stat-pill">
                  <div className="tech-stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                    <TicketIcon size={18} />
                  </div>
                  <div>
                    <div className="tech-stat-num">
                      {technicians.reduce((acc, t) => acc + (t.active_assignments_count || 1), 0)}
                    </div>
                    <div className="tech-stat-label">Assigned Workload</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Specialization Filter Pills */}
            <div
              style={{
                display: 'flex',
                gap: '0.45rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.35rem' }}>
                Filter by Role:
              </span>
              {['All', 'Network', 'Hardware', 'Software', 'Support', 'IAM / Access'].map((specKey) => (
                <button
                  key={specKey}
                  type="button"
                  onClick={() => setTechSpecFilter(specKey)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: techSpecFilter === specKey ? 700 : 500,
                    border: techSpecFilter === specKey ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                    background: techSpecFilter === specKey ? 'var(--primary-600)' : 'var(--bg-surface-subtle)',
                    color: techSpecFilter === specKey ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {specKey === 'All' ? 'All Roles' : `${specKey} Techs`}
                </button>
              ))}
            </div>

            {/* Modern Technician Table */}
            <div className="admin-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Technician</th>
                    <th>Tech ID</th>
                    <th>Specialization / Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Workload</th>
                    {isHost && <th>Administrative Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {technicians
                    .filter((u) => {
                      if (techSpecFilter === 'All') return true;
                      const normU = normalizeSpecialization(u.specialization);
                      const normF = normalizeSpecialization(techSpecFilter);
                      return normU === normF;
                    })
                    .map((u) => {
                      const specNorm = normalizeSpecialization(u.specialization);
                      const badgeClass =
                        specNorm === 'Network'
                          ? 'spec-badge-network'
                          : specNorm === 'Hardware'
                          ? 'spec-badge-hardware'
                          : specNorm === 'Software'
                          ? 'spec-badge-software'
                          : specNorm === 'IAM / Access'
                          ? 'spec-badge-iam'
                          : 'spec-badge-support';

                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '10px',
                                  background:
                                    specNorm === 'Network'
                                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                                      : specNorm === 'Hardware'
                                      ? 'linear-gradient(135deg, #ea580c, #c2410c)'
                                      : specNorm === 'Software'
                                      ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                                      : specNorm === 'IAM / Access'
                                      ? 'linear-gradient(135deg, #9333ea, #7e22ce)'
                                      : 'linear-gradient(135deg, #059669, #047857)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.82rem',
                                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                                }}
                              >
                                {u.avatar_initials || 'TC'}
                              </div>
                              <div>
                                <strong style={{ fontSize: '0.9rem' }}>{u.name}</strong>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  @{u.username || u.netid} • {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="ticket-badge-mono">{u.technician_id || 'TECH-001'}</span>
                          </td>
                          <td>
                            <span className={`category-tag ${badgeClass}`} style={{ fontWeight: 700 }}>
                              {u.specialization || 'Support'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.department}</td>
                          <td>
                            <span
                              className={`status-tag ${
                                u.is_active !== false ? 'status-resolved' : 'status-waiting-for-student'
                              }`}
                            >
                              {u.is_active !== false ? '● Active' : '○ Deactivated'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                              {u.active_assignments_count || 1} tickets
                            </span>
                          </td>
                          {isHost && (
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                  className="btn-secondary-sm"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                                  onClick={() => handleOpenEditTech(u)}
                                  title="Edit Technician Details & Specialization"
                                >
                                  <Edit2 size={13} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  className="btn-secondary-sm"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                                  onClick={() => handleOpenResetPwd(u)}
                                  title="Reset Password"
                                >
                                  <Key size={13} />
                                  <span>Reset Pwd</span>
                                </button>
                                <button
                                  className="btn-secondary-sm"
                                  style={{
                                    padding: '0.35rem 0.65rem',
                                    fontSize: '0.75rem',
                                    color: u.is_active !== false ? '#f87171' : '#4ade80',
                                    borderColor: u.is_active !== false ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
                                    gap: '0.3rem',
                                  }}
                                  onClick={() => handleToggleTechActive(u)}
                                  title={u.is_active !== false ? 'Deactivate account' : 'Activate account'}
                                >
                                  <Power size={13} />
                                  <span>{u.is_active !== false ? 'Suspend' : 'Activate'}</span>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            CAMPUS MAP TAB (Vignan University Real Geodata)
            ========================================================================= */}
        {activeTab === 'campus_map' && (
          <div className="admin-section-content">
            <CampusMap
              currentUser={currentUser}
              tickets={tickets}
              onOpenTicketInResolver={onOpenInResolver}
            />
          </div>
        )}

        {/* =========================================================================
            5. AI REASONING SLA TAB
            ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="admin-section-content">
            <div className="admin-kpis-grid">
              <div className="admin-kpi-card">
                <div className="metric-icon-wrap" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                  <Cpu size={20} />
                </div>
                <div>
                  <div className="kpi-number">{graphs?.kpis.ai_confidence_percent || 94.2}%</div>
                  <div className="kpi-label">Nemotron 3 Accuracy</div>
                  <div className="kpi-sub">Verified root-cause identification</div>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="metric-icon-wrap" style={{ background: 'var(--info-50)', color: 'var(--info-600)' }}>
                  <Zap size={20} />
                </div>
                <div>
                  <div className="kpi-number">2.4</div>
                  <div className="kpi-label">Avg Diagnostic Turns</div>
                  <div className="kpi-sub">Turns to resolution or escalation</div>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="metric-icon-wrap" style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="kpi-number">{graphs?.kpis.ai_resolution_rate_percent || 70}%</div>
                  <div className="kpi-label">Autonomous Resolution</div>
                  <div className="kpi-sub">Resolved without human dispatch</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            6. INFRASTRUCTURE PROBES TAB
            ========================================================================= */}
        {activeTab === 'network' && (
          <div className="admin-section-content">
            <div className="probes-grid">
              {probes?.probes.map((pr) => (
                <div key={pr.name} className="probe-card">
                  <div className="probe-top">
                    <div>
                      <div className="probe-name">{pr.name}</div>
                      <div className="probe-target">{pr.target}</div>
                    </div>
                    <span className={`status-tag status-${pr.status.toLowerCase()}`}>
                      {pr.status}
                    </span>
                  </div>
                  <div className="probe-output">{pr.output_message}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <span>Latency: {pr.latency_ms}ms</span>
                    <span>{new Date(pr.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            7. DATABASE INSPECTION TAB
            ========================================================================= */}
        {activeTab === 'database' && databaseInfo && (
          <div className="admin-section-content">
            <div className="admin-table-card">
              <div className="card-header-flex" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Data Storage & Schema Inspection</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Schema {databaseInfo.schema_version} • Total records: {databaseInfo.total_records}
                  </p>
                </div>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Table Name</th>
                    <th>Records Count</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {databaseInfo.tables.map((tbl) => (
                    <tr key={tbl.table_name}>
                      <td><code style={{ color: 'var(--primary-600)' }}>{tbl.table_name}</code></td>
                      <td><strong>{tbl.count}</strong> records</td>
                      <td>{tbl.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            8. IT SETTINGS & HOST PASSWORD TAB
            ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="admin-section-content">
            {/* Host Password Change Section */}
            {isHost && (
              <div className="admin-table-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Lock size={20} style={{ color: 'var(--primary-600)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Host / Admin Password Security</h3>
                </div>

                {pwdChangeMsg && (
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      background: pwdChangeMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${pwdChangeMsg.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                      color: pwdChangeMsg.type === 'success' ? '#34d399' : '#fca5a5',
                      fontSize: '0.84rem',
                    }}
                  >
                    {pwdChangeMsg.text}
                  </div>
                )}

                <form onSubmit={handleHostPasswordChange} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={currentHostPwd}
                      onChange={(e) => setCurrentHostPwd(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">New Secure Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={newHostPwd}
                      onChange={(e) => setNewHostPwd(e.target.value)}
                      placeholder="Enter new password (min 4 chars)"
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
                    Update Password
                  </button>
                </form>
              </div>
            )}

            {/* Platform Settings */}
            <div className="admin-table-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Help Desk Service Parameters</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Auto-Escalation Threshold</label>
                  <input type="text" className="form-input" defaultValue="4 diagnostic turns without resolution" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tech Bar Walkup Queue Routing</label>
                  <input type="text" className="form-input" defaultValue="Main Library 1st Floor Counter" />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Tier-1 SLA</label>
                  <input type="text" className="form-input" defaultValue="< 15 minutes first resolution" />
                </div>
                <div className="form-group">
                  <label className="form-label">AI Diagnostic Reasoning Engine</label>
                  <input type="text" className="form-input" defaultValue="NVIDIA Nemotron 3 Ultra (OpenRouter)" disabled />
                </div>
              </div>
            </div>

            {/* System Data Purge / Clean Slate Section */}
            {isHost && (
              <div
                className="admin-table-card"
                style={{
                  padding: '1.5rem',
                  marginTop: '1.5rem',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.06) 0%, var(--bg-surface) 100%)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <Trash2 size={18} style={{ color: '#ef4444' }} />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fca5a5' }}>
                        System Data Reset & Fresh Slate
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '620px' }}>
                      Purge all test incident tickets, reset custom technician accounts and clear telemetry caches to restore the platform to a completely clean, fresh initial state.
                    </p>
                  </div>

                  <button
                    className="btn-primary danger-btn"
                    onClick={() => setIsResetDataModalOpen(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
                  >
                    <Trash2 size={15} />
                    <span>Reset System Data (Clean Slate)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL: ADD TECHNICIAN
          ========================================================================= */}
      {isAddTechModalOpen && (
        <div className="modal-backdrop-overlay" onClick={() => setIsAddTechModalOpen(false)}>
          <div
            className="auth-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface, #1e293b)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '520px',
              width: '92%',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} style={{ color: 'var(--primary-600)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Provision New Technician</h3>
              </div>
              <button onClick={() => setIsAddTechModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateTechnicianSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Anand Sen"
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. anand"
                    value={newTechUsername}
                    onChange={(e) => setNewTechUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Initial Password</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTechPassword}
                    onChange={(e) => setNewTechPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. a.sen@university.edu"
                    value={newTechEmail}
                    onChange={(e) => setNewTechEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Specialization</label>
                  <select
                    className="form-select"
                    value={newTechSpec}
                    onChange={(e) => setNewTechSpec(e.target.value as TechnicianSpecialization)}
                  >
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTechDept}
                    onChange={(e) => setNewTechDept(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+1 (555) ..."
                    value={newTechPhone}
                    onChange={(e) => setNewTechPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddTechModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Technician Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT TECHNICIAN
          ========================================================================= */}
      {isEditTechModalOpen && selectedTech && (
        <div className="modal-backdrop-overlay" onClick={() => setIsEditTechModalOpen(false)}>
          <div
            className="auth-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface, #1e293b)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '520px',
              width: '92%',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={20} style={{ color: 'var(--primary-600)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  Edit: {selectedTech.name} ({selectedTech.technician_id || 'TECH'})
                </h3>
              </div>
              <button onClick={() => setIsEditTechModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleUpdateTechnicianSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTechName}
                  onChange={(e) => setEditTechName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Specialization</label>
                  <select
                    className="form-select"
                    value={editTechSpec}
                    onChange={(e) => setEditTechSpec(e.target.value as TechnicianSpecialization)}
                  >
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={editTechActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditTechActive(e.target.value === 'active')}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editTechEmail}
                    onChange={(e) => setEditTechEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editTechPhone}
                    onChange={(e) => setEditTechPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTechDept}
                  onChange={(e) => setEditTechDept(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsEditTechModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RESET TECHNICIAN PASSWORD
          ========================================================================= */}
      {isResetPwdModalOpen && selectedTech && (
        <div className="modal-backdrop-overlay" onClick={() => setIsResetPwdModalOpen(false)}>
          <div
            className="auth-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface, #1e293b)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '440px',
              width: '92%',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={20} style={{ color: 'var(--warning-500)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  Reset Password: {selectedTech.name}
                </h3>
              </div>
              <button onClick={() => setIsResetPwdModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Set a new password for account <strong>@{selectedTech.username || selectedTech.netid}</strong>. The technician will be able to log in immediately with the new password.
            </p>

            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">New Password</label>
                <input
                  type="text"
                  className="form-input"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsResetPwdModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Password Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REASSIGN TECHNICIAN (Host Action)
          ========================================================================= */}
      {isReassignModalOpen && reassignTicket && (
        <div className="modal-backdrop-overlay" onClick={() => setIsReassignModalOpen(false)}>
          <div
            className="auth-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface, #1e293b)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '520px',
              width: '92%',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={20} style={{ color: 'var(--warning-500)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  Reassign Incident: {reassignTicket.ticket_number}
                </h3>
              </div>
              <button onClick={() => setIsReassignModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{reassignTicket.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Category: <strong>{reassignTicket.category}</strong> • Current Tech: <strong>{reassignTicket.assigned_technician || 'Unassigned'}</strong>
              </div>
              {reassignTicket.escalation_info && (
                <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {reassignTicket.escalation_info.target_specialization && (
                    <div style={{ fontSize: '0.78rem', color: '#60a5fa' }}>
                      ⚡ Recommended Specialization: <strong>{reassignTicket.escalation_info.target_specialization}</strong>
                    </div>
                  )}
                  {reassignTicket.escalation_info.original_technician && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Reported by: {reassignTicket.escalation_info.original_technician}
                    </div>
                  )}
                  <div style={{ fontSize: '0.78rem', color: '#fbbf24' }}>
                    Reason: {reassignTicket.escalation_info.reason}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleReassignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select New Assigned Technician</label>
                <select
                  className="form-select"
                  value={reassignTechName}
                  onChange={(e) => setReassignTechName(e.target.value)}
                  required
                >
                  {technicians
                    .filter((u) => u.role === 'technician')
                    .map((u) => (
                      <option key={u.id} value={`${u.name} (${u.specialization || 'Tech'})`}>
                        {u.name} — [{u.specialization || 'General'}] ({u.active_assignments_count || 0} active tickets)
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Host Dispatch & Reassignment Instructions</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  value={reassignNotes}
                  onChange={(e) => setReassignNotes(e.target.value)}
                  placeholder="e.g. 'Transferred from Jordan to Anand for specialized physical hardware inspection.'"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsReassignModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: 'var(--warning-600, #d97706)', borderColor: 'var(--warning-600, #d97706)' }}
                  disabled={isReassigning || !reassignTechName}
                >
                  <UserCheck size={14} />
                  <span>{isReassigning ? 'Reassigning...' : 'Confirm Reassignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RESET SYSTEM DATA (CLEAN SLATE)
          ========================================================================= */}
      {isResetDataModalOpen && (
        <div className="modal-backdrop-overlay" onClick={() => setIsResetDataModalOpen(false)}>
          <div
            className="auth-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface, #1e293b)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '480px',
              width: '92%',
              border: '1px solid rgba(239, 68, 68, 0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={20} style={{ color: '#ef4444' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fca5a5' }}>
                  Clean Slate: Reset All Data
                </h3>
              </div>
              <button onClick={() => setIsResetDataModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#fca5a5', margin: 0, lineHeight: 1.5 }}>
                ⚠️ <strong>Warning:</strong> This will purge all active and closed tickets, reset custom technician accounts, clear chat history and diagnostic audit logs, and restore the initial clean baseline demonstration state.
              </p>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Are you sure you want to perform a factory reset? The application will look completely new.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsResetDataModalOpen(false)} disabled={isResettingData}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary danger-btn"
                onClick={handleSystemDataReset}
                disabled={isResettingData}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Trash2 size={14} />
                <span>{isResettingData ? 'Resetting System...' : 'Confirm Clean Slate Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
