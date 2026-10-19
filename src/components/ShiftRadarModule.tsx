import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  AlertTriangle,
  Users,
  Plus,
  X,
  Check,
  Navigation,
  ZoomIn,
  ZoomOut,
  Compass,
  Route,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import {
  ExternalNavMapAssistAction,
  MapRadiusOptionKm,
  PortugalRegionName,
  RoadHazardType,
  TacticalMapCell,
} from '../types/models';
import { useEstafetas } from '../context/EstafetasContext';

// ============================================================================
// EXPORTED SUB-PANELS FOR "AJUSTES" (MOVED OUT OF THE PURE MAPA PAGE)
// 1. MapRadiusSettingsSection (Raio do Mapa km & Região)
// 2. RoadHazardsSettingsSection (Perigos na Via)
// 3. ZoneAgreementsSettingsSection (Acordos de Zona — Renamed from "Pactos")
// ============================================================================

export const MapRadiusSettingsSection: React.FC = () => {
  const {
    mapRadiusKm,
    setMapRadiusKm,
    selectedRegionName,
    setSelectedRegionName,
    regionalExplorerList,
  } = useEstafetas();

  const radiusOptions: MapRadiusOptionKm[] = [5, 15, 25, 30, 50];

  return (
    <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-zinc-100">
            Raio do Mapa (km) &amp; Região Operacional
          </h3>
          <p className="text-[11px] text-zinc-400">
            Predefinição padrão bloqueada em Amarante (Raio de 25 km)
          </p>
        </div>
        <span className="rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-xs font-mono font-bold text-emerald-500">
          {mapRadiusKm} km
        </span>
      </div>

      <div>
        <label className="text-[11px] text-zinc-400 block mb-1">
          Região Ativa no Mapa
        </label>
        <select
          aria-label="Selecionar Região"
          value={selectedRegionName}
          onChange={(e) =>
            setSelectedRegionName(e.target.value as PortugalRegionName)
          }
          className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-100"
        >
          {regionalExplorerList.map((r) => (
            <option key={r.regionName} value={r.regionName}>
              {r.regionName} ({r.avgEurPerKm.toFixed(2)} €/km)
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="text-[11px] text-zinc-400 block mb-1.5">
          Selecionar Raio de Alcance (km)
        </span>
        <div className="grid grid-cols-5 gap-1.5">
          {radiusOptions.map((km) => {
            const active = mapRadiusKm === km;
            return (
              <button
                key={km}
                type="button"
                onClick={() => setMapRadiusKm(km)}
                className={`rounded-xl py-2 text-xs font-semibold transition cursor-pointer ${
                  active
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-100'
                }`}
              >
                {km} km
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const RoadHazardsSettingsSection: React.FC = () => {
  const {
    roadHazards,
    addRoadHazardPin,
    confirmRoadHazardPin,
    resolveRoadHazardPin,
    selectedRegionName,
    awardBuddyRewardTask,
  } = useEstafetas();

  const [streetInput, setStreetInput] = useState<string>('');

  const quickHazards: { label: string; type: RoadHazardType }[] = [
    { label: 'Buraco', type: 'Buraco Perigoso na Pista' },
    { label: 'Acidente', type: 'Acidente na Via' },
    { label: 'Obras', type: 'Obras na Via / Desvio' },
    { label: 'Óleo', type: 'Piso Escorregadio / Óleo' },
  ];

  const handleQuickHazardReport = (hazardType: RoadHazardType) => {
    addRoadHazardPin(
      hazardType,
      streetInput.trim() || `${selectedRegionName} (Ponto GPS)`,
      selectedRegionName
    );
    awardBuddyRewardTask('ALERTAR_ANOMALIA_MAPA_15');
    setStreetInput('');
  };

  const activeUnresolvedHazards = roadHazards.filter((h) => !h.resolved);

  return (
    <div className="space-y-3">
      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-zinc-300" />
            <span>Reportar Perigo na Via em 1 Toque (Amarante 25 km)</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-500 font-semibold">
            +15 Coins
          </span>
        </div>

        <input
          type="text"
          value={streetInput}
          onChange={(e) => setStreetInput(e.target.value)}
          placeholder="Rua ou referência em Amarante (ex: N15 / Ponte São Gonçalo)..."
          className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
        />

        <div className="grid grid-cols-4 gap-1.5">
          {quickHazards.map((h) => (
            <button
              key={h.label}
              type="button"
              onClick={() => handleQuickHazardReport(h.type)}
              className="rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 py-2 px-1.5 text-xs font-semibold cursor-pointer transition text-center"
            >
              {h.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-2.5">
        <span className="text-xs font-semibold text-zinc-100 block">
          Alertas Ativos na Via ({activeUnresolvedHazards.length})
        </span>

        <div className="space-y-2">
          {activeUnresolvedHazards.length === 0 ? (
            <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3.5 text-center space-y-1">
              <span className="text-xs font-bold text-zinc-100 block">
                Modo Produção Real Ativo • 0 alertas na via reportados
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Os alertas de demonstração foram ocultados. Toque num dos botões acima para reportar um perigo real em Amarante.
              </span>
            </div>
          ) : (
            activeUnresolvedHazards.map((pin) => (
              <div
                key={pin.id}
                className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-zinc-100 block truncate">
                    {pin.hazardType}
                  </span>
                  <span className="text-[11px] text-zinc-400 block truncate">
                    <MapPin className="inline h-3 w-3 mr-0.5 text-zinc-500" />
                    {pin.streetLocation} ({pin.confirmations} conf.)
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => confirmRoadHazardPin(pin.id)}
                    className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 text-[10px] font-medium cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveRoadHazardPin(pin.id)}
                    className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-2.5 py-1 text-[10px] cursor-pointer"
                  >
                    Limpo
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export const ZoneAgreementsSettingsSection: React.FC = () => {
  const { zonePacts, toggleJoinZonePact, createZonePact, selectedRegionName } =
    useEstafetas();

  const [isAgreementModalOpen, setIsAgreementModalOpen] =
    useState<boolean>(false);
  const [newAgreementTitle, setNewAgreementTitle] = useState<string>('');
  const [newAgreementZone, setNewAgreementZone] = useState<string>(
    'Amarante — Centro / São Gonçalo'
  );
  const [newAgreementMinEur, setNewAgreementMinEur] = useState<number>(5.0);
  const [newAgreementMinPerKm, setNewAgreementMinPerKm] = useState<number>(1.2);

  const handleCreateAgreementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgreementTitle.trim()) return;
    createZonePact({
      title: newAgreementTitle.trim(),
      zoneName: newAgreementZone.trim() || selectedRegionName,
      minCollectiveOrderEur: Math.max(3.5, newAgreementMinEur),
      minCollectivePerKmEur: Math.max(0.8, newAgreementMinPerKm),
      durationHoursLabel: 'Das 19:00 às 22:00 (3h)',
    });
    setNewAgreementTitle('');
    setIsAgreementModalOpen(false);
  };

  return (
    <div className="space-y-3">
      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-zinc-300" />
            <span>Acordos Coletivos de Zona</span>
          </span>
          <button
            type="button"
            onClick={() => setIsAgreementModalOpen(true)}
            className="rounded-xl bg-white text-zinc-950 px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Novo Acordo</span>
          </button>
        </div>

        <div className="space-y-2">
          {zonePacts.length === 0 ? (
            <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3.5 text-center space-y-1">
              <span className="text-xs font-bold text-zinc-100 block">
                Modo Produção Real Ativo • 0 acordos de zona registados
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Os acordos fictícios foram ocultados. Clique em &quot;+ Novo Acordo&quot; para publicar um acordo real em Amarante.
              </span>
            </div>
          ) : (
            zonePacts.map((agreement) => (
              <div
                key={agreement.id}
                className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-zinc-100 block truncate">
                      {agreement.title}
                    </span>
                    <span className="text-[11px] text-zinc-400 block">
                      {agreement.zoneName} • {agreement.adheredCouriersCount}{' '}
                      estafetas aderiram
                    </span>
                  </div>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-200 shrink-0">
                    &gt;= {agreement.minCollectiveOrderEur.toFixed(2)} €
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-zinc-400">
                    Mínimo coletivo: {agreement.minCollectivePerKmEur.toFixed(2)}{' '}
                    €/km
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleJoinZonePact(agreement.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                      agreement.joinedByUser
                        ? 'bg-white text-zinc-950'
                        : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                    }`}
                  >
                    {agreement.joinedByUser && <Check className="h-3 w-3" />}
                    <span>
                      {agreement.joinedByUser ? 'Acordo Ativo' : 'Aderir Acordo'}
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {isAgreementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAgreementSubmit}
            className="w-full max-w-[380px] rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h3 className="text-sm font-semibold text-zinc-100">
                Criar Acordo de Zona
              </h3>
              <button
                type="button"
                onClick={() => setIsAgreementModalOpen(false)}
                className="p-1 rounded-lg bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Título do Acordo
                </label>
                <input
                  type="text"
                  required
                  value={newAgreementTitle}
                  onChange={(e) => setNewAgreementTitle(e.target.value)}
                  placeholder="Ex: Acordo Amarante Centro >= 5,00 €"
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Piso Mínimo (€)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={newAgreementMinEur}
                    onChange={(e) =>
                      setNewAgreementMinEur(parseFloat(e.target.value) || 5.0)
                    }
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Mínimo €/km
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={newAgreementMinPerKm}
                    onChange={(e) =>
                      setNewAgreementMinPerKm(parseFloat(e.target.value) || 1.2)
                    }
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Zona
                </label>
                <input
                  type="text"
                  value={newAgreementZone}
                  onChange={(e) => setNewAgreementZone(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl py-2.5 bg-white text-zinc-950 font-semibold text-xs cursor-pointer"
            >
              Publicar e Aderir ao Acordo
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PURE "MAPA" COCKPIT: 80% SCREEN HEIGHT (calc(100dvh - 135px)),
// SMOOTH TOUCH PHYSICS, HYBRID SATELLITE LABELS & ZERO CAMERA SNAPPING
// ============================================================================

export const ShiftRadarModule: React.FC = () => {
  const {
    tacticalCells,
    mapRadiusKm,
    onlineDirectoryCouriers,
    themeMode,
    lastExternalMapAssist,
    triggerExternalMapAssistMacro,
    aiAgentConfig,
    realCompletedDeliveries,
    marketTelemetry,
    realCourierProfile,
    setIsCourierRegistrationModalOpen,
    refreshLiveGpsPosition,
    userOrderAvailabilityStatus,
    toggleUserOrderAvailabilityStatus,
    roadHazards,
    setActiveTab,
    cleanupGhostDuplicatePinsNow,
  } = useEstafetas();

  const [selectedCellId, setSelectedCellId] = useState<string>(
    tacticalCells[0]?.id || 'CELL-AMA-01'
  );
  const [mapLayerMode, setMapLayerMode] = useState<'STREETS' | 'SATELLITE'>(
    'STREETS'
  );
  const [isTelemetrySheetExpanded, setIsTelemetrySheetExpanded] =
    useState<boolean>(false);

  // Touch-scroll guard so vertical scrolling never triggers external Waze/Maps macros
  const touchStartPosRef = useRef<{ x: number; y: number; moved: boolean }>({
    x: 0,
    y: 0,
    moved: false,
  });

  const isDaylight = themeMode === 'DAYLIGHT';
  const isProdRealOnly = Boolean(aiAgentConfig.productionModeRealOnly);

  const selectedCell: TacticalMapCell =
    tacticalCells.find((c) => c.id === selectedCellId) || tacticalCells[0];

  const realTotalNetEur = realCompletedDeliveries.reduce(
    (sum, item) => sum + item.netProfitEur,
    0
  );
  const realTotalDistanceKm = realCompletedDeliveries.reduce(
    (sum, item) => sum + item.realKm,
    0
  );
  const realCalculatedEurPerKmLabel =
    realTotalDistanceKm > 0
      ? `${(realTotalNetEur / realTotalDistanceKm).toFixed(2).replace('.', ',')} €/km`
      : '0,00 €/km';

  const selfNameNorm = (realCourierProfile?.name || '').trim().toLowerCase();
  const otherCouriersOnMap = onlineDirectoryCouriers.filter((c) => {
    if (c.isSelfProfile) return false;
    if (realCourierProfile && c.id === realCourierProfile.id) return false;
    const callLower = (c.callsign || '').trim().toLowerCase();
    // Filter out any legacy "Caio M." or duplicate self pin
    if (callLower === 'caio m.' || callLower === 'caio m') return false;
    if (selfNameNorm && callLower === selfNameNorm) return false;
    if (selfNameNorm.startsWith('caio') && callLower.startsWith('caio')) {
      return false;
    }
    return true;
  });

  const isSelfFree = userOrderAvailabilityStatus === 'DISPONIVEL';
  const selfLat = Number(realCourierProfile?.lat || 41.2704);
  const selfLng = Number(realCourierProfile?.lng || -8.0818);

  // Real Leaflet Map Instance, Persistent Marker Refs & User Pan Guard
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const streetTileLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteHybridGroupRef = useRef<L.LayerGroup | null>(null);
  const staticOverlaysGroupRef = useRef<L.LayerGroup | null>(null);
  const selfMarkerRef = useRef<L.Marker | null>(null);
  const selfMarkerHtmlSigRef = useRef<string>('');
  const peerMarkersMapRef = useRef<
    Map<string, { marker: L.Marker; sig: string }>
  >(new Map());
  const userHasPannedMap = useRef<boolean>(false);

  // Real Amarante Restaurant Hotspots & Zones (Real Lat/Lng in Amarante)
  const amaranteRealHotspots = [
    {
      id: tacticalCells[0]?.id || 'CELL-AMR-CENTRO',
      shortLabel: 'Amarante Centro / São Gonçalo',
      hotspotDetail: 'Continente Modelo • Churrasqueira da Ponte • Centro',
      lat: 41.2692,
      lng: -8.0785,
    },
    {
      id: tacticalCells[1]?.id || 'CELL-AMR-FREIXO',
      shortLabel: 'Freixo de Cima / Baixo (N15)',
      hotspotDetail: 'Amarante Retail • Burger King • Eixo N15 Norte',
      lat: 41.2955,
      lng: -8.0459,
    },
    {
      id: tacticalCells[2]?.id || 'CELL-AMR-VILA-MEA',
      shortLabel: 'Vila Meã (Acesso A4 / N211)',
      hotspotDetail: 'McDonald’s Vila Meã • Intermarché • Nó A4',
      lat: 41.2545,
      lng: -8.1765,
    },
    {
      id: tacticalCells[3]?.id || 'CELL-AMR-LIXA',
      shortLabel: 'Lixa / Felgueiras (N101)',
      hotspotDetail: 'Corredor N101 • Pingo Doce Lixa',
      lat: 41.3235,
      lng: -8.1462,
    },
    {
      id: tacticalCells[4]?.id || 'CELL-AMR-MARCO',
      shortLabel: 'Marco de Canaveses',
      hotspotDetail: 'Centro Comercial • Eixo Sul Tâmega',
      lat: 41.1852,
      lng: -8.1488,
    },
  ];

  // Initialize Real Interactive Leaflet Map on mount with Smooth Mobile Touch Physics
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    const mapOptions: L.MapOptions & { tap?: boolean } = {
      center: [selfLat, selfLng],
      zoom: 14,
      dragging: true,
      tap: false,
      inertia: true,
      inertiaDeceleration: 2200,
      inertiaMaxSpeed: 1800,
      zoomControl: false,
      touchZoom: true,
      bounceAtZoomLimits: false,
      attributionControl: false,
    };

    const map = L.map(mapContainerRef.current, mapOptions);

    // Track user drag/zoom so background GPS or Supabase polls NEVER snap the camera back
    map.on('dragstart', () => {
      userHasPannedMap.current = true;
    });
    map.on('zoomstart', () => {
      userHasPannedMap.current = true;
    });

    const streetLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
      }
    );

    // Hybrid Satellite: Esri World Imagery + Esri World Transportation + Esri World Boundaries and Places
    const satImagery = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
      }
    );
    const satTransportation = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        pane: 'overlayPane',
      }
    );
    const satPlacesLabels = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        pane: 'overlayPane',
      }
    );
    const satelliteHybridGroup = L.layerGroup([
      satImagery,
      satTransportation,
      satPlacesLabels,
    ]);

    streetLayer.addTo(map);
    const staticGroup = L.layerGroup().addTo(map);

    leafletMapRef.current = map;
    streetTileLayerRef.current = streetLayer;
    satelliteHybridGroupRef.current = satelliteHybridGroup;
    staticOverlaysGroupRef.current = staticGroup;

    // Trigger invalidateSize after mount & layout transitions so tiles fill the 80% height with zero gray gaps
    const t1 = window.setTimeout(() => map.invalidateSize(), 100);
    const t2 = window.setTimeout(() => map.invalidateSize(), 350);
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
      peerMarkersMapRef.current.clear();
      selfMarkerRef.current = null;
      map.remove();
      leafletMapRef.current = null;
      streetTileLayerRef.current = null;
      satelliteHybridGroupRef.current = null;
      staticOverlaysGroupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-validate map size when telemetry sheet expands/collapses or layer switches
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [isTelemetrySheetExpanded, mapLayerMode]);

  // Switch between OpenStreetMap Streets and Hybrid Satellite (Imagery + Roads + Place Names)
  useEffect(() => {
    const map = leafletMapRef.current;
    const street = streetTileLayerRef.current;
    const satHybrid = satelliteHybridGroupRef.current;
    if (!map || !street || !satHybrid) return;

    if (mapLayerMode === 'SATELLITE') {
      if (map.hasLayer(street)) map.removeLayer(street);
      if (!map.hasLayer(satHybrid)) satHybrid.addTo(map);
    } else {
      if (map.hasLayer(satHybrid)) map.removeLayer(satHybrid);
      if (!map.hasLayer(street)) street.addTo(map);
    }
  }, [mapLayerMode]);

  // Render static/semi-static overlays (Radius Circle, Hotspots & Road Hazards) ONLY when those change
  useEffect(() => {
    const map = leafletMapRef.current;
    const group = staticOverlaysGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Operational Radius Circle around Amarante Centro (41.2704, -8.0818)
    L.circle([41.2704, -8.0818], {
      radius: mapRadiusKm * 1000,
      color: '#10b981',
      weight: 1.5,
      opacity: 0.45,
      fillColor: '#10b981',
      fillOpacity: 0.02,
      dashArray: '6 6',
      interactive: false,
    }).addTo(group);

    // 2. Real Amarante Restaurant Hotspots & Zones
    amaranteRealHotspots.forEach((spot) => {
      const isSelected = selectedCell?.id === spot.id;
      const hotspotHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">
          <div style="width:${isSelected ? '14px' : '11px'};height:${isSelected ? '14px' : '11px'};border-radius:9999px;background:${isSelected ? '#10b981' : '#0284c7'};border:2px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.45);"></div>
          <span style="margin-top:2px;padding:1px 5px;border-radius:6px;background:rgba(15,23,42,0.88);color:#f8fafc;font-size:9px;font-weight:800;white-space:nowrap;border:1px solid ${isSelected ? '#10b981' : 'rgba(148,163,184,0.35)'};">
            🏪 ${spot.shortLabel.split('/')[0].trim()}
          </span>
        </div>
      `;
      const marker = L.marker([spot.lat, spot.lng], {
        icon: L.divIcon({
          className: 'buddy-leaflet-hotspot-pin',
          html: hotspotHtml,
          iconSize: [0, 0],
        }),
      });
      marker.on('click', () => {
        setSelectedCellId(spot.id);
      });
      marker.bindPopup(
        `<div style="font-family:sans-serif;font-size:12px;color:#0f172a;">
          <strong>${spot.shortLabel}</strong><br/>
          <span style="font-size:11px;color:#334155;">${spot.hotspotDetail}</span>
        </div>`
      );
      marker.addTo(group);
    });

    // 3. Active Community Road Hazards on Real Streets
    roadHazards
      .filter((h) => !h.resolved)
      .forEach((haz, idx) => {
        const hazCoords = [
          [41.2689, -8.0782],
          [41.2932, -8.0485],
          [41.2558, -8.1742],
          [41.3185, -8.1395],
        ][idx % 4];
        const hazHtml = `
          <div style="display:flex;align-items:center;gap:4px;transform:translate(-50%,-50%);padding:2px 6px;border-radius:9999px;background:#dc2626;color:#ffffff;font-size:10px;font-weight:800;white-space:nowrap;border:2px solid #ffffff;box-shadow:0 2px 8px rgba(220,38,38,0.5);">
            ⚠️ ${haz.hazardType.split('/')[0].trim()}
          </div>
        `;
        L.marker([hazCoords[0], hazCoords[1]], {
          icon: L.divIcon({
            className: 'buddy-leaflet-hazard-pin',
            html: hazHtml,
            iconSize: [0, 0],
          }),
        })
          .bindPopup(
            `<div style="font-family:sans-serif;font-size:12px;color:#0f172a;">
              <strong>⚠️ ${haz.hazardType}</strong><br/>
              <span>${haz.streetLocation}</span>
            </div>`
          )
          .addTo(group);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadHazards, selectedCell?.id, mapRadiusKm]);

  // Update Self Marker & Peer Markers IN-PLACE via marker.setLatLng([lat, lng])
  // NEVER call map.setView() or map.panTo() here so user drag is NEVER interrupted
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    // 1. Update or create Self Courier Marker in-place
    const selfRingColor = isSelfFree ? '#10b981' : '#f59e0b';
    const selfStatusText = isSelfFree ? 'Disponível' : 'Ocupado';
    const selfLabel =
      realCourierProfile?.isRegistered && realCourierProfile.name
        ? `${realCourierProfile.name} (Tu)`
        : 'Novo Perfil (Tu)';
    const selfVehicle = realCourierProfile?.vehicle || 'Mota 125cc';
    const selfAvatarUrl = realCourierProfile?.isRegistered
      ? realCourierProfile.avatar_url || ''
      : '';
    const nextSelfSig = `${selfLabel}|${selfStatusText}|${selfVehicle}|${selfAvatarUrl}`;

    const selfAvatarNode = selfAvatarUrl
      ? `<img src="${selfAvatarUrl}" alt="${selfLabel}" style="width:28px;height:28px;border-radius:9999px;object-fit:cover;border:2.5px solid ${selfRingColor};box-shadow:0 0 0 4px rgba(16,185,129,0.4),0 0 12px rgba(59,130,246,0.75);" />`
      : `<div style="width:15px;height:15px;border-radius:9999px;background:${selfRingColor};border:2.5px solid #ffffff;box-shadow:0 0 0 5px rgba(16,185,129,0.45),0 0 12px rgba(59,130,246,0.75);"></div>`;

    const selfHtml = `
      <div style="display:flex;align-items:center;gap:6px;transform:translate(-50%,-50%);padding:3px 10px 3px 5px;border-radius:9999px;background:#0f172a;color:#ffffff;font-size:11px;font-weight:900;white-space:nowrap;border:2px solid ${selfRingColor};box-shadow:0 0 0 4px rgba(59,130,246,0.38),0 4px 14px rgba(16,185,129,0.5);">
        ${selfAvatarNode}
        <div style="display:flex;flex-direction:column;line-height:1.15;">
          <span>${selfLabel}</span>
          <span style="font-size:9px;color:${selfRingColor};font-weight:800;">● ${selfStatusText} • ${selfVehicle}</span>
        </div>
      </div>
    `;

    if (!selfMarkerRef.current) {
      const m = L.marker([selfLat, selfLng], {
        zIndexOffset: 1000,
        icon: L.divIcon({
          className: 'buddy-leaflet-self-pin',
          html: selfHtml,
          iconSize: [0, 0],
        }),
      }).bindPopup(
        `<div style="font-family:sans-serif;font-size:12px;color:#0f172a;">
          <strong>${selfLabel}</strong><br/>
          <span>${selfVehicle} • ${realCourierProfile?.zone || 'Amarante'} • <strong>${selfStatusText}</strong></span><br/>
          <span style="font-family:monospace;font-size:11px;">GPS: ${selfLat.toFixed(4)}, ${selfLng.toFixed(4)}</span>
        </div>`
      );
      m.addTo(map);
      selfMarkerRef.current = m;
      selfMarkerHtmlSigRef.current = nextSelfSig;
    } else {
      selfMarkerRef.current.setLatLng([selfLat, selfLng]);
      if (selfMarkerHtmlSigRef.current !== nextSelfSig) {
        selfMarkerRef.current.setIcon(
          L.divIcon({
            className: 'buddy-leaflet-self-pin',
            html: selfHtml,
            iconSize: [0, 0],
          })
        );
        selfMarkerHtmlSigRef.current = nextSelfSig;
      }
    }

    // 2. Update or create Peer Couriers in-place without recreating unchanged DOM markers
    const activePeerIds = new Set<string>();
    otherCouriersOnMap.forEach((courier, idx) => {
      activePeerIds.add(courier.id);
      const cLat = Number(courier.lat || 41.272 + (idx + 1) * 0.004);
      const cLng = Number(courier.lng || -8.079 - (idx + 1) * 0.004);
      const isFree = courier.orderStatus === 'DISPONIVEL';
      const ringColor = isFree ? '#10b981' : '#f59e0b';
      const statusBadgeLabel = isFree ? 'Disponível' : 'Ocupado';
      const distKmLabel =
        typeof courier.distanceKm === 'number'
          ? `${courier.distanceKm.toFixed(1)} km`
          : '0.0 km';
      const peerSig = `${courier.callsign}|${courier.vehicle}|${statusBadgeLabel}|${distKmLabel}|${courier.avatarPhotoUrl || ''}`;

      const avatarInside = courier.avatarPhotoUrl
        ? `<img src="${courier.avatarPhotoUrl}" style="width:24px;height:24px;border-radius:9999px;object-fit:cover;border:2px solid ${ringColor};" />`
        : `<div style="width:14px;height:14px;border-radius:9999px;background:${ringColor};border:2px solid #ffffff;"></div>`;
      const peerHtml = `
        <div style="display:flex;align-items:center;gap:5px;transform:translate(-50%,-50%);padding:3px 8px 3px 5px;border-radius:9999px;background:rgba(15,23,42,0.94);color:#ffffff;font-size:10px;font-weight:800;white-space:nowrap;border:1.5px solid ${ringColor};box-shadow:0 2px 10px rgba(0,0,0,0.5);">
          ${avatarInside}
          <div style="display:flex;flex-direction:column;line-height:1.15;">
            <span>${courier.callsign} • <span style="color:#cbd5e1;font-weight:700;">${courier.vehicle}</span></span>
            <span style="font-size:9px;color:${ringColor};font-weight:900;">● ${statusBadgeLabel} • ${distKmLabel}</span>
          </div>
        </div>
      `;

      const existingPeer = peerMarkersMapRef.current.get(courier.id);
      if (!existingPeer) {
        const pm = L.marker([cLat, cLng], {
          icon: L.divIcon({
            className: 'buddy-leaflet-peer-pin',
            html: peerHtml,
            iconSize: [0, 0],
          }),
        }).bindPopup(
          `<div style="font-family:sans-serif;font-size:12px;color:#0f172a;line-height:1.4;">
            <strong>${courier.callsign}</strong> (${courier.vehicle})<br/>
            <span style="display:inline-block;margin:2px 0;padding:1px 6px;border-radius:9999px;background:${isFree ? '#d1fae5' : '#fef3c7'};color:${isFree ? '#065f46' : '#92400e'};font-size:10px;font-weight:800;">● ${statusBadgeLabel}</span>
            <span style="font-size:11px;font-weight:700;color:#0f172a;"> • a ${distKmLabel} de ti</span><br/>
            <span style="font-size:11px;color:#334155;">Zona: ${courier.zoneName}</span><br/>
            <span style="font-family:monospace;font-size:10px;color:#64748b;">GPS: ${cLat.toFixed(4)}, ${cLng.toFixed(4)}</span>
          </div>`
        );
        pm.addTo(map);
        peerMarkersMapRef.current.set(courier.id, { marker: pm, sig: peerSig });
      } else {
        existingPeer.marker.setLatLng([cLat, cLng]);
        if (existingPeer.sig !== peerSig) {
          existingPeer.marker.setIcon(
            L.divIcon({
              className: 'buddy-leaflet-peer-pin',
              html: peerHtml,
              iconSize: [0, 0],
            })
          );
          existingPeer.sig = peerSig;
        }
      }
    });

    // Remove markers for couriers no longer on the map
    peerMarkersMapRef.current.forEach((val, key) => {
      if (!activePeerIds.has(key)) {
        val.marker.remove();
        peerMarkersMapRef.current.delete(key);
      }
    });
  }, [
    selfLat,
    selfLng,
    isSelfFree,
    realCourierProfile,
    otherCouriersOnMap,
  ]);

  // Only fly/center the camera when the user EXPLICITLY taps [🎯 Centrar]
  const handleRecenterOnCourier = () => {
    userHasPannedMap.current = false;
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([selfLat, selfLng], 16, {
        duration: 0.5,
      });
    }
    void refreshLiveGpsPosition();
  };

  const handleZoomIn = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.zoomOut();
    }
  };

  const externalAssistButtons: {
    action: ExternalNavMapAssistAction;
    label: string;
    voicePhrase: string;
    icon: React.ReactNode;
  }[] = [
    {
      action: 'ZOOM_IN',
      label: 'Aproximar Zoom',
      voicePhrase: 'Mapa: aproximar zoom',
      icon: <ZoomIn className="h-3.5 w-3.5 shrink-0" />,
    },
    {
      action: 'ZOOM_OUT',
      label: 'Afastar Zoom',
      voicePhrase: 'Mapa: afastar zoom',
      icon: <ZoomOut className="h-3.5 w-3.5 shrink-0" />,
    },
    {
      action: 'RECENTER_ROUTE',
      label: 'Recentralizar Rota',
      voicePhrase: 'Mapa: recentralizar rota',
      icon: <Compass className="h-3.5 w-3.5 shrink-0" />,
    },
    {
      action: 'REPORT_HAZARD',
      label: 'Marcar Perigo',
      voicePhrase: 'Mapa: marcar perigo no mapa',
      icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
    },
    {
      action: 'ALTERNATIVE_ROUTE',
      label: 'Rota Alternativa',
      voicePhrase: 'Mapa: rota alternativa',
      icon: <Route className="h-3.5 w-3.5 shrink-0" />,
    },
  ];

  const liveRateDisplay = isProdRealOnly
    ? realCalculatedEurPerKmLabel
    : `${marketTelemetry.liveEurPerKmByScope.GLOBAL_CRUZADO.toFixed(2).replace('.', ',')} €/km`;

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col gap-1.5 select-none">
      {/* =====================================================================
          80% FULL-VIEWPORT INTERACTIVE STREET & HYBRID SATELLITE MAP
          height: calc(100dvh - 135px), touch-action: none so 1-finger drag never scrolls page
          ===================================================================== */}
      <div
        aria-label="Mapa Real Interativo de Amarante (80% Ecrã • Ruas & Satélite Híbrido)"
        style={{
          height: 'calc(100dvh - 135px)',
          minHeight: '360px',
          touchAction: 'none',
        }}
        className={`relative w-full rounded-2xl overflow-hidden shadow-lg border ${
          isDaylight ? 'border-slate-300' : 'border-slate-800'
        }`}
      >
        <div
          ref={mapContainerRef}
          className="w-full h-full z-0"
          style={{
            width: '100%',
            height: '100%',
            touchAction: 'none',
          }}
        />

        {/* Slim Translucent High-Contrast Top Floating Control Pill Bar (z-index: 500) */}
        <div className="absolute top-2.5 inset-x-2.5 z-[500] flex items-center justify-between gap-1.5 pointer-events-none">
          <div
            style={{ backgroundColor: 'rgba(2, 6, 23, 0.88)', color: '#ffffff' }}
            className="rounded-xl border border-slate-700/90 p-1 flex items-center gap-1 shadow-xl backdrop-blur-md pointer-events-auto"
          >
            <button
              type="button"
              onClick={() => setMapLayerMode('STREETS')}
              style={{
                backgroundColor:
                  mapLayerMode === 'STREETS' ? '#059669' : 'transparent',
                color: '#ffffff',
              }}
              className="rounded-lg px-2 py-1 text-[10px] font-extrabold cursor-pointer transition whitespace-nowrap"
            >
              🗺️ Ruas
            </button>
            <button
              type="button"
              onClick={() => setMapLayerMode('SATELLITE')}
              style={{
                backgroundColor:
                  mapLayerMode === 'SATELLITE' ? '#059669' : 'transparent',
                color: '#ffffff',
              }}
              className="rounded-lg px-2 py-1 text-[10px] font-extrabold cursor-pointer transition whitespace-nowrap"
            >
              🛰️ Satélite Híbrido
            </button>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={handleRecenterOnCourier}
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)', color: '#34d399' }}
              className="rounded-xl border border-emerald-500/60 px-2.5 py-1.5 text-[10px] font-extrabold shadow-xl backdrop-blur-md cursor-pointer active:scale-95 transition whitespace-nowrap"
            >
              🎯 Centrar
            </button>
            <button
              type="button"
              onClick={() => setIsCourierRegistrationModalOpen(true)}
              style={{ backgroundColor: '#059669', color: '#ffffff' }}
              className="rounded-xl border border-emerald-400/70 px-2.5 py-1.5 text-[10px] font-extrabold shadow-xl flex items-center gap-1 cursor-pointer active:scale-95 transition whitespace-nowrap"
            >
              <UserCheck className="h-3 w-3 shrink-0" />
              <span>👤 Perfil</span>
            </button>
          </div>
        </div>

        {/* Compact Bottom-Left + / - Zoom Controls & Availability Toggle Pill */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[500] flex items-end justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <div
              style={{ backgroundColor: 'rgba(2, 6, 23, 0.88)', color: '#ffffff' }}
              className="rounded-xl border border-slate-700 flex items-center overflow-hidden shadow-lg backdrop-blur-md"
            >
              <button
                type="button"
                onClick={handleZoomOut}
                aria-label="Afastar zoom"
                className="px-2.5 py-1.5 text-xs font-black text-white hover:bg-slate-800 cursor-pointer border-r border-slate-700"
              >
                −
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                aria-label="Aproximar zoom"
                className="px-2.5 py-1.5 text-xs font-black text-white hover:bg-slate-800 cursor-pointer"
              >
                +
              </button>
            </div>

            <div
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.88)', color: '#f8fafc' }}
              className="rounded-xl border border-slate-700 px-2 py-1 text-[10px] font-mono font-bold shadow-md"
            >
              📍 Amarante • {marketTelemetry.onlineCouriersNow} online
            </div>
          </div>

          <button
            type="button"
            onClick={toggleUserOrderAvailabilityStatus}
            style={{
              backgroundColor: isSelfFree
                ? 'rgba(6, 78, 59, 0.94)'
                : 'rgba(120, 53, 15, 0.94)',
              color: '#ffffff',
            }}
            className="pointer-events-auto rounded-xl border border-white/25 px-2.5 py-1.5 text-[10px] font-extrabold shadow-lg cursor-pointer active:scale-95 transition whitespace-nowrap"
          >
            {isSelfFree ? '● Disponível' : '● Ocupado'}
          </button>
        </div>

        {/* Collapsible Telemetry & Waze/Maps Overlay Sheet inside Map when expanded */}
        {isTelemetrySheetExpanded && (
          <div
            style={{ backgroundColor: 'rgba(9, 9, 11, 0.96)', color: '#f4f4f5' }}
            className="absolute inset-x-2 bottom-2 z-[520] rounded-2xl border border-emerald-500/40 p-3 space-y-2.5 shadow-2xl backdrop-blur-md max-h-[65%] overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-white block truncate">
                  {realCourierProfile?.zone || selectedCell?.zoneName || 'Amarante'}
                </span>
                <span className="text-[10px] text-zinc-400 block truncate">
                  Janela {marketTelemetry.currentHourWindowLabel} •{' '}
                  {realCompletedDeliveries.length} entrega(s) hoje •{' '}
                  {marketTelemetry.onlineCouriersNow} estafeta(s) online
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => void cleanupGhostDuplicatePinsNow()}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 px-2 py-1 text-[10px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="h-2.5 w-2.5 text-emerald-400" />
                  <span>Limpar Pinos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('financas')}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2 py-1 text-[10px] font-extrabold text-white cursor-pointer"
                >
                  Finanças →
                </button>
                <button
                  type="button"
                  onClick={() => setIsTelemetrySheetExpanded(false)}
                  className="rounded-lg bg-zinc-800 hover:bg-zinc-700 p-1 text-zinc-300 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* External Navigation Map Touch Helper (Waze / Google Maps Assist) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-zinc-200 flex items-center gap-1">
                  <Navigation className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span>Atalhos Rápidos Waze / Google Maps</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {liveRateDisplay}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {externalAssistButtons.map((btn) => (
                  <button
                    key={btn.action}
                    type="button"
                    onTouchStart={(e) => {
                      const t = e.touches[0];
                      touchStartPosRef.current = {
                        x: t ? t.clientX : 0,
                        y: t ? t.clientY : 0,
                        moved: false,
                      };
                    }}
                    onTouchMove={(e) => {
                      const t = e.touches[0];
                      if (!t) return;
                      const dx = Math.abs(t.clientX - touchStartPosRef.current.x);
                      const dy = Math.abs(t.clientY - touchStartPosRef.current.y);
                      if (dx > 10 || dy > 10) {
                        touchStartPosRef.current.moved = true;
                      }
                    }}
                    onClick={() => {
                      if (touchStartPosRef.current.moved) {
                        touchStartPosRef.current.moved = false;
                        return;
                      }
                      triggerExternalMapAssistMacro(btn.action);
                    }}
                    className="rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 px-2 py-1.5 text-[10px] font-semibold text-zinc-100 flex items-center gap-1 cursor-pointer transition text-left"
                  >
                    {btn.icon}
                    <span className="truncate">{btn.label}</span>
                  </button>
                ))}
              </div>
              {lastExternalMapAssist && (
                <div className="rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1 flex items-center justify-between text-[10px] font-mono text-emerald-400">
                  <span className="truncate">
                    ✓ {lastExternalMapAssist.label}:{' '}
                    {lastExternalMapAssist.simulatedTouchCoords}
                  </span>
                  <span className="text-zinc-500">
                    {lastExternalMapAssist.timestamp}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          COMPACT 1-LINE COLLAPSIBLE BOTTOM TELEMETRY BAR
          ===================================================================== */}
      <button
        type="button"
        onClick={() => setIsTelemetrySheetExpanded((prev) => !prev)}
        style={{ backgroundColor: '#18181b', color: '#f4f4f5' }}
        className="w-full rounded-xl border border-zinc-800 px-3 py-1.5 flex items-center justify-between gap-2 text-[11px] font-bold shadow-sm cursor-pointer hover:border-emerald-500/50 transition shrink-0"
      >
        <span className="truncate">
          Amarante •{' '}
          <strong className="font-mono text-emerald-400">{liveRateDisplay}</strong>
        </span>
        <span className="text-[10px] font-semibold text-emerald-400 whitespace-nowrap shrink-0">
          {isTelemetrySheetExpanded
            ? '▾ Ocultar projeções'
            : '▴ Toque p/ expandir projeções'}
        </span>
      </button>
    </div>
  );
};
