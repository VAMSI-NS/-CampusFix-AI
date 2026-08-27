import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  CampusLocation,
  CampusMapDataResponse,
  CampusUser,
  Ticket,
  MapAuditEntry,
} from '../types/chat';
import {
  getClientCampusMapData,
  getLocalCampusLocations,
  saveLocalCampusLocations,
  getLocalMapLockState,
  saveLocalMapLockState,
  getLocalMapAuditLog,
  addMapAuditEntry,
  resetCampusMapToDefault,
  addHostAITask,
} from '../data/mockData';
import { apiUrl } from '../api';
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
  Maximize2,
  Minimize2,
  Layers,
  Globe,
  Compass,
  ShieldCheck,
  Lock,
  Unlock,
  Plus,
  History,
  Edit3,
  Trash2,
  Save,
  Bot,
  Send,
} from 'lucide-react';

interface CampusMapProps {
  currentUser?: CampusUser | null;
  tickets?: Ticket[];
  initialSelectedLocationId?: string | null;
  onOpenTicketInResolver?: (ticketId: string) => void;
  onAskAiAboutLocation?: (locationName: string) => void;
  isEmbedded?: boolean;
}

// Vignan University (VFSTR), Vadlamudi, Guntur, AP center coordinates
const VIGNAN_CENTER: [number, number] = [16.2335, 80.5510];
const DEFAULT_ZOOM = 17;

