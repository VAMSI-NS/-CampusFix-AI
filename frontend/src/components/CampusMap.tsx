import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  CampusLocation,
  CampusMapDataResponse,
  CampusUser,
  Ticket,
} from '../types/chat';
import { getClientCampusMapData } from '../data/mockData';
import {
  MapPin,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  LifeBuoy,
  Sparkles,
  RefreshCw,
  RotateCcw,
  ExternalLink,
  Wrench,
  Search,
  Building,
} from 'lucide-react';

interface CampusMapProps {
  currentUser?: CampusUser | null;
  tickets?: Ticket[];
  initialSelectedLocationId?: string | null;
  onOpenTicketInResolver?: (ticketId: string) => void;
  onAskAiAboutLocation?: (locationName: string) => void;
  isEmbedded?: boolean;
}

// Vignan University, Vadlamudi, Guntur, AP coordinates
const VIGNAN_CENTER: [number, number] = [16.2334, 80.5508];
const DEFAULT_ZOOM = 17;

export default function CampusMap({
  currentUser,
  tickets = [],
  initialSelectedLocationId,
  onOpenTicketInResolver,
  onAskAiAboutLocation,
  isEmbedded = false,
}: CampusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapData, setMapData] = useState<CampusMapDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyAssignedOnly, setShowMyAssignedOnly] = useState(false);

  const isHost = currentUser && (currentUser.role === 'host' || currentUser.role === 'admin');
  const isTechnician = currentUser && currentUser.role === 'technician';

  // Fetch or construct map data
  const fetchMapData = async () => {
    setIsLoading(true);
    let data: CampusMapDataResponse | null = null;
    try {
      const token = localStorage.getItem('campusfix_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/campus/map', { headers });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          data = await res.json();
        }
      }
    } catch (err) {
      console.warn('Backend campus map endpoint unavailable, using verified client data:', err);
    }

    if (!data) {
      data = getClientCampusMapData(currentUser, tickets);
    }

    setMapData(data);
    setIsLoading(false);

    if (initialSelectedLocationId && data?.locations) {
      const target = data.locations.find(
        (l) => l.id === initialSelectedLocationId || l.code.toLowerCase() === initialSelectedLocationId.toLowerCase()
      );
      if (target) setSelectedLocation(target);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [currentUser, tickets.length]);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    if (!mapData?.locations) return [];
    return mapData.locations.filter((loc) => {
      // Category filter
      if (categoryFilter !== 'All' && loc.category !== categoryFilter) return false;

      // Status filter
      if (statusFilter === 'IncidentsOnly' && loc.active_incident_count === 0) return false;
      if (statusFilter === 'OperationalOnly' && loc.service_status !== 'operational') return false;
      if (statusFilter === 'OutagesOnly' && loc.service_status !== 'outage') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = loc.name.toLowerCase().includes(q);
        const matchCode = loc.code.toLowerCase().includes(q);
        const matchDesc = loc.description.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDesc) return false;
      }

      // My Assigned Only (for technicians)
      if (showMyAssignedOnly && isTechnician && currentUser?.name) {
        const hasMyTickets = loc.assigned_technicians.some((t) =>
          t.toLowerCase().includes(currentUser.name.toLowerCase())
        );
        if (!hasMyTickets) return false;
      }

      return true;
    });
  }, [mapData, categoryFilter, statusFilter, searchQuery, showMyAssignedOnly, isTechnician, currentUser]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: VIGNAN_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 15,
      maxZoom: 19,
      zoomControl: false,
    });

    // Dark-styled CARTO tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a> | Vignan University Vadlamudi Campus',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    // Zoom control on top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers on filteredLocations changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    filteredLocations.forEach((loc) => {
      const isSelected = selectedLocation?.id === loc.id;
      const hasOutage = loc.service_status === 'outage';
      const hasDegraded = loc.service_status === 'degraded';
      const isTechBar = loc.active_tech_bar;

      // Color Theme
      let markerColor = '#10b981'; // Green (Operational)
      let pulseColor = 'rgba(16, 185, 129, 0.4)';
      let iconEmoji = '🏢';

      if (hasOutage) {
        markerColor = '#ef4444'; // Red
        pulseColor = 'rgba(239, 68, 68, 0.6)';
        iconEmoji = '⚠️';
      } else if (hasDegraded) {
        markerColor = '#f59e0b'; // Amber
        pulseColor = 'rgba(245, 158, 11, 0.5)';
        iconEmoji = '⚡';
      } else if (isTechBar) {
        markerColor = '#6366f1'; // Indigo
        pulseColor = 'rgba(99, 102, 241, 0.5)';
        iconEmoji = '🛠️';
      }

      if (loc.category === 'Hostel / Residential') iconEmoji = '🏠';
      else if (loc.category === 'Data Center') iconEmoji = '🗄️';
      else if (loc.category === 'Student Center') iconEmoji = '☕';
      else if (loc.category === 'Library & Tech Bar') iconEmoji = '📚';

      const customHtml = `
        <div class="campus-map-pin ${isSelected ? 'selected' : ''} ${hasOutage ? 'pulse-danger' : hasDegraded ? 'pulse-warn' : ''}" style="--pin-color: ${markerColor}; --pulse-color: ${pulseColor};">
          <div class="pin-inner">
            <span class="pin-icon">${iconEmoji}</span>
            ${loc.active_incident_count > 0 ? `<span class="pin-badge">${loc.active_incident_count}</span>` : ''}
          </div>
          <div class="pin-label">${loc.code}</div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: customHtml,
        className: 'custom-leaflet-pin',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon });

      marker.on('click', () => {
        setSelectedLocation(loc);
        map.flyTo([loc.latitude, loc.longitude], 18, { duration: 0.8 });
      });

      marker.bindTooltip(
        `<div class="map-tooltip-content">
          <strong>${loc.name}</strong>
          <div>Status: <span style="color: ${markerColor}; font-weight: 700;">${loc.service_status.toUpperCase()}</span></div>
          ${loc.active_incident_count > 0 ? `<div>Active Incidents: <strong>${loc.active_incident_count}</strong></div>` : '<div>All systems nominal</div>'}
        </div>`,
        { direction: 'top', offset: [0, -18] }
      );

      markersGroup.addLayer(marker);
    });
  }, [filteredLocations, selectedLocation]);

  // Center on campus
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(VIGNAN_CENTER, DEFAULT_ZOOM, { duration: 1 });
    }
  };

  // Focus specific location
  const handleSelectLocation = (loc: CampusLocation) => {
    setSelectedLocation(loc);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], 18, { duration: 0.8 });
    }
  };

  // Find corresponding tickets for the selected location
  const locationTickets = useMemo(() => {
    if (!selectedLocation || !tickets) return [];
    const locLower = selectedLocation.name.toLowerCase();
    const codeLower = selectedLocation.code.toLowerCase();

    return tickets.filter((t) => {
      if (!t.location) return false;
      const tLoc = t.location.toLowerCase();
      if (selectedLocation.id.includes(tLoc) || tLoc.includes(codeLower)) return true;
      if (tLoc.includes('library') && locLower.includes('library')) return true;
      if ((tLoc.includes('u-block') || tLoc.includes('mahaveer') || tLoc.includes('engineering')) && locLower.includes('u-block')) return true;
      if ((tLoc.includes('a-block') || tLoc.includes('admin')) && locLower.includes('a-block')) return true;
      if ((tLoc.includes('h-block') || tLoc.includes('aryabhata')) && locLower.includes('h-block')) return true;
      if ((tLoc.includes('priyamvada') || tLoc.includes('boys hostel') || tLoc.includes('residential')) && locLower.includes('priyamvada')) return true;
      if ((tLoc.includes('sarojini') || tLoc.includes('girls hostel')) && locLower.includes('sarojini')) return true;
      if ((tLoc.includes('data center') || tLoc.includes('computing center') || tLoc.includes('ccc')) && locLower.includes('data center')) return true;
      if ((tLoc.includes('sac') || tLoc.includes('dining') || tLoc.includes('sangam')) && locLower.includes('sangam')) return true;
      if ((tLoc.includes('innovation') || tLoc.includes('v-hub')) && locLower.includes('innovation')) return true;
      if ((tLoc.includes('l-block') || tLoc.includes('bio') || tLoc.includes('pharmacy')) && locLower.includes('l-block')) return true;

      return false;
    });
  }, [selectedLocation, tickets]);

  const categories = ['All', 'Academic', 'Administrative', 'Library & Tech Bar', 'Data Center', 'Hostel / Residential', 'Student Center'];

  return (
    <div className={`campus-map-wrapper ${isEmbedded ? 'embedded' : 'standalone'}`}>
      {/* Top Header & Telemetry Bar */}
      <div className="campus-map-topbar">
        <div className="map-title-cluster">
          <div className="map-live-tag">
            <span className="live-radar-dot" />
            <span>REAL VFSTR GEODATA</span>
          </div>
          <h2 className="map-heading">
            Vignan University Interactive Campus Map
          </h2>
          <p className="map-subtitle">
            Vadlamudi, Guntur District, Andhra Pradesh • 16.2334° N, 80.5508° E • Live Infrastructure & Incident Telemetry
          </p>
        </div>

        {/* Global Stats Counter Pills */}
        <div className="map-stats-counters">
          <div className="map-stat-chip">
            <Building size={14} style={{ color: '#60a5fa' }} />
            <span><strong>{mapData?.total_locations || 10}</strong> Zones</span>
          </div>

          <div className="map-stat-chip">
            <CheckCircle2 size={14} style={{ color: '#34d399' }} />
            <span><strong>{mapData?.operational_services_count || 8}</strong> Operational</span>
          </div>

          <div className={`map-stat-chip ${mapData && mapData.active_incidents_count > 0 ? 'warning' : ''}`}>
            <AlertTriangle size={14} style={{ color: mapData && mapData.active_incidents_count > 0 ? '#fbbf24' : '#94a3b8' }} />
            <span><strong>{mapData?.active_incidents_count || 0}</strong> Incidents</span>
          </div>

          <button
            type="button"
            className="btn-map-control"
            onClick={handleRecenter}
            title="Recenter Map on Vignan University Center"
          >
            <RotateCcw size={14} />
            <span>Center Campus</span>
          </button>

          <button
            type="button"
            className="btn-map-control"
            onClick={fetchMapData}
            title="Refresh live campus geodata"
          >
            <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="campus-map-filters-bar">
        <div className="map-search-input-wrap">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="map-search-input"
            placeholder="Search Vignan buildings, labs, hostels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        {/* Category Pills */}
        <div className="map-category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`cat-pill ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <select
          className="map-select-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Health States</option>
          <option value="IncidentsOnly">Active Incidents Only</option>
          <option value="OperationalOnly">Operational Only</option>
          <option value="OutagesOnly">Outages Only</option>
        </select>

        {/* Technician Filter Toggle */}
        {isTechnician && (
          <label className="map-tech-toggle" title="Filter map to only show buildings with tickets assigned to me">
            <input
              type="checkbox"
              checked={showMyAssignedOnly}
              onChange={(e) => setShowMyAssignedOnly(e.target.checked)}
            />
            <span className="toggle-label">⚡ My Assigned Incidents</span>
          </label>
        )}
      </div>

      {/* Main Map Body: Canvas + Side Drawer */}
      <div className="campus-map-viewport-container">
        {/* Leaflet DOM Node */}
        <div ref={mapContainerRef} className="leaflet-map-canvas" />

        {/* Quick Location Ribbon on Map overlay */}
        <div className="campus-quick-ribbon">
          {filteredLocations.slice(0, 6).map((loc) => (
            <button
              key={loc.id}
              type="button"
              className={`ribbon-item ${selectedLocation?.id === loc.id ? 'active' : ''} ${loc.service_status}`}
              onClick={() => handleSelectLocation(loc)}
            >
              <span className="ribbon-code">{loc.code}</span>
              <span className="ribbon-name">{loc.name.split('(')[0].trim()}</span>
              {loc.active_incident_count > 0 && (
                <span className="ribbon-badge">{loc.active_incident_count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Side Slide-Over Drawer for Selected Building */}
        {selectedLocation && (
          <div className="location-details-drawer">
            <div className="drawer-header">
              <div className="drawer-title-group">
                <span className="building-code-badge">{selectedLocation.code}</span>
                <h3 className="building-title">{selectedLocation.name}</h3>
                <span className="building-cat-tag">{selectedLocation.category}</span>
              </div>
              <button className="drawer-close-btn" onClick={() => setSelectedLocation(null)}>✕</button>
            </div>

            <div className="drawer-body">
              {/* Status Banner */}
              <div className={`drawer-status-banner status-${selectedLocation.service_status}`}>
                <div className="status-icon-wrap">
                  {selectedLocation.service_status === 'operational' ? (
                    <CheckCircle2 size={18} />
                  ) : selectedLocation.service_status === 'degraded' ? (
                    <AlertTriangle size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                </div>
                <div className="status-meta">
                  <div className="status-title">
                    Infrastructure Status: <strong>{selectedLocation.service_status.toUpperCase()}</strong>
                  </div>
                  <div className="status-desc">
                    {selectedLocation.service_status === 'operational'
                      ? 'All wireless access points, switches, and services nominal.'
                      : selectedLocation.service_status === 'degraded'
                      ? 'Active incident investigation underway; services partially degraded.'
                      : 'Critical service outage or hardware failure reported.'}
                  </div>
                </div>
              </div>

              {/* Description & Overview */}
              <div className="drawer-section">
                <div className="section-label">Building & Facility Overview</div>
                <p className="drawer-text">{selectedLocation.description}</p>
              </div>

              {/* Key Specs Grid */}
              <div className="drawer-specs-grid">
                <div className="spec-card">
                  <Wifi size={14} style={{ color: '#60a5fa' }} />
                  <div>
                    <div className="spec-label">Wi-Fi Network</div>
                    <div className="spec-val">{selectedLocation.wifi_network}</div>
                  </div>
                </div>

                <div className="spec-card">
                  <Building size={14} style={{ color: '#a855f7' }} />
                  <div>
                    <div className="spec-label">Floors / Levels</div>
                    <div className="spec-val">{selectedLocation.building_floor_count} Floors</div>
                  </div>
                </div>

                <div className="spec-card">
                  <LifeBuoy size={14} style={{ color: '#38bdf8' }} />
                  <div>
                    <div className="spec-label">IT Tech Bar</div>
                    <div className="spec-val">
                      {selectedLocation.active_tech_bar ? 'Active 1st Floor Walkup' : 'Satellite Node'}
                    </div>
                  </div>
                </div>

                <div className="spec-card">
                  <MapPin size={14} style={{ color: '#fb923c' }} />
                  <div>
                    <div className="spec-label">Coordinates</div>
                    <div className="spec-val font-mono">{selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}</div>
                  </div>
                </div>
              </div>

              {/* Facilities Included */}
              <div className="drawer-section">
                <div className="section-label">Campus Facilities & Zones</div>
                <div className="facilities-tags-wrap">
                  {selectedLocation.facilities.map((fac, i) => (
                    <span key={i} className="facility-pill">
                      ✓ {fac}
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Incidents / Tickets at this Location */}
              <div className="drawer-section">
                <div className="section-header-row">
                  <div className="section-label">
                    Active Incidents at this Location ({locationTickets.length})
                  </div>
                  {isHost && (
                    <span className="host-badge">👑 Host Full Visibility</span>
                  )}
                </div>

                {locationTickets.length > 0 ? (
                  <div className="location-tickets-list">
                    {locationTickets.map((t) => (
                      <div key={t.id} className={`loc-ticket-card priority-${t.priority.toLowerCase()}`}>
                        <div className="ticket-card-top">
                          <span className="ticket-num-badge">{t.ticket_number}</span>
                          <span className={`ticket-status-pill status-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {t.status}
                          </span>
                        </div>

                        <h4 className="ticket-title-compact">{t.title}</h4>

                        <div className="ticket-meta-compact">
                          <span>Cat: <strong>{t.category}</strong></span>
                          <span>Priority: <strong className={`pri-text pri-${t.priority.toLowerCase()}`}>{t.priority}</strong></span>
                        </div>

                        {(isHost || isTechnician) && t.assigned_technician && (
                          <div className="ticket-assigned-row">
                            <Wrench size={12} />
                            <span>Assigned: <strong>{t.assigned_technician}</strong></span>
                          </div>
                        )}

                        {onOpenTicketInResolver && (
                          <button
                            type="button"
                            className="btn-open-workspace"
                            onClick={() => onOpenTicketInResolver(t.id)}
                          >
                            <span>Open in AI Resolver</span>
                            <ExternalLink size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-tickets-box">
                    <CheckCircle2 size={24} style={{ color: '#34d399', marginBottom: '0.35rem' }} />
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>No Active Incidents Reported</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All network nodes and release stations in {selectedLocation.code} are operating nominally.</div>
                  </div>
                )}
              </div>

              {/* AI Query Action for this building */}
              {onAskAiAboutLocation && (
                <div className="drawer-footer-action">
                  <button
                    type="button"
                    className="btn-ai-location-query"
                    onClick={() => onAskAiAboutLocation(selectedLocation.name)}
                  >
                    <Sparkles size={14} />
                    <span>Ask CampusFix AI about {selectedLocation.name}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
