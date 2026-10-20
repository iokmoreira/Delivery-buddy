import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Navigation,
  Compass,
  MapPin,
  AlertTriangle,
  Users,
  Plus,
  X,
  Check,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapRadiusOptionKm,
  OnlineDirectoryCourier,
  PortugalRegionName,
  RoadHazardType,
} from '../types/models';
import { useEstafetas } from '../context/EstafetasContext';

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
                0 alertas na via reportados
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Toque num dos botões acima para reportar um perigo real em Amarante.
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
                0 acordos de zona registados
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Clique em &quot;+ Novo Acordo&quot; para publicar um acordo real em Amarante.
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

const AMARANTE_INITIAL_VIEW_CENTER = {
  lat: 41.2704,
  lng: -8.0818,
};

export const ShiftRadarModule: React.FC = () => {
  const {
    themeMode,
    onlineDirectoryCouriers,
    setActiveBuddyPopupCourierId,
    realCourierProfile,
    refreshLiveGpsPosition,
    cleanupGhostDuplicatePinsNow,
    isAppPaused,
    activeDeliveryLifecycle,
    hasRealActiveDelivery,
    currentMascotState,
    currentMascotImageUrl,
  } = useEstafetas();

  const isDaylight = themeMode === 'DAYLIGHT';

  const [mapStyleMode, setMapStyleMode] = useState<'RUAS' | 'SATELITE'>('RUAS');
  const [isAutoFollowActive, setIsAutoFollowActive] = useState<boolean>(true);
  const [liveAccuracyMeters, setLiveAccuracyMeters] = useState<number>(12);
  const [localLiveCoords, setLocalLiveCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(() => {
    if (
      realCourierProfile?.gpsSource === 'LIVE_GPS' &&
      Number.isFinite(realCourierProfile.lat) &&
      Number.isFinite(realCourierProfile.lng)
    ) {
      return {
        lat: realCourierProfile.lat,
        lng: realCourierProfile.lng,
      };
    }
    return null;
  });

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const selfMarkerRef = useRef<L.Marker | null>(null);
  const selfAccuracyCircleRef = useRef<L.Circle | null>(null);
  const peerMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const isAutoFollowRef = useRef<boolean>(true);
  const hasCenteredOnFirstFixRef = useRef<boolean>(false);

  useEffect(() => {
    isAutoFollowRef.current = isAutoFollowActive;
  }, [isAutoFollowActive]);

  // Purge ghost/duplicate rows in Supabase on map mount
  useEffect(() => {
    void cleanupGhostDuplicatePinsNow();
    void refreshLiveGpsPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync from context when real device GPS updates
  useEffect(() => {
    if (
      realCourierProfile?.gpsSource === 'LIVE_GPS' &&
      Number.isFinite(realCourierProfile.lat) &&
      Number.isFinite(realCourierProfile.lng)
    ) {
      setLocalLiveCoords({
        lat: realCourierProfile.lat,
        lng: realCourierProfile.lng,
      });
    }
  }, [
    realCourierProfile?.gpsSource,
    realCourierProfile?.lat,
    realCourierProfile?.lng,
  ]);

  // Direct high-frequency GPS watcher inside Map tab (Native Android + Instant Network <1s + High-Accuracy GPS)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyIncomingFix = (
      lat: number,
      lng: number,
      accuracy?: number
    ) => {
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        (lat !== 0 || lng !== 0)
      ) {
        setLocalLiveCoords({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
        });
        if (typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy > 0) {
          setLiveAccuracyMeters(Math.min(80, Math.max(6, accuracy)));
        }
      }
    };

    const handleNativeLocationEvent = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          lat: number;
          lng: number;
          accuracy?: number;
        }>
      ).detail;
      if (detail) {
        applyIncomingFix(detail.lat, detail.lng, detail.accuracy);
      }
    };

    window.addEventListener(
      'buddy-native-location',
      handleNativeLocationEvent as EventListener
    );

    const winAny = window as unknown as {
      BuddyNativeOverlay?: {
        requestImmediateNativeGpsFix?: () => void;
      };
    };
    try {
      winAny.BuddyNativeOverlay?.requestImmediateNativeGpsFix?.();
    } catch {
      // ignore
    }

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      return () => {
        window.removeEventListener(
          'buddy-native-location',
          handleNativeLocationEvent as EventListener
        );
      };
    }

    let watchId: number | null = null;
    try {
      // 1. Instant Network/Wi-Fi Location Fix (<1s even indoors)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyIncomingFix(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy
          );
        },
        () => {
          // ignore and wait for watchPosition
        },
        {
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: 60000,
        }
      );

      // 2. Continuous High-Accuracy GPS Watch + Network Fallback on Timeout
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          applyIncomingFix(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy
          );
        },
        () => {
          try {
            navigator.geolocation.getCurrentPosition(
              (netPos) => {
                applyIncomingFix(
                  netPos.coords.latitude,
                  netPos.coords.longitude,
                  netPos.coords.accuracy
                );
              },
              () => {
                // Keep waiting for GPS without placing fake pins
              },
              {
                enableHighAccuracy: false,
                timeout: 4000,
                maximumAge: 60000,
              }
            );
          } catch {
            // ignore
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 10000,
        }
      );
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener(
        'buddy-native-location',
        handleNativeLocationEvent as EventListener
      );
      if (watchId !== null) {
        try {
          navigator.geolocation.clearWatch(watchId);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Only show active peer couriers (within last 5 minutes, excluding self and ghost rows)
  const activePeerCouriers = useMemo(() => {
    const nowMs = Date.now();
    const myId = realCourierProfile?.id || '';
    const myNameLower = (realCourierProfile?.name || '').trim().toLowerCase();

    return onlineDirectoryCouriers.filter((c) => {
      if (c.isSelfProfile || (myId && c.id === myId)) return false;
      const callsignLower = (c.callsign || '').trim().toLowerCase();
      if (
        !callsignLower ||
        callsignLower === 'caio m.' ||
        callsignLower === 'caio' ||
        callsignLower === 'cm' ||
        (myNameLower && callsignLower === myNameLower)
      ) {
        return false;
      }
      if (!c.updatedAtIso) return false;
      const updatedMs = Date.parse(c.updatedAtIso);
      if (!Number.isFinite(updatedMs) || nowMs - updatedMs > 5 * 60 * 1000) {
        return false;
      }
      return (
        typeof c.lat === 'number' &&
        typeof c.lng === 'number' &&
        Number.isFinite(c.lat) &&
        Number.isFinite(c.lng)
      );
    });
  }, [onlineDirectoryCouriers, realCourierProfile?.id, realCourierProfile?.name]);

  const totalOnlineCouriersCount = useMemo(() => {
    const selfCount = !isAppPaused ? 1 : 0;
    return selfCount + activePeerCouriers.length;
  }, [isAppPaused, activePeerCouriers.length]);

  const handleOpenBuddyProfilePopup = useCallback(
    (courier: OnlineDirectoryCourier) => {
      setActiveBuddyPopupCourierId(courier.id);
    },
    [setActiveBuddyPopupCourierId]
  );

  // Initialize Leaflet Map once with Free Key-Free OpenStreetMap Tiles
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    const initialCenter: [number, number] = localLiveCoords
      ? [localLiveCoords.lat, localLiveCoords.lng]
      : [AMARANTE_INITIAL_VIEW_CENTER.lat, AMARANTE_INITIAL_VIEW_CENTER.lng];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: localLiveCoords ? 17 : 15,
      zoomControl: false,
      attributionControl: false,
    });

    const initialTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileLayer = L.tileLayer(initialTileUrl, {
      maxZoom: 19,
      subdomains: 'abc',
    }).addTo(map);

    // Fallback to direct tile.openstreetmap.org if a subdomain ever errors
    let switchedToDirectOsm = false;
    tileLayer.on('tileerror', () => {
      if (!switchedToDirectOsm && tileLayerRef.current) {
        switchedToDirectOsm = true;
        tileLayerRef.current.setUrl(
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        );
      }
    });

    const peerLayer = L.layerGroup().addTo(map);

    // Pause auto-follow when user drags the map manually
    map.on('dragstart', () => {
      setIsAutoFollowActive(false);
    });

    leafletMapRef.current = map;
    tileLayerRef.current = tileLayer;
    peerMarkersLayerRef.current = peerLayer;

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      window.clearTimeout(timer);
      map.remove();
      leafletMapRef.current = null;
      tileLayerRef.current = null;
      selfMarkerRef.current = null;
      selfAccuracyCircleRef.current = null;
      peerMarkersLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch between Free OpenStreetMap ("Ruas") and Esri World Imagery ("Satélite")
  useEffect(() => {
    const tileLayer = tileLayerRef.current;
    if (!tileLayer) return;
    if (mapStyleMode === 'SATELITE') {
      tileLayer.setUrl(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      );
    } else {
      tileLayer.setUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    }
  }, [mapStyleMode]);

  // Update logged-in user's real GPS marker with the Dynamic 3-State Robot Mascot & auto-follow
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    // Never place the user's pin on a fake coordinate before real GPS arrives!
    if (!localLiveCoords) {
      if (selfMarkerRef.current) {
        selfMarkerRef.current.remove();
        selfMarkerRef.current = null;
      }
      if (selfAccuracyCircleRef.current) {
        selfAccuracyCircleRef.current.remove();
        selfAccuracyCircleRef.current = null;
      }
      return;
    }

    const latLng: [number, number] = [localLiveCoords.lat, localLiveCoords.lng];
    const selfCallsign = (realCourierProfile?.name || 'Tu').trim();
    const dotColor =
      currentMascotState === 'DELIVERY'
        ? '#f59e0b'
        : currentMascotState === 'INACTIVE'
          ? '#94a3b8'
          : '#10b981';

    // Update or create accuracy circle
    if (selfAccuracyCircleRef.current) {
      selfAccuracyCircleRef.current.setLatLng(latLng);
      selfAccuracyCircleRef.current.setRadius(liveAccuracyMeters);
      selfAccuracyCircleRef.current.setStyle({
        color: dotColor,
        fillColor: dotColor,
      });
    } else {
      selfAccuracyCircleRef.current = L.circle(latLng, {
        radius: liveAccuracyMeters,
        color: dotColor,
        weight: 1.5,
        fillColor: dotColor,
        fillOpacity: 0.14,
        interactive: false,
      }).addTo(map);
    }

    // Dynamic 3-State Robot Mascot GPS Pin for logged-in user
    const stateBadge =
      currentMascotState === 'DELIVERY'
        ? '🚀'
        : currentMascotState === 'INACTIVE'
          ? '⚪'
          : '👍';

    const selfIcon = L.divIcon({
      className: 'buddy-clean-self-pin',
      html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);">
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
          <span style="position:absolute;inset:-4px;border-radius:9999px;background:${dotColor};opacity:0.32;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
          <div style="width:42px;height:42px;border-radius:9999px;background:#0f172a;border:3px solid ${dotColor};overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;">
            <img src="${currentMascotImageUrl}" alt="Buddy" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" />
          </div>
          <span style="position:absolute;bottom:-2px;right:-4px;background:#09090b;border:1.5px solid ${dotColor};border-radius:9999px;font-size:10px;line-height:1;padding:2px 3px;">${stateBadge}</span>
        </div>
        <span style="margin-top:3px;background:#09090b;color:#ffffff;font-size:10px;font-weight:900;padding:1.5px 7px;border-radius:9999px;border:1.5px solid ${dotColor};white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.45);">
          ${selfCallsign}
        </span>
      </div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    if (selfMarkerRef.current) {
      selfMarkerRef.current.setLatLng(latLng);
      selfMarkerRef.current.setIcon(selfIcon);
    } else {
      selfMarkerRef.current = L.marker(latLng, {
        icon: selfIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    }

    // Smooth Auto-Follow Mode
    if (!hasCenteredOnFirstFixRef.current) {
      hasCenteredOnFirstFixRef.current = true;
      map.setView(latLng, 17, { animate: true });
    } else if (isAutoFollowRef.current) {
      map.panTo(latLng, { animate: true, duration: 0.5 });
    }
  }, [
    localLiveCoords,
    liveAccuracyMeters,
    realCourierProfile?.name,
    isAppPaused,
    currentMascotState,
    currentMascotImageUrl,
  ]);

  // Render active peer couriers (within last 5 minutes only)
  useEffect(() => {
    const peerLayer = peerMarkersLayerRef.current;
    if (!peerLayer) return;
    peerLayer.clearLayers();

    activePeerCouriers.forEach((c) => {
      if (typeof c.lat !== 'number' || typeof c.lng !== 'number') return;
      const isFree = c.orderStatus === 'DISPONIVEL';
      const ringColor = isFree ? '#10b981' : '#f59e0b';

      const peerIcon = L.divIcon({
        className: 'buddy-clean-peer-pin',
        html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">
          <div style="width:26px;height:26px;border-radius:9999px;background:#18181b;color:#ffffff;border:2.5px solid ${ringColor};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;box-shadow:0 2px 8px rgba(0,0,0,0.5);">
            ${c.avatarInitials || c.callsign.slice(0, 2).toUpperCase()}
          </div>
          <span style="margin-top:2px;background:rgba(9,9,11,0.92);color:#ffffff;font-size:9px;font-weight:800;padding:1px 5px;border-radius:6px;border:1px solid ${ringColor};white-space:nowrap;">
            ${c.callsign}
          </span>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([c.lat, c.lng], { icon: peerIcon });
      marker.on('click', () => {
        handleOpenBuddyProfilePopup(c);
      });
      marker.addTo(peerLayer);
    });
  }, [activePeerCouriers, handleOpenBuddyProfilePopup]);

  const handleRecenterAndFollowGps = () => {
    setIsAutoFollowActive(true);
    void refreshLiveGpsPosition();

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(6));
            const lng = Number(pos.coords.longitude.toFixed(6));
            setLocalLiveCoords({ lat, lng });
            if (leafletMapRef.current) {
              leafletMapRef.current.flyTo([lat, lng], 17, {
                animate: true,
                duration: 0.6,
              });
            }
          },
          () => {
            // ignore
          },
          { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
        );

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(6));
            const lng = Number(pos.coords.longitude.toFixed(6));
            setLocalLiveCoords({ lat, lng });
            if (leafletMapRef.current) {
              leafletMapRef.current.flyTo([lat, lng], 17, {
                animate: true,
                duration: 0.6,
              });
            }
          },
          () => {
            if (localLiveCoords && leafletMapRef.current) {
              leafletMapRef.current.flyTo(
                [localLiveCoords.lat, localLiveCoords.lng],
                17,
                { animate: true, duration: 0.6 }
              );
            }
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      } catch {
        // ignore
      }
    }

    if (localLiveCoords && leafletMapRef.current) {
      leafletMapRef.current.flyTo(
        [localLiveCoords.lat, localLiveCoords.lng],
        17,
        { animate: true, duration: 0.6 }
      );
    }
  };

  const handleOpenExternalNav = (app: 'WAZE' | 'GMAPS') => {
    const destQuery =
      hasRealActiveDelivery && activeDeliveryLifecycle.destinationName
        ? encodeURIComponent(`${activeDeliveryLifecycle.destinationName}, Amarante`)
        : localLiveCoords
          ? `${localLiveCoords.lat},${localLiveCoords.lng}`
          : '41.2704,-8.0818';

    const url =
      app === 'WAZE'
        ? `https://waze.com/ul?q=${destQuery}&navigate=yes`
        : `https://www.google.com/maps/dir/?api=1&destination=${destQuery}&travelmode=two-wheeler`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-2.5">
      {/* FULL INTERACTIVE LEAFLET MAP CONTAINER */}
      <div
        className={`relative rounded-2xl overflow-hidden border shadow-xl h-[calc(100vh-148px)] min-h-[460px] max-h-[760px] ${
          isDaylight
            ? 'border-slate-300 bg-slate-100'
            : 'border-zinc-800 bg-zinc-950'
        }`}
      >
        {/* Leaflet Map Canvas */}
        <div
          ref={mapContainerRef}
          className="absolute inset-0 z-0 h-full w-full"
        />

        {/* TOP OVERLAY BAR: ONLY [🗺️ Ruas | 🛰️ Satélite] on Left AND [🎯 Centrar] on Right */}
        <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between gap-2 pointer-events-none">
          {/* Left: Street vs Satellite Toggle */}
          <div className="pointer-events-auto inline-flex items-center rounded-xl bg-zinc-950/90 backdrop-blur-md border border-zinc-700 p-1 shadow-lg">
            <button
              type="button"
              onClick={() => setMapStyleMode('RUAS')}
              className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                mapStyleMode === 'RUAS'
                  ? 'bg-emerald-500 text-zinc-950 shadow'
                  : 'text-zinc-200 hover:text-white'
              }`}
            >
              🗺️ Ruas
            </button>
            <button
              type="button"
              onClick={() => setMapStyleMode('SATELITE')}
              className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                mapStyleMode === 'SATELITE'
                  ? 'bg-emerald-500 text-zinc-950 shadow'
                  : 'text-zinc-200 hover:text-white'
              }`}
            >
              🛰️ Satélite
            </button>
          </div>

          {/* Right: Centrar + Auto-Follow GPS Button (No Perfil button!) */}
          <button
            type="button"
            onClick={handleRecenterAndFollowGps}
            className={`pointer-events-auto rounded-xl backdrop-blur-md border px-3.5 py-2 text-xs font-black flex items-center gap-1.5 shadow-lg cursor-pointer transition ${
              isAutoFollowActive && localLiveCoords
                ? 'bg-emerald-600/95 border-emerald-400 text-white'
                : 'bg-zinc-950/90 border-zinc-700 text-zinc-100 hover:bg-zinc-900'
            }`}
          >
            <Compass className="h-3.5 w-3.5 shrink-0" />
            <span>🎯 Centrar</span>
          </button>
        </div>

        {/* CLEAN COMPACT BOTTOM STATUS PILL (No black drawer, no duplicate Disponível button) */}
        <div className="absolute bottom-3 left-3 right-3 z-[400] flex items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto rounded-xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800 px-3 py-2 shadow-lg flex items-center gap-2 min-w-0">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                !localLiveCoords
                  ? 'bg-amber-400 animate-pulse'
                  : isAppPaused
                    ? 'bg-zinc-400'
                    : 'bg-emerald-400 animate-ping'
              }`}
            />
            <span className="text-[11px] font-extrabold text-zinc-100 truncate">
              {localLiveCoords
                ? isAutoFollowActive
                  ? 'GPS em Tempo Real (A seguir)'
                  : 'GPS Ativo (Toque 🎯 Centrar p/ seguir)'
                : 'A obter sinal GPS do telemóvel...'}
            </span>
            <span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 shrink-0">
              {totalOnlineCouriersCount} online
            </span>
          </div>

          {hasRealActiveDelivery && (
            <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenExternalNav('WAZE')}
                className="rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-3 py-2 text-[11px] font-black shadow-lg flex items-center gap-1 cursor-pointer"
              >
                <Navigation className="h-3 w-3" />
                <span>Waze</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenExternalNav('GMAPS')}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-[11px] font-black shadow-lg flex items-center gap-1 cursor-pointer"
              >
                <Navigation className="h-3 w-3" />
                <span>Maps</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
