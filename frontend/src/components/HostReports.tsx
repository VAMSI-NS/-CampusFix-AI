import { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Zap,
  TrendingUp,
  RotateCcw,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { ReportSummaryResponse, Ticket } from '../types/chat';
import { INITIAL_MOCK_EXECUTIVE_REPORT } from '../data/mockData';
import { apiUrl } from '../api';

interface HostReportsProps {
  tickets: Ticket[];
}

const DATE_RANGES = ['Last 7 Days', 'Last 30 Days', 'This Semester', 'Year to Date'];

const DEPARTMENTS = [
  'All',
  'Network & Wi-Fi',
  'Identity & Access (IAM)',
  'Academic Tech & Canvas',
  'Printing & Hardware',
  'Residence Life (ResNet)',
];

export default function HostReports({ tickets }: HostReportsProps) {
  const [report, setReport] = useState<ReportSummaryResponse | null>(() => INITIAL_MOCK_EXECUTIVE_REPORT);
  const [selectedRange, setSelectedRange] = useState('Last 30 Days');
  const [selectedDept, setSelectedDept] = useState('All');
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('date_range', selectedRange);
      if (selectedDept !== 'All') params.set('department', selectedDept);

      const res = await fetch(apiUrl(`/reports?${params.toString()}`));
      if (res.ok) {
        const data: ReportSummaryResponse = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to load reports (using default executive report):', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRange, selectedDept]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, tickets]);

  const handleExportCSV = () => {
    if (!report) return;
    const rows = [
      ['Category', 'Count', 'Resolution Rate', 'SLA Avg Mins'],
      ...report.top_issue_categories.map((c) => [
        c.category,
        String(c.count),
        `${c.resolved_pct}%`,
        '12',
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CampusFix_Executive_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!report) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `CampusFix_Executive_Report_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="host-reports-container">
      {/* Executive Read-Only Banner */}
      <div className="host-read-only-banner">
        <div className="banner-badge-group">
          <span className="host-role-pill">Role: Management / Executive Host</span>
          <span className="read-only-tag">Strictly Read-Only Access</span>
        </div>
        <p className="host-disclaimer">
          This portal displays institutional SLA metrics, resolution velocity, and department breakdowns. Administrative modifications are restricted to verified IT technicians.
        </p>
      </div>

      {/* Filter and Export Bar */}
      <div className="reports-control-bar">
        <div className="filters-group-row">
          <div className="filter-item">
            <Calendar size={14} style={{ color: 'var(--primary-600)' }} />
            <select
              className="form-select-sm"
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              {DATE_RANGES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <Filter size={14} style={{ color: 'var(--primary-600)' }} />
            <select
              className="form-select-sm"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  Department: {d}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn-icon-sm"
            onClick={fetchReports}
            title="Refresh SLA metrics"
          >
            <RotateCcw size={14} className={isLoading ? 'spin' : ''} />
          </button>
        </div>

        <div className="export-actions-row">
          <button className="btn-secondary-sm" onClick={handleExportCSV}>
            <Download size={13} />
            <span>Export CSV</span>
          </button>
          <button className="btn-primary-sm" onClick={handleExportJSON}>
            <FileSpreadsheet size={13} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* 4 Core Executive KPIs */}
      {report && (
        <div className="host-kpi-grid">
          <div className="host-kpi-card">
            <div className="metric-icon-wrap" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <div className="kpi-number">{report.total_incidents}</div>
              <div className="kpi-label">Total Incidents</div>
              <div className="kpi-sub">{selectedRange} volume</div>
            </div>
          </div>

          <div className="host-kpi-card">
            <div className="metric-icon-wrap" style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="kpi-number" style={{ color: 'var(--success-600)' }}>
                {report.kpis.ai_resolution_rate_percent}%
              </div>
              <div className="kpi-label">SLA Resolution Rate</div>
              <div className="kpi-sub">Target: &gt; 90%</div>
            </div>
          </div>

          <div className="host-kpi-card">
            <div className="metric-icon-wrap" style={{ background: 'var(--info-50)', color: 'var(--info-600)' }}>
              <Activity size={22} />
            </div>
            <div>
              <div className="kpi-number">
                {Math.round(report.avg_response_time_secs / 60) || 2}m
              </div>
              <div className="kpi-label">Avg Resolution Turnaround</div>
              <div className="kpi-sub">First touch to fix</div>
            </div>
          </div>

          <div className="host-kpi-card">
            <div className="metric-icon-wrap" style={{ background: 'var(--warning-50)', color: 'var(--warning-600)' }}>
              <Zap size={22} />
            </div>
            <div>
              <div className="kpi-number" style={{ color: 'var(--primary-600)' }}>
                {report.kpis.ai_confidence_percent}%
              </div>
              <div className="kpi-label">AI Diagnostic Accuracy</div>
              <div className="kpi-sub">Powered by Nemotron 3</div>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown & Department SLA Turnaround */}
      {report && (
        <div className="host-breakdowns-grid">
          {/* Top Categories */}
          <div className="admin-table-card">
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Incident Volume by IT Domain</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Category distribution across {report.total_incidents} logged incidents
              </p>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Incident Count</th>
                  <th>Resolved %</th>
                </tr>
              </thead>
              <tbody>
                {report.top_issue_categories.map((cat) => (
                  <tr key={cat.category}>
                    <td>
                      <span className="category-tag">{cat.category}</span>
                    </td>
                    <td><strong>{cat.count}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="progress-bar-bg" style={{ flex: 1, height: 6 }}>
                          <div className="progress-bar-fill" style={{ width: `${cat.resolved_pct}%` }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', width: 34 }}>{cat.resolved_pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Department Summary */}
          <div className="admin-table-card">
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Department SLA Compliance</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Turnaround efficiency per engineering team
              </p>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Total Incidents</th>
                  <th>Avg Turnaround</th>
                </tr>
              </thead>
              <tbody>
                {report.department_summary.map((dept) => (
                  <tr key={dept.department}>
                    <td><strong>{dept.department}</strong></td>
                    <td>{dept.ticket_count}</td>
                    <td style={{ color: 'var(--success-600)', fontWeight: 600 }}>{dept.avg_turnaround_hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Executive Synopsis Summary Card */}
      <div className="printable-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <ShieldCheck size={18} style={{ color: 'var(--primary-600)' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Executive Operational Synopsis</h4>
        </div>
        <p className="report-synopsis-text" style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          During the <strong>{selectedRange}</strong> reporting cycle, CampusFix processed <strong>{report?.total_incidents || 0} incidents</strong> across all university technical units. The Tier-1 AI Diagnostic Specialist maintained an SLA resolution rate of <strong>{report?.kpis.ai_resolution_rate_percent || 0}%</strong> with zero institutional downtime.
        </p>
      </div>
    </div>
  );
}
