import { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Wrench,
  Search,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Eye,
  X,
  Zap,
} from 'lucide-react';
import {
  Ticket,
  TicketStatus,
  CampusUser,
  IncidentClusterItem,
  CampusAnomalyItem,
  IntelligenceOverviewResponse,
  IncidentClusteringResponse,
  CampusAnomalyResponse,
} from '../types/chat';
import { apiUrl } from '../api';

interface AIIntelligenceViewProps {
  currentUser?: CampusUser | null;
  tickets: Ticket[];
  onOpenTicketInResolver: (ticketId: string) => void;
  onNavigateToMap: (locCodeOrName?: string) => void;
  onUpdateTicketStatus?: (ticketId: string, newStatus: TicketStatus) => void;
  onRefreshTickets?: () => void;
}

type ActiveSubTab = 'clusters' | 'anomalies' | 'overview';

export default function AIIntelligenceView({
  currentUser: _currentUser,
  tickets,
  onOpenTicketInResolver,
  onNavigateToMap,
  onUpdateTicketStatus: _onUpdateTicketStatus,
  onRefreshTickets,
}: AIIntelligenceViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveSubTab>('clusters');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Intelligence Data
  const [clustersData, setClustersData] = useState<IncidentClusteringResponse | null>(null);
  const [anomaliesData, setAnomaliesData] = useState<CampusAnomalyResponse | null>(null);
  const [overviewData, setOverviewData] = useState<IntelligenceOverviewResponse | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Drill-down Modal State
  const [inspectedCluster, setInspectedCluster] = useState<IncidentClusterItem | null>(null);
  const [inspectedAnomaly, setInspectedAnomaly] = useState<CampusAnomalyItem | null>(null);

  // Batch Assignment State
  const [batchAssignModalCluster, setBatchAssignModalCluster] = useState<IncidentClusterItem | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('Anand Sen');
  const [isBatchAssigning, setIsBatchAssigning] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchIntelligenceData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const token = localStorage.getItem('campusfix_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [cRes, aRes, oRes] = await Promise.all([
        fetch(apiUrl('/intelligence/clusters'), { headers }),
        fetch(apiUrl('/intelligence/anomalies'), { headers }),
        fetch(apiUrl('/intelligence/overview'), { headers }),
      ]);

      if (cRes.ok && aRes.ok && oRes.ok) {
        const [cJson, aJson, oJson] = await Promise.all([cRes.json(), aRes.json(), oRes.json()]);
        setClustersData(cJson);
        setAnomaliesData(aJson);
        setOverviewData(oJson);
      } else {
        throw new Error(`Failed to fetch AI intelligence data: HTTP ${cRes.status}`);
      }
    } catch (err: any) {
      console.warn('Backend intelligence endpoint error:', err);
      setErrorMessage(err.message || 'Unable to fetch real-time intelligence data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligenceData();
  }, [tickets.length]);

  // Handle Batch Assign
  const handleExecuteBatchAssign = async () => {
    if (!batchAssignModalCluster) return;
    setIsBatchAssigning(true);
    try {
      const token = localStorage.getItem('campusfix_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl(`/intelligence/clusters/${batchAssignModalCluster.id}/batch-assign`), {
        method: 'POST',
        headers,
        body: JSON.stringify({ technician_name: selectedAssignee }),
      });

      if (res.ok) {
        const json = await res.json();
        setActionSuccessMsg(json.message || `Successfully batch-assigned tickets to ${selectedAssignee}.`);
        setBatchAssignModalCluster(null);
        if (onRefreshTickets) onRefreshTickets();
        fetchIntelligenceData();
      } else {
        const errJson = await res.json();
        alert(errJson.detail || 'Batch assignment failed.');
      }
    } catch (err) {
      console.error('Batch assign error:', err);
      alert('Network error while executing batch assignment.');
    } finally {
      setIsBatchAssigning(false);
    }
  };

  // Filtered Clusters
  const filteredClusters = useMemo(() => {
    if (!clustersData?.clusters) return [];
    return clustersData.clusters.filter((c) => {
      const matchSearch =
        searchQuery === '' ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.affected_locations.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.ticket_numbers.some((num) => num.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = selectedCategory === 'all' || c.primary_category === selectedCategory;
      const matchSev = selectedSeverity === 'all' || c.severity.toLowerCase() === selectedSeverity.toLowerCase();

      return matchSearch && matchCat && matchSev;
    });
  }, [clustersData, searchQuery, selectedCategory, selectedSeverity]);

  // Filtered Anomalies
  const filteredAnomalies = useMemo(() => {
    if (!anomaliesData?.anomalies) return [];
    return anomaliesData.anomalies.filter((a) => {
      const matchSearch =
        searchQuery === '' ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.real_evidence.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase())) ||
        a.affected_ticket_numbers.some((num) => num.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
      const matchSev = selectedSeverity === 'all' || a.severity.toLowerCase() === selectedSeverity.toLowerCase();

      return matchSearch && matchCat && matchSev;
    });
  }, [anomaliesData, searchQuery, selectedCategory, selectedSeverity]);

  // Helper to find full ticket objects for a cluster/anomaly
  const getTicketsForCluster = (cluster: IncidentClusterItem): Ticket[] => {
    return tickets.filter((t) => cluster.ticket_ids.includes(t.id) || cluster.ticket_numbers.includes(t.ticket_number));
  };

  const getTicketsForAnomaly = (anomaly: CampusAnomalyItem): Ticket[] => {
    return tickets.filter((t) => anomaly.affected_ticket_ids.includes(t.id) || anomaly.affected_ticket_numbers.includes(t.ticket_number));
  };

  // Severity color helpers
  const getSeverityBadgeClass = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return 'badge-saas badge-saas-danger';
      case 'high':
      case 'warning':
        return 'badge-saas badge-saas-warning';
      case 'medium':
      case 'info':
        return 'badge-saas badge-saas-info';
      default:
        return 'badge-saas badge-saas-success';
    }
  };

  const getAnomalyScoreColor = (score: number) => {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f59e0b';
    return 'var(--primary-500)';
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem 2rem 3rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* SaaS Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                AI Intelligence & Incident Detective
              </h1>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Multi-incident correlation, duplicate report grouping, and real-time telemetry anomaly detection.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-saas btn-saas-secondary"
            onClick={() => fetchIntelligenceData()}
            disabled={isLoading}
            title="Refresh AI analysis"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionSuccessMsg && (
        <div
          className="animate-slide-down"
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#10b981',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.88rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="card-saas" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Incident Clusters
            </span>
            <Layers size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.4rem 0 0.2rem' }}>
            {clustersData?.total_clusters_found ?? '—'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            From {clustersData?.total_incidents_analyzed ?? tickets.length} total incident reports
          </div>
        </div>

        <div className="card-saas" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Detected Anomalies
            </span>
            <ShieldAlert size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.4rem 0 0.2rem', color: (anomaliesData?.total_anomalies_detected || 0) > 0 ? '#f59e0b' : 'inherit' }}>
            {anomaliesData?.total_anomalies_detected ?? '—'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Unusual frequency spikes & failure density
          </div>
        </div>

        <div className="card-saas" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Shared Outages
            </span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.4rem 0 0.2rem', color: (clustersData?.potential_outages_detected || 0) > 0 ? '#ef4444' : 'inherit' }}>
            {clustersData?.potential_outages_detected ?? '—'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {clustersData?.duplicate_reports_identified ?? 0} duplicate student reports identified
          </div>
        </div>

        <div className="card-saas" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Campus Risk Index
            </span>
            <Activity size={18} color="var(--primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', margin: '0.4rem 0 0.2rem' }}>
            <span
              style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                color: getAnomalyScoreColor(anomaliesData?.campus_risk_score || 0),
              }}
            >
              {anomaliesData?.campus_risk_score ?? 0}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>/ 100</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {anomaliesData?.data_confidence === 'insufficient_data' ? 'Baseline monitoring active' : 'Live campus telemetry health'}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          paddingBottom: '0.5rem',
        }}
      >
        <button
          type="button"
          className={`btn-saas ${activeTab === 'clusters' ? 'btn-saas-primary' : 'btn-saas-secondary'}`}
          onClick={() => setActiveTab('clusters')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '6px' }}
        >
          <Layers size={16} />
          <span>Incident Clusters ({clustersData?.clusters?.length || 0})</span>
        </button>

        <button
          type="button"
          className={`btn-saas ${activeTab === 'anomalies' ? 'btn-saas-primary' : 'btn-saas-secondary'}`}
          onClick={() => setActiveTab('anomalies')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '6px' }}
        >
          <ShieldAlert size={16} />
          <span>Campus Anomalies ({anomaliesData?.anomalies?.length || 0})</span>
        </button>

        <button
          type="button"
          className={`btn-saas ${activeTab === 'overview' ? 'btn-saas-primary' : 'btn-saas-secondary'}`}
          onClick={() => setActiveTab('overview')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '6px' }}
        >
          <Activity size={16} />
          <span>Hotspots & Overview</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        className="card-saas"
        style={{
          padding: '0.8rem 1.2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: '1 1 300px', maxWidth: '480px' }}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            className="saas-input"
            placeholder={activeTab === 'clusters' ? 'Search clusters by keyword, location, ticket #...' : 'Search anomalies by location, evidence, service...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category:</span>
            <select
              className="saas-input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', width: 'auto' }}
            >
              <option value="all">All Categories</option>
              <option value="Eduroam Wi-Fi">Eduroam Wi-Fi</option>
              <option value="PaperCut Printing">PaperCut Printing</option>
              <option value="Canvas / SSO">Canvas / SSO</option>
              <option value="Duo MFA">Duo MFA</option>
              <option value="Lab / Computer Access">Lab / Computer Access</option>
              <option value="VPN">VPN</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Severity:</span>
            <select
              className="saas-input"
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', width: 'auto' }}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-saas animate-pulse" style={{ height: '140px', padding: '1.5rem' }}>
              <div style={{ width: '40%', height: '20px', background: 'var(--border-color)', borderRadius: '4px', marginBottom: '1rem' }} />
              <div style={{ width: '80%', height: '14px', background: 'var(--border-color)', borderRadius: '4px', marginBottom: '0.6rem' }} />
              <div style={{ width: '60%', height: '14px', background: 'var(--border-color)', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Error Display */}
      {!isLoading && errorMessage && (
        <div
          className="card-saas"
          style={{
            padding: '2rem',
            textAlign: 'center',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
          }}
        >
          <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 0.8rem' }} />
          <h3 style={{ margin: '0 0 0.4rem', color: '#ef4444' }}>Unable to Load Intelligence Data</h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{errorMessage}</p>
          <button type="button" className="btn-saas btn-saas-secondary" onClick={() => fetchIntelligenceData()}>
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* TAB 1: INCIDENT CLUSTERS */}
      {!isLoading && !errorMessage && activeTab === 'clusters' && (
        <div>
          {/* Operational Triage Workflow Visual Banner */}
          <div
            className="card-saas"
            style={{
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(8, 145, 178, 0.15)',
                  color: 'var(--primary-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                }}
              >
                1
              </div>
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Automated Multi-Incident Correlation
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Groups redundant student complaints by symptom, location, and infrastructure components.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <ArrowRight size={16} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                }}
              >
                2
              </div>
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Shared Outage & Duplicate Tagging
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Flags single root causes across multiple user reports to eliminate duplicate tickets.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <ArrowRight size={16} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                }}
              >
                3
              </div>
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  One-Click Batch Specialist Dispatch
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Assign entire clusters to designated Network, Hardware, or System specialists.
                </div>
              </div>
            </div>
          </div>
          {filteredClusters.length === 0 ? (
            <div className="card-saas" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <Layers size={40} color="var(--text-secondary)" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
              <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem' }}>No Incident Clusters Found</h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '450px', marginLeft: 'auto', marginRight: 'auto' }}>
                {clustersData?.data_confidence === 'insufficient_data'
                  ? 'No incident reports logged yet. Once students submit tickets, the AI engine will correlate similar incidents into clusters automatically.'
                  : 'No clusters match your current search or filter criteria.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {filteredClusters.map((cluster) => {
                return (
                  <div
                    key={cluster.id}
                    className="card-saas"
                    style={{
                      padding: '1.4rem 1.6rem',
                      borderLeft: cluster.is_single_outage_pattern
                        ? '4px solid #ef4444'
                        : cluster.duplicate_risk
                        ? '4px solid #f59e0b'
                        : '4px solid var(--primary)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    {/* Cluster Header */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '0.8rem',
                        marginBottom: '0.8rem',
                      }}
                    >
                      <div style={{ flex: '1 1 500px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                          <span className={getSeverityBadgeClass(cluster.severity)}>{cluster.severity}</span>
                          <span className="badge-saas badge-saas-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Layers size={12} />
                            <strong>{cluster.incident_count} Incidents</strong>
                          </span>
                          {cluster.is_single_outage_pattern && (
                            <span
                              className="badge-saas"
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                fontWeight: 700,
                              }}
                            >
                              🚨 Single Outage Pattern
                            </span>
                          )}
                          {cluster.duplicate_risk && (
                            <span
                              className="badge-saas"
                              style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                              }}
                            >
                              👥 Duplicate Reports ({Math.round(cluster.duplicate_ratio * 100)}%)
                            </span>
                          )}
                          <span
                            className="badge-saas"
                            style={{
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-secondary)',
                              fontSize: '0.75rem',
                            }}
                          >
                            Trend: {cluster.recent_trend}
                          </span>
                        </div>

                        <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 700 }}>{cluster.title}</h3>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn-saas btn-saas-secondary"
                          onClick={() => setInspectedCluster(cluster)}
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                        >
                          <Eye size={14} />
                          <span>Inspect ({cluster.incident_count})</span>
                        </button>
                        <button
                          type="button"
                          className="btn-saas btn-saas-primary"
                          onClick={() => setBatchAssignModalCluster(cluster)}
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                        >
                          <Zap size={14} />
                          <span>Batch Assign</span>
                        </button>
                      </div>
                    </div>

                    {/* Summary */}
                    <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {cluster.summary}
                    </p>

                    {/* Meta tags & locations */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={14} color="var(--primary)" />
                        <span>Locations:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{cluster.affected_locations.join(', ') || 'Campus'}</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                        <Wrench size={14} color="#a855f7" />
                        <span>Recommended Spec:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{cluster.recommended_specialization} Specialist</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                        <span>Tickets:</span>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {cluster.ticket_numbers.slice(0, 4).map((tNum) => (
                            <button
                              key={tNum}
                              type="button"
                              onClick={() => onOpenTicketInResolver(tNum)}
                              style={{
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                borderRadius: '4px',
                                padding: '0.1rem 0.4rem',
                                color: 'var(--primary)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {tNum}
                            </button>
                          ))}
                          {cluster.ticket_numbers.length > 4 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              +{cluster.ticket_numbers.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Guideline */}
                    <div
                      style={{
                        marginTop: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <div>
                        💡 <strong>Technician Guidance:</strong> {cluster.recommended_action}
                      </div>
                      {cluster.affected_locations.length > 0 && (
                        <button
                          type="button"
                          onClick={() => onNavigateToMap(cluster.affected_locations[0])}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: 600,
                            padding: 0,
                          }}
                        >
                          <span>View on Campus Map</span>
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CAMPUS ANOMALY DETECTIVE */}
      {!isLoading && !errorMessage && activeTab === 'anomalies' && (
        <div>
          {/* Anomaly Risk Scale & Diagnostic Framework Banner */}
          <div
            className="card-saas"
            style={{
              padding: '1.25rem',
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(168, 85, 247, 0.04) 100%)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="#a855f7" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Campus Telemetry Risk Index & Diagnostic Framework
                </span>
              </div>
              <span className="badge-saas badge-saas-secondary" style={{ fontSize: '0.75rem' }}>
                Baseline Threshold: 1 concurrent incident per building
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem', color: '#10b981', fontWeight: 700 }}>
                  <CheckCircle2 size={13} />
                  <span>Score 0 – 49: Baseline Normal</span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Single-terminal user errors within standard deviation.</div>
              </div>

              <div style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem', color: '#f59e0b', fontWeight: 700 }}>
                  <AlertTriangle size={13} />
                  <span>Score 50 – 74: Elevated Velocity</span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Cross-building service slowdown or authentication spikes.</div>
              </div>

              <div style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem', color: '#ef4444', fontWeight: 700 }}>
                  <ShieldAlert size={13} />
                  <span>Score 75 – 100: Critical Anomaly</span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Hardware fault surge or localized AP infrastructure outage.</div>
              </div>
            </div>
          </div>
          {filteredAnomalies.length === 0 ? (
            <div className="card-saas" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem' }}>All Campus Systems Normal</h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '450px', marginLeft: 'auto', marginRight: 'auto' }}>
                {anomaliesData?.data_confidence === 'insufficient_data'
                  ? 'Historical baseline data is currently accumulating. Anomaly triggers will activate as failure frequency or localized density shifts.'
                  : 'No anomalies or abnormal frequency spikes detected in live telemetry.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {filteredAnomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className="card-saas"
                  style={{
                    padding: '1.6rem',
                    border: anomaly.severity === 'critical' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                    boxShadow: anomaly.severity === 'critical' ? '0 4px 20px rgba(239, 68, 68, 0.1)' : 'none',
                  }}
                >
                  {/* Anomaly Top Row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: '1 1 500px' }}>
                      {/* Anomaly Score Meter */}
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '12px',
                          background:
                            anomaly.severity === 'critical'
                              ? 'rgba(239, 68, 68, 0.12)'
                              : anomaly.severity === 'warning'
                              ? 'rgba(245, 158, 11, 0.12)'
                              : 'rgba(99, 102, 241, 0.12)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `2px solid ${getAnomalyScoreColor(anomaly.anomaly_score)}`,
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: getAnomalyScoreColor(anomaly.anomaly_score), lineHeight: 1 }}>
                          {anomaly.anomaly_score}
                        </span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          Score
                        </span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                          <span className={getSeverityBadgeClass(anomaly.severity)}>{anomaly.severity.toUpperCase()}</span>
                          <span className="badge-saas badge-saas-secondary">{anomaly.anomaly_type.replace('_', ' ').toUpperCase()}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <MapPin size={13} /> {anomaly.location}
                          </span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>{anomaly.title}</h3>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {anomaly.explanation}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-saas btn-saas-secondary"
                        onClick={() => setInspectedAnomaly(anomaly)}
                        style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                      >
                        <Eye size={14} />
                        <span>Inspect Incidents ({anomaly.affected_ticket_numbers.length})</span>
                      </button>
                      <button
                        type="button"
                        className="btn-saas btn-saas-secondary"
                        onClick={() => onNavigateToMap(anomaly.location)}
                        style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                      >
                        <MapPin size={14} />
                        <span>Map Hotspot</span>
                      </button>
                    </div>
                  </div>

                  {/* Dual Grid: Real Evidence vs AI Inference */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: '1.25rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    {/* Real Evidence Section */}
                    <div
                      style={{
                        padding: '1.2rem',
                        background: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)',
                        borderLeft: '4px solid #10b981',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#10b981',
                          }}
                        >
                          <CheckCircle2 size={14} />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#10b981' }}>
                          Verified Real Evidence
                        </span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.65 }}>
                        {anomaly.real_evidence.map((ev, i) => (
                          <li key={i} style={{ marginBottom: '0.35rem' }}>
                            {ev}
                          </li>
                        ))}
                      </ul>
                      {anomaly.baseline_comparison && (
                        <div
                          style={{
                            marginTop: '0.75rem',
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            borderTop: '1px dashed var(--border-default)',
                            paddingTop: '0.6rem',
                          }}
                        >
                          ⚖️ <strong>Baseline Delta:</strong> {anomaly.baseline_comparison}
                        </div>
                      )}
                    </div>

                    {/* AI Inference & Hypothesis Section */}
                    <div
                      style={{
                        padding: '1.2rem',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderLeft: '4px solid #a855f7',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(168, 85, 247, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#a855f7',
                          }}
                        >
                          <Sparkles size={14} />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#a855f7' }}>
                          AI Diagnostic Inference
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.65 }}>
                        {anomaly.ai_inference}
                      </p>
                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.5rem 0.75rem',
                          background: 'rgba(168, 85, 247, 0.1)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          color: 'var(--text-primary)',
                          border: '1px solid rgba(168, 85, 247, 0.2)',
                        }}
                      >
                        ⚡ <strong>Recommended Action:</strong> {anomaly.recommended_action}
                      </div>
                    </div>
                  </div>

                  {/* Affected Tickets Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Correlated Tickets:</span>
                    {anomaly.affected_ticket_numbers.map((tNum) => (
                      <button
                        key={tNum}
                        type="button"
                        onClick={() => onOpenTicketInResolver(tNum)}
                        style={{
                          background: 'var(--bg-surface-hover)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.2rem 0.5rem',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {tNum}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HOTSPOTS & OVERVIEW */}
      {!isLoading && !errorMessage && activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {/* Top Campus Hotspots */}
          <div className="card-saas" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="var(--primary)" />
              <span>Campus Incident Hotspots</span>
            </h3>
            {overviewData?.top_hotspots && overviewData.top_hotspots.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.8rem' }}>
                {overviewData.top_hotspots.map((hs, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.8rem',
                      background: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : 'var(--border-default)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{hs.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="badge-saas badge-saas-secondary">{hs.active_incidents} active</span>
                      <button
                        type="button"
                        onClick={() => onNavigateToMap(hs.location)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No active building hotspots recorded.</p>
            )}
          </div>

          {/* Top Impacted Services */}
          <div className="card-saas" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="#a855f7" />
              <span>Impacted Service Distribution</span>
            </h3>
            {overviewData?.top_impacted_services && overviewData.top_impacted_services.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.8rem' }}>
                {overviewData.top_impacted_services.map((svc, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.8rem',
                      background: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{svc.service}</span>
                    <span className="badge-saas badge-saas-primary">{svc.active_incidents} active cases</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No service failure concentration.</p>
            )}
          </div>
        </div>
      )}

      {/* DRILL-DOWN MODAL FOR CLUSTER */}
      {inspectedCluster && (
        <div
          className="modal-overlay animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
          }}
        >
          <div
            className="card-saas animate-scale-up"
            style={{
              width: '100%',
              maxWidth: '840px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span className={getSeverityBadgeClass(inspectedCluster.severity)}>{inspectedCluster.severity}</span>
                <h2 style={{ margin: '0.4rem 0 0', fontSize: '1.3rem', fontWeight: 800 }}>{inspectedCluster.title}</h2>
              </div>
              <button
                type="button"
                className="btn-saas btn-saas-secondary"
                onClick={() => setInspectedCluster(null)}
                style={{ padding: '0.4rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {inspectedCluster.summary}
            </p>

            <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Underlying Correlated Incidents ({getTicketsForCluster(inspectedCluster).length || inspectedCluster.ticket_numbers.length})
            </h4>

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: '0.8rem', paddingRight: '0.4rem' }}>
              {getTicketsForCluster(inspectedCluster).map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '0.8rem 1rem',
                    background: 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <strong>{t.ticket_number}</strong>
                      <span className="badge-saas badge-saas-secondary">{t.priority}</span>
                      <span className="badge-saas badge-saas-secondary">{t.status}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>• {t.netid}</span>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{t.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      📍 {t.location} | Device: {t.device || 'Campus'}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-saas btn-saas-secondary"
                    onClick={() => {
                      setInspectedCluster(null);
                      onOpenTicketInResolver(t.ticket_number);
                    }}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', whiteSpace: 'nowrap' }}
                  >
                    <span>Open in Resolver</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                type="button"
                className="btn-saas btn-saas-secondary"
                onClick={() => setInspectedCluster(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-saas btn-saas-primary"
                onClick={() => {
                  const target = inspectedCluster;
                  setInspectedCluster(null);
                  setBatchAssignModalCluster(target);
                }}
              >
                <Zap size={14} />
                <span>Batch Assign All Tickets</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRILL-DOWN MODAL FOR ANOMALY */}
      {inspectedAnomaly && (
        <div
          className="modal-overlay animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
          }}
        >
          <div
            className="card-saas animate-scale-up"
            style={{
              width: '100%',
              maxWidth: '840px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span className={getSeverityBadgeClass(inspectedAnomaly.severity)}>{inspectedAnomaly.severity.toUpperCase()}</span>
                <h2 style={{ margin: '0.4rem 0 0', fontSize: '1.3rem', fontWeight: 800 }}>{inspectedAnomaly.title}</h2>
              </div>
              <button
                type="button"
                className="btn-saas btn-saas-secondary"
                onClick={() => setInspectedAnomaly(null)}
                style={{ padding: '0.4rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Correlated Incident Tickets ({getTicketsForAnomaly(inspectedAnomaly).length || inspectedAnomaly.affected_ticket_numbers.length})
            </h4>

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: '0.8rem', paddingRight: '0.4rem' }}>
              {getTicketsForAnomaly(inspectedAnomaly).map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '0.8rem 1rem',
                    background: 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <strong>{t.ticket_number}</strong>
                      <span className="badge-saas badge-saas-secondary">{t.priority}</span>
                      <span className="badge-saas badge-saas-secondary">{t.status}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>• {t.netid}</span>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{t.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      📍 {t.location} | Category: {t.category}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-saas btn-saas-secondary"
                    onClick={() => {
                      setInspectedAnomaly(null);
                      onOpenTicketInResolver(t.ticket_number);
                    }}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', whiteSpace: 'nowrap' }}
                  >
                    <span>Open in Resolver</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                type="button"
                className="btn-saas btn-saas-secondary"
                onClick={() => setInspectedAnomaly(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH ASSIGN MODAL */}
      {batchAssignModalCluster && (
        <div
          className="modal-overlay animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
          }}
        >
          <div
            className="card-saas animate-scale-up"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={18} color="var(--primary)" />
                <span>Batch Assign Cluster</span>
              </h3>
              <button
                type="button"
                className="btn-saas btn-saas-secondary"
                onClick={() => setBatchAssignModalCluster(null)}
                style={{ padding: '0.3rem' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Assign all <strong>{batchAssignModalCluster.incident_count} tickets</strong> in cluster{' '}
              <em>"{batchAssignModalCluster.title}"</em> to a designated technician:
            </p>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Target Technician:
              </label>
              <select
                className="saas-input"
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="Anand Sen">Anand Sen (Network Specialist)</option>
                <option value="Jordan Smith">Jordan Smith (Hardware Specialist)</option>
                <option value="Taylor Swift">Taylor Swift (Software Specialist)</option>
                <option value="Alex Chen">Alex Chen (IAM / Access Specialist)</option>
                <option value="Campus IT Tier-2 Escalations">Campus IT Tier-2 Escalations</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                type="button"
                className="btn-saas btn-saas-secondary"
                onClick={() => setBatchAssignModalCluster(null)}
                disabled={isBatchAssigning}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-saas btn-saas-primary"
                onClick={handleExecuteBatchAssign}
                disabled={isBatchAssigning}
              >
                {isBatchAssigning ? 'Assigning...' : 'Confirm Batch Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