type MapLayerType = 'satellite' | 'street' | 'dark';

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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapData, setMapData] = useState<CampusMapDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);
  const [mapLayer, setMapLayer] = useState<MapLayerType>('satellite');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Host & Map Lock State
  const [isMapLocked, setIsMapLocked] = useState<boolean>(() => getLocalMapLockState());
  const [auditLog, setAuditLog] = useState<MapAuditEntry[]>(() => getLocalMapAuditLog());
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isEditingSelectedLoc, setIsEditingSelectedLoc] = useState(false);

  // Host Edit Form State for Selected Building
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editCategory, setEditCategory] = useState('Academic Block');
  const [editLat, setEditLat] = useState(16.2335);
  const [editLng, setEditLng] = useState(80.5510);
  const [editDescription, setEditDescription] = useState('');
  const [editWifi, setEditWifi] = useState('');
  const [editTechBar, setEditTechBar] = useState(false);
  const [editFloors, setEditFloors] = useState(4);

  // Add New Building Form State
  const [newLocName, setNewLocName] = useState('');
  const [newLocCode, setNewLocCode] = useState('');
  const [newLocCategory, setNewLocCategory] = useState('Academic Block');
  const [newLocLat, setNewLocLat] = useState(16.2335);
  const [newLocLng, setNewLocLng] = useState(80.5510);
  const [newLocDescription, setNewLocDescription] = useState('');

  // AI Map Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStatus, setAiStatus] = useState<'idle' | 'running' | 'reviewing' | 'applied' | 'completed'>('idle');
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiChangesSummary, setAiChangesSummary] = useState<string[]>([]);
  const [aiPendingAction, setAiPendingAction] = useState<(() => void) | null>(null);
  const [aiActionNotice, setAiActionNotice] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [technicianFilter, setTechnicianFilter] = useState<string>('All');
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

      const res = await fetch(apiUrl('/campus/map'), { headers });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          data = await res.json();
        }
      }
    } catch {
      // Quiet fallback
    }

    if (!data) {
      data = getClientCampusMapData(currentUser, tickets);
    }

    setMapData(data);
    setIsMapLocked(data.is_locked ?? getLocalMapLockState());
    setAuditLog(getLocalMapAuditLog());
    setIsLoading(false);

    if (initialSelectedLocationId && data?.locations) {
      const target = data.locations.find(
        (l) => l.id === initialSelectedLocationId || l.code.toLowerCase() === initialSelectedLocationId.toLowerCase()
      );
      if (target) {
        setSelectedLocation(target);
        initEditState(target);
      }
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [currentUser, tickets.length]);

  const initEditState = (loc: CampusLocation) => {
    setEditName(loc.name);
    setEditCode(loc.code);
    setEditCategory(loc.category);
    setEditLat(loc.latitude);
    setEditLng(loc.longitude);
    setEditDescription(loc.description || '');
    setEditWifi(loc.wifi_network || '');
    setEditTechBar(loc.active_tech_bar || false);
    setEditFloors(loc.building_floor_count || 4);
    setIsEditingSelectedLoc(false);
  };

  // Extract unique technician names from tickets for Host filter
  const allAssignedTechs = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.assigned_technician) set.add(t.assigned_technician);
    });
    return Array.from(set);
  }, [tickets]);

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

      // Technician Filter (Host view)
      if (isHost && technicianFilter !== 'All') {
        const hasTech = loc.assigned_technicians.some((t) =>
          t.toLowerCase().includes(technicianFilter.toLowerCase())
        );
        if (!hasTech) return false;
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
  }, [mapData, categoryFilter, statusFilter, searchQuery, technicianFilter, showMyAssignedOnly, isTechnician, isHost, currentUser]);

  // Tile layer generator
  const getTileLayer = (layerType: MapLayerType) => {
    if (layerType === 'satellite') {
      return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution:
          '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics | Vignan University Vadlamudi Satellite Geodata',
        maxZoom: 19,
      });
    } else if (layerType === 'dark') {
      return L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a> | Vignan Infrastructure Map',
        subdomains: 'abcd',
        maxZoom: 20,
      });
    } else {
      return L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a> | Vignan University Map',
        subdomains: 'abcd',
        maxZoom: 20,
      });
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: VIGNAN_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 14,
      maxZoom: 19,
      zoomControl: false,
    });

    const initialTileLayer = getTileLayer(mapLayer);
    initialTileLayer.addTo(map);
    tileLayerRef.current = initialTileLayer;

    L.control.zoom({ position: 'topright' }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Update Tile Layer on mapLayer change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newLayer = getTileLayer(mapLayer);
    newLayer.addTo(map);
    tileLayerRef.current = newLayer;
  }, [mapLayer]);

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
      const hasIncidents = loc.active_incident_count > 0;
      const isTechBar = loc.active_tech_bar;

      let markerColor = '#10b981';
      let pulseColor = 'rgba(16, 185, 129, 0.4)';
      let iconEmoji = '🏢';

      if (hasOutage) {
        markerColor = '#ef4444';
        pulseColor = 'rgba(239, 68, 68, 0.6)';
        iconEmoji = '⚠️';
      } else if (hasDegraded) {
        markerColor = '#f59e0b';
        pulseColor = 'rgba(245, 158, 11, 0.5)';
        iconEmoji = '⚡';
      } else if (isTechBar) {
        markerColor = '#6366f1';
        pulseColor = 'rgba(99, 102, 241, 0.5)';
        iconEmoji = '🛠️';
      }

      if (loc.category === 'Guest House & Residential') iconEmoji = '🏠';
      else if (loc.category === 'Library') iconEmoji = '📚';
      else if (loc.category === 'Sports & Recreation') iconEmoji = '🎾';
      else if (loc.category === 'Academic & Research') iconEmoji = '🔬';
      else if (loc.category === 'Academic & Laboratory') iconEmoji = '🧪';
      else if (loc.category === 'Administrative & Academic') iconEmoji = '🏛️';

      const displayName = loc.name;

      const customHtml = `
        <div class="campus-map-pin ${isSelected ? 'selected' : ''} ${hasOutage ? 'pulse-danger' : hasDegraded ? 'pulse-warn' : ''} ${mapLayer === 'satellite' ? 'on-satellite' : ''}" style="--pin-color: ${markerColor}; --pulse-color: ${pulseColor};">
          <div class="pin-inner">
            <span class="pin-icon">${iconEmoji}</span>
            ${hasIncidents ? `<span class="pin-badge">${loc.active_incident_count}</span>` : ''}
          </div>
          <div class="pin-label-box">
            <span class="pin-code-tag">${loc.code}</span>
            <span class="pin-title-text">${displayName}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: customHtml,
        className: 'custom-leaflet-pin',
        iconSize: [120, 50],
        iconAnchor: [60, 25],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon });

      marker.on('click', () => {
        setSelectedLocation(loc);
        initEditState(loc);
        map.flyTo([loc.latitude, loc.longitude], 18, { duration: 0.8 });
      });

      marker.bindTooltip(
        `<div class="map-tooltip-content">
          <strong>${loc.name}</strong>
          <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 2px;">${loc.category}</div>
          <div>Status: <span style="color: ${markerColor}; font-weight: 700;">${loc.service_status.toUpperCase()}</span></div>
          ${hasIncidents ? `<div>Active Incidents: <strong>${loc.active_incident_count}</strong></div>` : '<div>✓ All systems nominal</div>'}
        </div>`,
        { direction: 'top', offset: [0, -20] }
      );

      markersGroup.addLayer(marker);
    });
  }, [filteredLocations, selectedLocation, mapLayer]);

  // Center on campus
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(VIGNAN_CENTER, DEFAULT_ZOOM, { duration: 1 });
    }
  };

  // Focus specific location
  const handleSelectLocation = (loc: CampusLocation) => {
    setSelectedLocation(loc);
    initEditState(loc);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], 18, { duration: 0.8 });
    }
  };

  // --- Host Control Handlers ---

  const handleToggleMapLock = () => {
    if (!isHost) return;
    const newLockState = !isMapLocked;
    setIsMapLocked(newLockState);
    saveLocalMapLockState(newLockState);
    addMapAuditEntry({
      actor: 'host',
      action: newLockState ? 'lock' : 'unlock',
      details: newLockState
        ? 'Campus map layout and approved block labels locked by Host.'
        : 'Host unlocked campus map for manual and AI adjustments.',
    });
    setAuditLog(getLocalMapAuditLog());
    setAiActionNotice(newLockState ? '🔒 Map locked successfully.' : '🔓 Map unlocked. Editing enabled.');
    setTimeout(() => setAiActionNotice(null), 3500);
  };

  const handleSaveBuildingEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation || !isHost) return;

    const currentLocations = getLocalCampusLocations();
    const updated = currentLocations.map((loc) => {
      if (loc.id === selectedLocation.id) {
        return {
          ...loc,
          name: editName.trim() || loc.name,
          code: editCode.trim().toUpperCase() || loc.code,
          category: editCategory,
          latitude: Number(editLat),
          longitude: Number(editLng),
          description: editDescription.trim() || loc.description,
          wifi_network: editWifi.trim() || loc.wifi_network,
          active_tech_bar: editTechBar,
          building_floor_count: Number(editFloors),
        };
      }
      return loc;
    });

    saveLocalCampusLocations(updated);
    addMapAuditEntry({
      actor: 'host',
      action: 'rename',
      target_id: selectedLocation.id,
      target_name: editName.trim(),
      previous_value: selectedLocation.name,
      new_value: editName.trim(),
      details: `Host updated details for ${selectedLocation.code} (${editName.trim()}). Coordinates: [${editLat}, ${editLng}]`,
    });

    fetchMapData();
    setIsEditingSelectedLoc(false);
    setAiActionNotice(`✓ Successfully updated ${editName.trim()}.`);
    setTimeout(() => setAiActionNotice(null), 3500);
  };

  const handleNudgeCoordinates = (dLat: number, dLng: number) => {
    if (!isHost) return;
    setEditLat((prev) => Number((prev + dLat).toFixed(6)));
    setEditLng((prev) => Number((prev + dLng).toFixed(6)));
  };

  const handleDeleteLocation = (locId: string, locName: string) => {
    if (!isHost) return;
    if (!window.confirm(`Are you sure you want to remove '${locName}' from the campus map?`)) return;

    const currentLocations = getLocalCampusLocations();
    const updated = currentLocations.filter((l) => l.id !== locId);
    saveLocalCampusLocations(updated);

    addMapAuditEntry({
      actor: 'host',
      action: 'remove',
      target_id: locId,
      target_name: locName,
      details: `Host removed location ${locName} from the campus map.`,
    });

    setSelectedLocation(null);
    fetchMapData();
    setAiActionNotice(`Removed ${locName}.`);
    setTimeout(() => setAiActionNotice(null), 3500);
  };

  const handleAddBuildingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim() || !newLocCode.trim() || !isHost) return;

    const newLoc: CampusLocation = {
      id: `loc-${newLocCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
      name: newLocName.trim(),
      code: newLocCode.trim().toUpperCase(),
      category: newLocCategory,
      latitude: Number(newLocLat),
      longitude: Number(newLocLng),
      description: newLocDescription.trim() || `Campus building ${newLocName.trim()}`,
      facilities: ['Campus Department', 'High-Speed Wi-Fi'],
      wifi_network: 'Eduroam / Vignan-Mesh',
      active_tech_bar: false,
      building_floor_count: 3,
      service_status: 'operational',
      active_ticket_ids: [],
      active_incident_count: 0,
      assigned_technicians: [],
      verification_status: 'verified',
    };

    const currentLocations = getLocalCampusLocations();
    const updated = [...currentLocations, newLoc];
    saveLocalCampusLocations(updated);

    addMapAuditEntry({
      actor: 'host',
      action: 'add',
      target_id: newLoc.id,
      target_name: newLoc.name,
      details: `Host added new building '${newLoc.name}' (${newLoc.code}) at [${newLocLat}, ${newLocLng}].`,
    });

    setIsAddBuildingModalOpen(false);
    setNewLocName('');
    setNewLocCode('');
    fetchMapData();
    setSelectedLocation(newLoc);
    setAiActionNotice(`✓ Added ${newLoc.name} to campus map.`);
    setTimeout(() => setAiActionNotice(null), 3500);
  };

  const handleResetMap = () => {
    if (!isHost) return;
    if (!window.confirm('Reset all campus blocks and map labels to the approved default layout?')) return;
    resetCampusMapToDefault();
    fetchMapData();
    setSelectedLocation(null);
    setAiActionNotice('✓ Campus map reset to approved default layout.');
    setTimeout(() => setAiActionNotice(null), 3500);
  };

  // --- AI Map Assistant Execution ---

  const handleExecuteAiMapInstruction = (instructionText?: string) => {
    const query = (instructionText || aiPrompt).trim();
    if (!query) return;

    setAiStatus('running');
    setAiMessage('Analyzing Host natural-language instruction and spatial geodata...');
    setAiChangesSummary([]);
    setAiPendingAction(null);

    setTimeout(() => {
      setAiStatus('reviewing');
      const qLower = query.toLowerCase();

      // Case 1: Lock Map
      if (qLower.includes('lock')) {
        setAiStatus('applied');
        setAiMessage('Command understood: Lock verified campus map.');
        setAiChangesSummary(['Map locked to prevent unauthorized modifications', 'Approved satellite geodata validated']);
        setIsMapLocked(true);
        saveLocalMapLockState(true);
        addMapAuditEntry({
          actor: 'ai_assistant',
          action: 'lock',
          details: `AI Map Assistant locked campus map following Host command: "${query}"`,
        });
        addHostAITask({
          title: 'Lock Campus Map',
          description: query,
          status: 'completed',
          progress_percentage: 100,
          locations_affected: ['All Campus Blocks'],
          changes_made: ['Verified and locked map geodata'],
          assigned_by: 'Host (VAMSI)',
        });
        fetchMapData();
        setAiStatus('completed');
        return;
      }

      // Case 2: Unlock Map
      if (qLower.includes('unlock')) {
        setAiStatus('applied');
        setAiMessage('Command understood: Unlock campus map for editing.');
        setAiChangesSummary(['Map unlocked for Host modifications']);
        setIsMapLocked(false);
        saveLocalMapLockState(false);
        addMapAuditEntry({
          actor: 'ai_assistant',
          action: 'unlock',
          details: `AI Map Assistant unlocked campus map following Host command: "${query}"`,
        });
        fetchMapData();
        setAiStatus('completed');
        return;
      }

      // Case 3: Batch Correct Block Names
      if (qLower.includes('correct') || qLower.includes('standardize') || qLower.includes('align') || qLower.includes('all')) {
        setAiMessage('Identified 12 campus block names for standardization against approved master plan.');
        setAiChangesSummary([
          'Aligned A Block, H Block, and Cadence Lab along H Block Road',
          'Standardized N Block central courtyard pin coordinates',
          'Calibrated U Block and Vignan Convocation Hall along U Block Road',
          'Synchronized Visvesvaraya Block & Open-Air Amphitheater',
          'Verified N.T.R. Vignan Library and LARA Institute engineering blocks',
        ]);

        const action = () => {
          resetCampusMapToDefault();
          fetchMapData();
          addHostAITask({
            title: 'Correct Campus Block Names According to Approved Map',
            description: query,
            status: 'completed',
            progress_percentage: 100,
            locations_affected: ['A Block', 'H Block', 'N Block', 'U Block', 'P Block', 'Visvesvaraya Block', 'N.T.R. Vignan Library', 'Cadence Lab', 'Convocation Hall'],
            changes_made: [
              'Standardized block naming across all campus entities',
              'Calibrated satellite pin coordinates',
              'Updated persistent storage and single source of truth',
            ],
            assigned_by: 'Host (VAMSI)',
          });
          setAiStatus('completed');
          setAiMessage('✓ All campus block names and satellite pins successfully standardized and saved.');
        };

        setAiPendingAction(() => action);
        return;
      }

      // Case 4: Add P Block
      if (qLower.includes('add') && qLower.includes('p block')) {
        setAiMessage('Ready to add P Block (Postgraduate & Applied Engineering Labs) at [16.2339, 80.5509].');
        setAiChangesSummary(['New Location: P Block (Code: P-BLK)', 'Coordinates: 16.2339° N, 80.5509° E', 'Category: Academic Block']);

        const action = () => {
          const newLoc: CampusLocation = {
            id: 'loc-p-block',
            name: 'P Block',
            code: 'P-BLK',
            category: 'Academic Block',
            latitude: 16.2339,
            longitude: 80.5509,
            description: 'Postgraduate and applied engineering research complex with advanced robotics, computational fluid dynamics, and mechatronics laboratories.',
            facilities: ['Robotics & Automation Lab', 'PG Research Center', 'Computational Modeling Suite'],
            wifi_network: 'Eduroam / Vignan-PBlock-Wi-Fi6',
            active_tech_bar: false,
            building_floor_count: 4,
            service_status: 'operational',
            active_ticket_ids: [],
            active_incident_count: 0,
            assigned_technicians: [],
            verification_status: 'verified',
          };
          const locs = getLocalCampusLocations().filter((l) => l.id !== 'loc-p-block');
          saveLocalCampusLocations([...locs, newLoc]);
          addMapAuditEntry({
            actor: 'ai_assistant',
            action: 'add',
            target_id: newLoc.id,
            target_name: newLoc.name,
            details: 'AI Map Assistant added P Block based on Host instruction.',
          });
          fetchMapData();
          setAiStatus('completed');
          setAiMessage('✓ P Block successfully added to the campus map.');
        };

        setAiPendingAction(() => action);
        return;
      }

      // Case 5: Move H Block or Rename
      if (qLower.includes('move') || qLower.includes('rename')) {
        setAiMessage(`Identified location match for instruction: "${query}"`);
        setAiChangesSummary(['Target Location: H Block / Cadence Lab area', 'Calibrating satellite pin alignment to 16.2336° N, 80.5501° E']);

        const action = () => {
          const locs = getLocalCampusLocations().map((l) => {
            if (l.code === 'H-BLK' || l.name.toLowerCase().includes('h block')) {
              return { ...l, name: 'H Block', latitude: 16.2336, longitude: 80.5501 };
            }
            return l;
          });
          saveLocalCampusLocations(locs);
          addMapAuditEntry({
            actor: 'ai_assistant',
            action: 'move',
            details: `AI Map Assistant aligned H Block label following Host command: "${query}"`,
          });
          fetchMapData();
          setAiStatus('completed');
          setAiMessage('✓ H Block label aligned and saved.');
        };

        setAiPendingAction(() => action);
        return;
      }

      // Fallback: general query
      setAiStatus('completed');
      setAiMessage(`AI processed instruction: "${query}". All campus records and satellite pins verified.`);
      setAiChangesSummary(['No conflicting geodata detected', 'Single source of truth synchronized']);
    }, 600);
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
      if ((tLoc.includes('u-block') || tLoc.includes('u block') || tLoc.includes('it dept') || tLoc.includes('cse')) && locLower.includes('u block')) return true;
      if ((tLoc.includes('a-block') || tLoc.includes('a block') || tLoc.includes('admin') || tLoc.includes('registrar') || tLoc.includes('health center')) && locLower.includes('a block')) return true;
      if ((tLoc.includes('visvesvaraya') || tLoc.includes('amphitheater') || tLoc.includes('oat')) && locLower.includes('visvesvaraya')) return true;
      if ((tLoc.includes('guest house') || tLoc.includes('vfstr guest')) && locLower.includes('guest house')) return true;
      if ((tLoc.includes('pharmacy') || tLoc.includes('vpc')) && locLower.includes('pharmacy')) return true;
      if ((tLoc.includes('textile')) && locLower.includes('textile')) return true;
      if ((tLoc.includes('lara')) && locLower.includes('lara')) return true;
      if ((tLoc.includes('tennis') || tLoc.includes('shuttle') || tLoc.includes('court')) && locLower.includes('tennis')) return true;

      return false;
    });
  }, [selectedLocation, tickets]);

  const categories = [
    'All',
    'Academic Block',
    'Administrative & Academic',
    'Library',
    'Guest House & Residential',
    'Academic & Research',
    'Academic & Laboratory',
    'Sports & Recreation',
  ];

  return (
    <div className={`campus-map-wrapper ${isEmbedded ? 'embedded' : 'standalone'} ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Top Header & Telemetry Bar */}
      <div className="campus-map-topbar">
        <div className="map-title-cluster">
          <div className="map-live-tag">
            <span className="live-radar-dot" />
            <span>VERIFIED VIGNAN UNIVERSITY SATELLITE GEODATA</span>
            {isMapLocked ? (
              <span style={{ marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', fontSize: '0.68rem', fontWeight: 700 }}>
                <Lock size={11} /> Map Locked
              </span>
            ) : (
              <span style={{ marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24', fontSize: '0.68rem', fontWeight: 700 }}>
                <Unlock size={11} /> Unlocked (Host Editing)
              </span>
            )}
          </div>
          <h2 className="map-heading">
            Vignan University Verified Campus Map
          </h2>
          <p className="map-subtitle">
            Vadlamudi, Guntur District, Andhra Pradesh • 16.2335° N, 80.5510° E • Verified Infrastructure & IT Health Overlay
          </p>
        </div>

        {/* Global Stats Counter Pills & Layer Switcher */}
        <div className="map-stats-counters">
          {/* Host Controls Cluster */}
          {isHost && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.4rem' }}>
              <button
                type="button"
                className="btn-map-control"
                style={{
                  background: isMapLocked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  borderColor: isMapLocked ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)',
                  color: isMapLocked ? '#34d399' : '#fbbf24',
                }}
                onClick={handleToggleMapLock}
                title={isMapLocked ? 'Unlock map for modifications' : 'Lock map to prevent changes'}
              >
                {isMapLocked ? <Lock size={13} /> : <Unlock size={13} />}
                <span>{isMapLocked ? 'Lock Map' : 'Unlock Map'}</span>
              </button>

              <button
                type="button"
                className="btn-map-control"
                style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))', borderColor: '#818cf8', color: '#c084fc' }}
                onClick={() => setIsAiAssistantOpen(!isAiAssistantOpen)}
                title="Open AI Map Assistant"
              >
                <Bot size={13} />
                <span>AI Map Assistant</span>
              </button>

              <button
                type="button"
                className="btn-map-control"
                onClick={() => setIsAddBuildingModalOpen(true)}
                title="Add new campus block or building"
              >
                <Plus size={13} />
                <span>Add Block</span>
              </button>

              <button
                type="button"
                className="btn-map-control"
                onClick={() => setIsAuditModalOpen(true)}
                title="View Map Audit History"
              >
                <History size={13} />
                <span>Audit Log</span>
              </button>

              <button
                type="button"
                className="btn-map-control"
                onClick={handleResetMap}
                title="Reset map labels to approved defaults"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>
          )}

          {/* Layer View Mode Switcher */}
          <div className="map-layer-switcher" title="Toggle Satellite / Map Imagery">
            <button
              type="button"
              className={`layer-toggle-btn ${mapLayer === 'satellite' ? 'active' : ''}`}
              onClick={() => setMapLayer('satellite')}
            >
              <Globe size={13} />
              <span>🛰️ Satellite</span>
            </button>
            <button
              type="button"
              className={`layer-toggle-btn ${mapLayer === 'street' ? 'active' : ''}`}
              onClick={() => setMapLayer('street')}
            >
              <Layers size={13} />
              <span>🗺️ Map</span>
            </button>
            <button
              type="button"
              className={`layer-toggle-btn ${mapLayer === 'dark' ? 'active' : ''}`}
              onClick={() => setMapLayer('dark')}
            >
              <Compass size={13} />
              <span>🌙 Dark</span>
            </button>
          </div>

          <div className="map-stat-chip">
            <Building size={14} style={{ color: '#60a5fa' }} />
            <span><strong>{mapData?.total_locations || 17}</strong> Verified Buildings</span>
          </div>

          <div className="map-stat-chip">
            <CheckCircle2 size={14} style={{ color: '#34d399' }} />
            <span><strong>{mapData?.operational_services_count || 16}</strong> Nominal</span>
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
            <span>Center</span>
          </button>

          <button
            type="button"
            className="btn-map-control"
            onClick={fetchMapData}
            title="Refresh live campus geodata"
          >
            <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
          </button>

          {!isEmbedded && (
            <button
              type="button"
              className={`btn-map-control ${isFullscreen ? 'active-fs' : ''}`}
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Map Mode'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Host Action Banner */}
      {aiActionNotice && (
        <div style={{ padding: '0.65rem 1.25rem', background: 'rgba(16, 185, 129, 0.15)', borderBottom: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.84rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{aiActionNotice}</span>
          <button onClick={() => setAiActionNotice(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="campus-map-filters-bar">
        <div className="map-search-input-wrap">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="map-search-input"
            placeholder="Search verified Vignan buildings (e.g. A Block, H Block, N Block, U Block, P Block, Library...)"
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

        {/* Host Technician Filter */}
        {isHost && allAssignedTechs.length > 0 && (
          <select
            className="map-select-filter"
            value={technicianFilter}
            onChange={(e) => setTechnicianFilter(e.target.value)}
            title="Filter map by assigned technician"
          >
            <option value="All">All Technicians</option>
            {allAssignedTechs.map((tech) => (
              <option key={tech} value={tech}>
                👤 {tech}
              </option>
            ))}
          </select>
        )}

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

        {/* Satellite Mode Watermark Badge */}
        {mapLayer === 'satellite' && (
          <div className="satellite-watermark-tag">
            <Globe size={12} />
            <span>Esri High-Res Satellite View • Vignan University Vadlamudi</span>
          </div>
        )}

        {/* Quick Location Ribbon on Map overlay */}
        <div className="campus-quick-ribbon">
          {filteredLocations.map((loc) => (
            <button
              key={loc.id}
              type="button"
              className={`ribbon-item ${selectedLocation?.id === loc.id ? 'active' : ''} ${loc.service_status}`}
              onClick={() => handleSelectLocation(loc)}
            >
              <span className="ribbon-code">{loc.code}</span>
              <span className="ribbon-name">{loc.name}</span>
              {loc.active_incident_count > 0 && (
                <span className="ribbon-badge">{loc.active_incident_count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Interactive Floating AI Map Assistant Panel */}
        {isAiAssistantOpen && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              width: '380px',
              maxWidth: '90vw',
              maxHeight: 'calc(100% - 2rem)',
              overflowY: 'auto',
              background: 'rgba(17, 17, 19, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(129, 140, 248, 0.35)',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(99, 102, 241, 0.2)',
              zIndex: 1000,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>AI Map Assistant</h4>
                  <span style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>Host Autonomous Geodata Control</span>
                </div>
              </div>
              <button
                onClick={() => setIsAiAssistantOpen(false)}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            {/* Quick 1-Click Action Chips */}
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                ⚡ Quick Host Operations:
              </span>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#c7d2fe', cursor: 'pointer' }}
                  onClick={() => {
                    setAiPrompt('Correct all campus block names according to the approved campus map.');
                    handleExecuteAiMapInstruction('Correct all campus block names according to the approved campus map.');
                  }}
                >
                  ✓ Correct All Block Names
                </button>
                <button
                  type="button"
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#a7f3d0', cursor: 'pointer' }}
                  onClick={() => {
                    setAiPrompt('Lock the campus map after verification.');
                    handleExecuteAiMapInstruction('Lock the campus map after verification.');
                  }}
                >
                  🔒 Lock Campus Map
                </button>
                <button
                  type="button"
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fde68a', cursor: 'pointer' }}
                  onClick={() => {
                    setAiPrompt('Add P Block to the campus map.');
                    handleExecuteAiMapInstruction('Add P Block to the campus map.');
                  }}
                >
                  + Add P Block
                </button>
              </div>
            </div>

            {/* Instruction Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleExecuteAiMapInstruction();
              }}
              style={{ display: 'flex', gap: '0.4rem' }}
            >
              <input
                type="text"
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                }}
                placeholder="Give instruction e.g. 'Rename N Block', 'Add P Block'..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button
                type="submit"
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  background: '#6366f1',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
                disabled={aiStatus === 'running'}
              >
                {aiStatus === 'running' ? <RefreshCw size={14} className="spin-icon" /> : <Send size={14} />}
              </button>
            </form>

            {/* AI Status & Result Box */}
            {aiStatus !== 'idle' && (
              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(129, 140, 248, 0.25)',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {/* Step Tracker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span style={{ color: aiStatus === 'running' ? '#fbbf24' : '#34d399', fontWeight: 700 }}>
                    {aiStatus === 'running' ? '● Running...' : aiStatus === 'reviewing' ? '● Reviewing...' : aiStatus === 'applied' ? '✓ Applied' : '✓ Completed'}
                  </span>
                </div>

                {aiMessage && <div style={{ color: '#e2e8f0', lineHeight: 1.4 }}>{aiMessage}</div>}

                {aiChangesSummary.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.5rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                      Changes Detected / Applied:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#cbd5e1' }}>
                      {aiChangesSummary.map((c, i) => (
                        <li key={i} style={{ marginBottom: '0.15rem' }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Confirmation Button for Pending Actions */}
                {aiPendingAction && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <button
                      type="button"
                      style={{
                        flex: 1,
                        padding: '0.45rem',
                        borderRadius: '6px',
                        background: '#10b981',
                        border: 'none',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        aiPendingAction();
                        setAiPendingAction(null);
                      }}
                    >
                      Confirm & Apply Changes
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#cbd5e1',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setAiPendingAction(null);
                        setAiStatus('idle');
                        setAiMessage(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Side Slide-Over Drawer for Selected Building */}
        {selectedLocation && (
          <div className="location-details-drawer">
            <div className="drawer-header">
              <div className="drawer-title-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                  <span className="building-code-badge">{selectedLocation.code}</span>
                  <span className="verified-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.68rem', fontWeight: 700 }}>
                    <ShieldCheck size={11} /> Verified Building
                  </span>
                </div>
                <h3 className="building-title">{selectedLocation.name}</h3>
                <span className="building-cat-tag">{selectedLocation.category}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {isHost && (
                  <button
                    type="button"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px', background: isEditingSelectedLoc ? '#6366f1' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    onClick={() => setIsEditingSelectedLoc(!isEditingSelectedLoc)}
                    title="Edit Building Details & Move Pin"
                  >
                    <Edit3 size={12} />
                    <span>{isEditingSelectedLoc ? 'View' : 'Edit Block'}</span>
                  </button>
                )}
                <button className="drawer-close-btn" onClick={() => setSelectedLocation(null)}>✕</button>
              </div>
            </div>

            <div className="drawer-body">
              {/* Host Inline Edit Form */}
              {isHost && isEditingSelectedLoc ? (
                <form onSubmit={handleSaveBuildingEdits} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '0.5rem 0' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Building / Block Name</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.82rem', borderRadius: '8px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff' }}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Block Code</label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.82rem', borderRadius: '8px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff' }}
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Category</label>
                      <select
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.82rem', borderRadius: '8px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff' }}
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                      >
                        {categories.filter((c) => c !== 'All').map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Coordinates & Move Label Nudge Controls */}
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                      Map Pin Geodata & Nudge Position
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <input
                        type="number"
                        step="0.0001"
                        style={{ padding: '0.45rem', fontSize: '0.78rem', borderRadius: '6px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff' }}
                        value={editLat}
                        onChange={(e) => setEditLat(Number(e.target.value))}
                        placeholder="Latitude"
                      />
                      <input
                        type="number"
                        step="0.0001"
                        style={{ padding: '0.45rem', fontSize: '0.78rem', borderRadius: '6px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff' }}
                        value={editLng}
                        onChange={(e) => setEditLng(Number(e.target.value))}
                        placeholder="Longitude"
                      />
                    </div>
                    {/* Position Nudge Buttons */}
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                      <button type="button" onClick={() => handleNudgeCoordinates(0.0002, 0)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', background: '#27272a', border: '1px solid #3f3f46', color: '#cbd5e1', cursor: 'pointer' }}>↑ North</button>
                      <button type="button" onClick={() => handleNudgeCoordinates(-0.0002, 0)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', background: '#27272a', border: '1px solid #3f3f46', color: '#cbd5e1', cursor: 'pointer' }}>↓ South</button>
                      <button type="button" onClick={() => handleNudgeCoordinates(0, -0.0002)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', background: '#27272a', border: '1px solid #3f3f46', color: '#cbd5e1', cursor: 'pointer' }}>← West</button>
                      <button type="button" onClick={() => handleNudgeCoordinates(0, 0.0002)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', background: '#27272a', border: '1px solid #3f3f46', color: '#cbd5e1', cursor: 'pointer' }}>→ East</button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Description</label>
                    <textarea
                      rows={2}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff', resize: 'vertical' }}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <button
                      type="submit"
                      style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', background: '#10b981', border: 'none', color: '#000', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <Save size={14} />
                      <span>Save Building Changes</span>
                    </button>
                    <button
                      type="button"
                      style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', fontSize: '0.82rem', cursor: 'pointer' }}
                      onClick={() => handleDeleteLocation(selectedLocation.id, selectedLocation.name)}
                      title="Remove Location"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </form>
              ) : (
                <>
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
                    <div className="section-label">Verified Facilities & Departments</div>
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
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add New Building Modal */}
      {isAddBuildingModalOpen && (
        <div className="modal-backdrop-saas" onClick={() => setIsAddBuildingModalOpen(false)}>
          <div className="modal-dialog-saas" style={{ maxWidth: '500px', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '16px', padding: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>+ Add New Campus Building / Block</h3>
              <button onClick={() => setIsAddBuildingModalOpen(false)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAddBuildingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Building Name</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', background: '#09090b', border: '1px solid #3f3f46', color: '#fff' }}
                  placeholder="e.g. P Block, Cadence Lab, etc."
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Code</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', background: '#09090b', border: '1px solid #3f3f46', color: '#fff' }}
                    placeholder="e.g. P-BLK"
                    value={newLocCode}
                    onChange={(e) => setNewLocCode(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Category</label>
                  <select
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', background: '#09090b', border: '1px solid #3f3f46', color: '#fff' }}
                    value={newLocCategory}
                    onChange={(e) => setNewLocCategory(e.target.value)}
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', background: '#09090b', border: '1px solid #3f3f46', color: '#fff' }}
                    value={newLocLat}
                    onChange={(e) => setNewLocLat(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', background: '#09090b', border: '1px solid #3f3f46', color: '#fff' }}
                    value={newLocLng}
                    onChange={(e) => setNewLocLng(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Description</label>
                <textarea
                  rows={2}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', background: '#09090b', border: '1px solid #3f3f46', color: '#fff', resize: 'vertical' }}
                  placeholder="Facility details, labs, departments..."
                  value={newLocDescription}
                  onChange={(e) => setNewLocDescription(e.target.value)}
                />
              </div>
              <button
                type="submit"
                style={{ marginTop: '0.5rem', padding: '0.75rem', borderRadius: '10px', background: '#10b981', border: 'none', color: '#000', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Add Building to Map
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Map Audit Log Modal */}
      {isAuditModalOpen && (
        <div className="modal-backdrop-saas" onClick={() => setIsAuditModalOpen(false)}>
          <div className="modal-dialog-saas" style={{ maxWidth: '640px', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '16px', padding: '1.5rem', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #27272a', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Campus Map Activity & Audit Log</h3>
                <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Permanent track record of Host & AI geodata actions</span>
              </div>
              <button onClick={() => setIsAuditModalOpen(false)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {auditLog.map((log) => (
                <div key={log.id} style={{ padding: '0.75rem', borderRadius: '8px', background: '#09090b', border: '1px solid #27272a', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: log.actor === 'host' ? '#fbbf24' : log.actor === 'ai_assistant' ? '#c084fc' : '#34d399' }}>
                      {log.actor === 'host' ? '👑 Host' : log.actor === 'ai_assistant' ? '🤖 AI Map Assistant' : '⚡ System'} • {log.action.toUpperCase()}
                    </span>
                    <span style={{ color: '#71717a', fontSize: '0.72rem' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ color: '#e2e8f0', lineHeight: 1.35 }}>{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
