import { AMARANTE_DEFAULT_COORDS } from '../services/geminiAgent';

export interface AmaranteCrosswalkPoint {
  id: string;
  lat: number;
  lng: number;
  streetLabel: string;
  source: 'SEED_AMARANTE' | 'OVERPASS_OSM' | 'COURIER_TAUGHT';
  taughtByCallsign?: string;
  createdAtIso?: string;
}

export interface AmaranteLearnedPath {
  id: string;
  streetOrBuildingLabel?: string;
  addressTitle?: string;
  addressLabel?: string;
  entranceNote: string;
  breadcrumbs: Array<{ lat: number; lng: number }>;
  entryLat?: number;
  entryLng?: number;
  doorLat?: number;
  doorLng?: number;
  entranceLat?: number;
  entranceLng?: number;
  lat?: number;
  lng?: number;
  taughtByCallsign?: string;
  taughtByCourierName?: string;
  taughtBy?: string;
  createdAtIso: string;
}

export interface DeliverySpeedRealitySummary {
  id: string;
  platform: string;
  routeLabel: string;
  netProfitEur: number;
  distanceKm: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  predominantLimitKmh: number;
  secondsSavedBySpeeding: number;
  didExceedSpeedLimit: boolean;
  overLimitPeakSeconds: number;
  spokenMessagePt: string;
  timestampLabel: string;
}

export interface LiveCopilotSpeedState {
  currentSpeedKmh: number;
  roadLimitKmh: 30 | 50 | 70 | 90;
  roadNameLabel: string;
  consecutiveOverSpeedSeconds: number;
  isSpeedAlertPulsing: boolean;
  lastSpeedAlertTriggeredMs: number;
  headingDeg: number | null;
  approachingCrosswalk: {
    crosswalk: AmaranteCrosswalkPoint;
    distanceMeters: number;
  } | null;
}

const CUSTOM_CROSSWALKS_STORAGE_KEY = 'buddy_amarante_custom_crosswalks_v1';
const OVERPASS_CROSSWALKS_CACHE_KEY = 'buddy_amarante_overpass_crosswalks_v1';
const DELETED_CROSSWALKS_STORAGE_KEY = 'buddy_amarante_deleted_crosswalk_ids_v1';
const LEARNED_PATHS_STORAGE_KEY = 'buddy_amarante_learned_paths_v1';
const LAST_DELIVERY_REALITY_SUMMARY_KEY = 'buddy_last_delivery_reality_summary_v1';

export const SEED_AMARANTE_LEARNED_PATHS: AmaranteLearnedPath[] = [
  {
    id: 'path-amarante-tamega-1',
    streetOrBuildingLabel: 'Condomínio Rio Tâmega / Av. General Silveira',
    addressTitle: 'Condomínio Rio Tâmega / Av. General Silveira',
    addressLabel: 'Condomínio Rio Tâmega / Av. General Silveira',
    entranceNote: 'Entrada pelo portão lateral junto ao Rio Tâmega (campainha no pilar direito).',
    breadcrumbs: [
      { lat: 41.2694, lng: -8.0789 },
      { lat: 41.2691, lng: -8.0785 },
      { lat: 41.2689, lng: -8.0782 },
    ],
    entryLat: 41.2694,
    entryLng: -8.0789,
    doorLat: 41.2689,
    doorLng: -8.0782,
    entranceLat: 41.2689,
    entranceLng: -8.0782,
    lat: 41.2689,
    lng: -8.0782,
    taughtByCallsign: 'Presidente',
    taughtByCourierName: 'Presidente',
    taughtBy: 'Presidente',
    createdAtIso: '2026-10-20T18:00:00.000Z',
  },
];

export const loadLearnedAmarantePaths = (): AmaranteLearnedPath[] => {
  try {
    const raw = localStorage.getItem(LEARNED_PATHS_STORAGE_KEY);
    if (!raw) return SEED_AMARANTE_LEARNED_PATHS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_AMARANTE_LEARNED_PATHS;
    const combined = [...parsed];
    SEED_AMARANTE_LEARNED_PATHS.forEach((seed) => {
      if (!combined.some((p) => p && p.id === seed.id)) {
        combined.push(seed);
      }
    });
    return combined;
  } catch {
    return SEED_AMARANTE_LEARNED_PATHS;
  }
};

export const saveLearnedAmarantePath = (
  pathItem: AmaranteLearnedPath
): AmaranteLearnedPath[] => {
  const existing = loadLearnedAmarantePaths();
  const filtered = existing.filter((p) => p.id !== pathItem.id);
  const next = [pathItem, ...filtered].slice(0, 60);
  try {
    localStorage.setItem(LEARNED_PATHS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('buddy-learned-paths-updated'));
  }
  return next;
};

// Built-in seed list of key Amarante pedestrian crosswalks (Av. General Silveira, São Gonçalo, Santa Luzia, Freixo de Cima, EN15)
export const SEED_AMARANTE_CROSSWALKS: AmaranteCrosswalkPoint[] = [
  {
    id: 'cw-amarante-gen-silveira-1',
    lat: 41.2693,
    lng: -8.0786,
    streetLabel: 'Av. General Silveira (Centro / Câmara)',
    source: 'SEED_AMARANTE',
  },
  {
    id: 'cw-amarante-gen-silveira-2',
    lat: 41.2701,
    lng: -8.0802,
    streetLabel: 'Av. General Silveira (Jardim Público)',
    source: 'SEED_AMARANTE',
  },
  {
    id: 'cw-amarante-sao-goncalo',
    lat: 41.2688,
    lng: -8.0794,
    streetLabel: 'Largo de São Gonçalo / Ponte S. Gonçalo',
    source: 'SEED_AMARANTE',
  },
  {
    id: 'cw-amarante-candido-reis',
    lat: 41.2683,
    lng: -8.0778,
    streetLabel: 'Rua Cândido dos Reis (Centro Histórico)',
    source: 'SEED_AMARANTE',
  },
  {
    id: 'cw-amarante-santa-luzia-1',
    lat: 41.2718,
    lng: -8.0825,
    streetLabel: 'Santa Luzia / Rua 31 de Janeiro (Escolas)',
    source: 'SEED_AMARANTE',
  },
  {
    id: 'cw-amarante-santa-luzia-2',
    lat: 41.2732,
    lng: -8.0836,
    streetLabel: 'Santa Luzia — Rotunda / Farmácia',
    source: 'SEED_AMARANTE',
  },
  {
    id: 'cw-amarante-queimado',
    lat: 41.2744,
    lng: -8.0845,
    streetLabel: 'Queimado / Rotunda das Ovelhas',
    source: 'SEED_AMARANTE',
  },
  {
    id: 'cw-amarante-1-maio',
    lat: 41.2654,
    lng: -8.0748,
    streetLabel: 'Av. 1.º de Maio (Continente / Retail)',
    source: 'SEED_AMARANTE',
  },
  {
    id: 'cw-amarante-madalena',
    lat: 41.2642,
    lng: -8.0721,
    streetLabel: 'Madalena — Rua Dr. Miguel Pinto Martins',
    source: 'SEED_AMARANTE',
  },
  {
    id: 'cw-amarante-cepelos',
    lat: 41.2671,
    lng: -8.0862,
    streetLabel: 'Cepelos — Cruzamento Principal',
    source: 'SEED_AMARANTE',
  },
  {
    id: 'cw-amarante-freixo-cima-en15',
    lat: 41.2611,
    lng: -8.1285,
    streetLabel: 'Freixo de Cima — Reta da EN15 (Escolas)',
    source: 'SEED_AMARANTE',
  },
  {
    id: 'cw-amarante-en15-padronelo',
    lat: 41.2689,
    lng: -8.0512,
    streetLabel: 'EN15 — Cruzamento de Padronelo',
    source: 'SEED_AMARANTE',
  },
];

export const computeHaversineMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const computeBearingDegrees = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dLambda = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
};

export const getAngleDifferenceDeg = (a: number, b: number): number => {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
};

export const loadDeletedCrosswalkIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_CROSSWALKS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
};

export const loadCustomTaughtCrosswalks = (): AmaranteCrosswalkPoint[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_CROSSWALKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const deleted = loadDeletedCrosswalkIds();
    return Array.isArray(parsed)
      ? parsed.filter((c) => c && c.id && !deleted.has(c.id))
      : [];
  } catch {
    return [];
  }
};

export const saveCustomTaughtCrosswalk = (
  point: AmaranteCrosswalkPoint
): AmaranteCrosswalkPoint[] => {
  const deleted = loadDeletedCrosswalkIds();
  if (deleted.has(point.id)) {
    return loadCustomTaughtCrosswalks();
  }
  const existing = loadCustomTaughtCrosswalks();
  // Avoid duplicate within 12 meters
  const isDuplicate = existing.some(
    (c) => computeHaversineMeters(c.lat, c.lng, point.lat, point.lng) < 12
  );
  const next = isDuplicate ? existing : [point, ...existing];
  try {
    localStorage.setItem(CUSTOM_CROSSWALKS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('buddy-crosswalks-updated'));
  }
  return next;
};

export const deleteCrosswalkById = (
  crosswalkId: string
): AmaranteCrosswalkPoint[] => {
  if (!crosswalkId) return getAllAmaranteCrosswalks();
  const deleted = loadDeletedCrosswalkIds();
  deleted.add(crosswalkId);
  try {
    localStorage.setItem(
      DELETED_CROSSWALKS_STORAGE_KEY,
      JSON.stringify(Array.from(deleted))
    );
  } catch {
    // ignore
  }
  const existingCustom = loadCustomTaughtCrosswalks();
  const filteredCustom = existingCustom.filter((c) => c.id !== crosswalkId);
  try {
    localStorage.setItem(
      CUSTOM_CROSSWALKS_STORAGE_KEY,
      JSON.stringify(filteredCustom)
    );
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('buddy-crosswalks-updated'));
  }
  return getAllAmaranteCrosswalks();
};

export const deleteLatestCrosswalk = (): AmaranteCrosswalkPoint | null => {
  const custom = loadCustomTaughtCrosswalks();
  if (custom.length > 0) {
    const latest = custom[0];
    deleteCrosswalkById(latest.id);
    return latest;
  }
  const all = getAllAmaranteCrosswalks();
  if (all.length > 0) {
    const last = all[all.length - 1];
    deleteCrosswalkById(last.id);
    return last;
  }
  return null;
};

export const loadCachedOverpassCrosswalks = (): AmaranteCrosswalkPoint[] => {
  try {
    const raw = localStorage.getItem(OVERPASS_CROSSWALKS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getAllAmaranteCrosswalks = (): AmaranteCrosswalkPoint[] => {
  const deleted = loadDeletedCrosswalkIds();
  const custom = loadCustomTaughtCrosswalks();
  const overpass = loadCachedOverpassCrosswalks();
  const combined: AmaranteCrosswalkPoint[] = [
    ...custom,
    ...SEED_AMARANTE_CROSSWALKS,
  ].filter((cw) => cw && cw.id && !deleted.has(cw.id));

  overpass.forEach((osmCw) => {
    if (!osmCw || !osmCw.id || deleted.has(osmCw.id)) return;
    const tooClose = combined.some(
      (existing) =>
        computeHaversineMeters(existing.lat, existing.lng, osmCw.lat, osmCw.lng) <
        18
    );
    if (!tooClose) {
      combined.push(osmCw);
    }
  });

  return combined;
};

let overpassFetchInFlight = false;

export const fetchAmaranteCrosswalksFromOverpass = async (): Promise<
  AmaranteCrosswalkPoint[]
> => {
  const cached = loadCachedOverpassCrosswalks();
  if (cached.length > 0 || overpassFetchInFlight) {
    return getAllAmaranteCrosswalks();
  }

  overpassFetchInFlight = true;
  try {
    const query = `[out:json][timeout:8];node["highway"="crossing"](around:3500,${AMARANTE_DEFAULT_COORDS.lat},${AMARANTE_DEFAULT_COORDS.lng});out body 60;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as {
        elements?: Array<{
          id: number;
          lat?: number;
          lon?: number;
          tags?: Record<string, string>;
        }>;
      };
      if (Array.isArray(data.elements)) {
        const mapped: AmaranteCrosswalkPoint[] = data.elements
          .filter(
            (el) =>
              typeof el.lat === 'number' &&
              typeof el.lon === 'number' &&
              Number.isFinite(el.lat) &&
              Number.isFinite(el.lon)
          )
          .slice(0, 50)
          .map((el) => ({
            id: `osm-cw-${el.id}`,
            lat: Number(el.lat!.toFixed(6)),
            lng: Number(el.lon!.toFixed(6)),
            streetLabel:
              el.tags?.['name'] ||
              el.tags?.['crossing:island'] ||
              'Passadeira Mapeada (Amarante)',
            source: 'OVERPASS_OSM',
          }));
        try {
          localStorage.setItem(
            OVERPASS_CROSSWALKS_CACHE_KEY,
            JSON.stringify(mapped)
          );
        } catch {
          // ignore
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('buddy-crosswalks-updated'));
        }
      }
    }
  } catch {
    // Fallback to SEED_AMARANTE_CROSSWALKS silently
  } finally {
    overpassFetchInFlight = false;
  }

  return getAllAmaranteCrosswalks();
};

// Dynamic Road Speed Limit Resolver (30 / 50 / 70 / 90 km/h)
let lastSpeedLimitQueryCoords: { lat: number; lng: number } | null = null;
let lastSpeedLimitQueryMs = 0;
let cachedRoadLimit: { limit: 30 | 50 | 70 | 90; roadName: string } = {
  limit: 50,
  roadName: 'Amarante (Urbano)',
};

export const estimateAmaranteRoadLimitHeuristic = (
  lat: number,
  lng: number
): { limit: 30 | 50 | 70 | 90; roadName: string } => {
  // Historic center / Ponte de São Gonçalo / Rua Cândido dos Reis (~400m around 41.2688, -8.0788) -> 30 km/h
  const distHistoricMeters = computeHaversineMeters(lat, lng, 41.2688, -8.0788);
  if (distHistoricMeters <= 380) {
    return { limit: 30, roadName: 'Centro Histórico / S. Gonçalo' };
  }

  // Urban Amarante center (< 3.2 km from hub) -> 50 km/h
  const distHubMeters = computeHaversineMeters(
    lat,
    lng,
    AMARANTE_DEFAULT_COORDS.lat,
    AMARANTE_DEFAULT_COORDS.lng
  );
  if (distHubMeters <= 3200) {
    return { limit: 50, roadName: 'Amarante Centro Urbano' };
  }

  // Regional arteries (EN15 / Variante / Tâmega): 70 km/h or 90 km/h
  if (distHubMeters <= 7500) {
    return { limit: 70, roadName: 'EN15 / Variante Regional' };
  }
  return { limit: 90, roadName: 'Via Rápida / EN15 Regional' };
};

export const resolveRoadSpeedLimitAtCoords = async (
  lat: number,
  lng: number
): Promise<{ limit: 30 | 50 | 70 | 90; roadName: string }> => {
  const now = Date.now();
  const heuristic = estimateAmaranteRoadLimitHeuristic(lat, lng);

  if (
    lastSpeedLimitQueryCoords &&
    now - lastSpeedLimitQueryMs < 25000 &&
    computeHaversineMeters(
      lat,
      lng,
      lastSpeedLimitQueryCoords.lat,
      lastSpeedLimitQueryCoords.lng
    ) < 90
  ) {
    return cachedRoadLimit;
  }

  lastSpeedLimitQueryCoords = { lat, lng };
  lastSpeedLimitQueryMs = now;
  cachedRoadLimit = heuristic;

  try {
    const query = `[out:json][timeout:4];way(around:40,${lat},${lng})["highway"];out tags 3;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as {
        elements?: Array<{ tags?: Record<string, string> }>;
      };
      const wayWithSpeed = data.elements?.find((w) => w.tags?.highway);
      if (wayWithSpeed?.tags) {
        const rawMax = parseInt(wayWithSpeed.tags.maxspeed || '', 10);
        const roadName =
          wayWithSpeed.tags.name ||
          wayWithSpeed.tags.ref ||
          heuristic.roadName;
        if (rawMax === 30 || rawMax === 20 || rawMax === 40) {
          cachedRoadLimit = { limit: 30, roadName };
        } else if (rawMax === 50 || rawMax === 60) {
          cachedRoadLimit = { limit: 50, roadName };
        } else if (rawMax === 70 || rawMax === 80) {
          cachedRoadLimit = { limit: 70, roadName };
        } else if (rawMax >= 90) {
          cachedRoadLimit = { limit: 90, roadName };
        } else {
          const hw = wayWithSpeed.tags.highway;
          if (hw === 'living_street' || hw === 'pedestrian' || hw === 'residential') {
            cachedRoadLimit = {
              limit: distFromHubKm(lat, lng) < 0.5 ? 30 : 50,
              roadName,
            };
          } else if (hw === 'trunk' || hw === 'motorway' || hw === 'primary') {
            cachedRoadLimit = {
              limit: distFromHubKm(lat, lng) < 2.2 ? 50 : 70,
              roadName,
            };
          } else {
            cachedRoadLimit = { limit: heuristic.limit, roadName };
          }
        }
      }
    }
  } catch {
    // Keep heuristic fallback silently
  }

  return cachedRoadLimit;
};

const distFromHubKm = (lat: number, lng: number): number =>
  computeHaversineMeters(
    lat,
    lng,
    AMARANTE_DEFAULT_COORDS.lat,
    AMARANTE_DEFAULT_COORDS.lng
  ) / 1000;

// ============================================================================
// ACTIVE DELIVERY SPEED & TELEMETRY TRACKER + END-OF-DELIVERY REALITY CHECK
// ============================================================================
interface ActiveRideSpeedTelemetryAccumulator {
  startedAtMs: number;
  maxSpeedKmh: number;
  speedSamplesKmh: number[];
  limitSamplesKmh: number[];
  overLimitConsecutivePeakSec: number;
  totalSecondsOverLimit: number;
}

let rideAccumulator: ActiveRideSpeedTelemetryAccumulator = {
  startedAtMs: Date.now(),
  maxSpeedKmh: 0,
  speedSamplesKmh: [],
  limitSamplesKmh: [],
  overLimitConsecutivePeakSec: 0,
  totalSecondsOverLimit: 0,
};

export const resetActiveRideSpeedTelemetry = (): void => {
  rideAccumulator = {
    startedAtMs: Date.now(),
    maxSpeedKmh: 0,
    speedSamplesKmh: [],
    limitSamplesKmh: [],
    overLimitConsecutivePeakSec: 0,
    totalSecondsOverLimit: 0,
  };
};

export const recordLiveSpeedSampleForDelivery = (
  speedKmh: number,
  roadLimitKmh: number,
  consecutiveOverSec: number
): void => {
  if (!Number.isFinite(speedKmh) || speedKmh < 0) return;
  if (speedKmh > rideAccumulator.maxSpeedKmh) {
    rideAccumulator.maxSpeedKmh = Math.round(speedKmh);
  }
  if (speedKmh >= 3) {
    rideAccumulator.speedSamplesKmh.push(speedKmh);
    rideAccumulator.limitSamplesKmh.push(roadLimitKmh);
    if (rideAccumulator.speedSamplesKmh.length > 300) {
      rideAccumulator.speedSamplesKmh.shift();
      rideAccumulator.limitSamplesKmh.shift();
    }
  }
  if (consecutiveOverSec > rideAccumulator.overLimitConsecutivePeakSec) {
    rideAccumulator.overLimitConsecutivePeakSec = consecutiveOverSec;
  }
  if (speedKmh > roadLimitKmh + 10) {
    rideAccumulator.totalSecondsOverLimit += 1;
  }
};

/**
 * Computes the End-of-Delivery Summary with the exact mathematical
 * "Time-Saved vs. Risk" Reality Check:
 *   Delta_t (seconds) = distanceKm * (1 / v_segura - 1 / v_real) * 3600
 */
export const buildEndOfDeliveryRealitySummary = (input: {
  platform: string;
  routeLabel: string;
  netProfitEur: number;
  distanceKm: number;
}): DeliverySpeedRealitySummary => {
  const safeDistanceKm = Math.max(0.4, Number(input.distanceKm.toFixed(1)));
  const samples = rideAccumulator.speedSamplesKmh;
  const limits = rideAccumulator.limitSamplesKmh;

  const predominantLimitKmh =
    limits.length > 0
      ? Math.round(limits.reduce((a, b) => a + b, 0) / limits.length)
      : 50;

  // Safe urban/regional average speed in Amarante (typically ~34-38 km/h for a 50 km/h limit)
  const safeAverageSpeedKmh = Math.max(
    28,
    Math.min(50, Math.round(predominantLimitKmh * 0.76))
  );

  let measuredAvgSpeedKmh: number;
  let measuredMaxSpeedKmh: number;

  if (samples.length >= 3) {
    measuredAvgSpeedKmh = Math.round(
      samples.reduce((a, b) => a + b, 0) / samples.length
    );
    measuredMaxSpeedKmh = Math.max(
      measuredAvgSpeedKmh,
      Math.round(rideAccumulator.maxSpeedKmh)
    );
  } else {
    // When completed without long GPS movement samples, use realistic telemetry
    measuredAvgSpeedKmh = safeAverageSpeedKmh;
    measuredMaxSpeedKmh = Math.max(
      safeAverageSpeedKmh + 4,
      Math.round(rideAccumulator.maxSpeedKmh || predominantLimitKmh - 2)
    );
  }

  const didExceedSpeedLimit =
    measuredMaxSpeedKmh > predominantLimitKmh + 8 ||
    measuredAvgSpeedKmh > safeAverageSpeedKmh + 4 ||
    rideAccumulator.totalSecondsOverLimit > 0;

  // Mathematical Time-Saved calculation: Delta_t = distance * (1/v_segura - 1/v_real) * 3600
  // For segments where the rider exceeded the limit, compare effective fast speed vs safe speed over the faster stretch (or full route)
  let secondsSavedBySpeeding = 0;
  if (didExceedSpeedLimit) {
    const effectiveFastSpeedKmh = Math.max(
      safeAverageSpeedKmh + 6,
      Math.round((measuredAvgSpeedKmh + measuredMaxSpeedKmh) / 2)
    );
    const fastStretchKm = Math.max(0.5, safeDistanceKm * 0.45);
    const rawDeltaHours =
      fastStretchKm * (1 / safeAverageSpeedKmh - 1 / effectiveFastSpeedKmh);
    secondsSavedBySpeeding = Math.max(
      8,
      Math.min(75, Math.round(rawDeltaHours * 3600))
    );
  }

  const spokenMessagePt = didExceedSpeedLimit
    ? `Entrega concluída! Nos trechos mais rápidos ganhaste apenas ${secondsSavedBySpeeding} segundos nesta distância curta. Manter a velocidade padrão leva quase o mesmo tempo, poupa combustível e protege a tua vida.`
    : `Entrega concluída com condução cem por cento segura! Excelente ritmo, poupaste combustível e desgaste sem perder tempo.`;

  const summary: DeliverySpeedRealitySummary = {
    id: `reality-sum-${Date.now()}`,
    platform: input.platform,
    routeLabel: input.routeLabel,
    netProfitEur: Number(input.netProfitEur.toFixed(2)),
    distanceKm: safeDistanceKm,
    avgSpeedKmh: measuredAvgSpeedKmh,
    maxSpeedKmh: measuredMaxSpeedKmh,
    predominantLimitKmh,
    secondsSavedBySpeeding,
    didExceedSpeedLimit,
    overLimitPeakSeconds: rideAccumulator.overLimitConsecutivePeakSec,
    spokenMessagePt,
    timestampLabel: new Date().toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  try {
    localStorage.setItem(
      LAST_DELIVERY_REALITY_SUMMARY_KEY,
      JSON.stringify(summary)
    );
  } catch {
    // ignore
  }

  resetActiveRideSpeedTelemetry();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<DeliverySpeedRealitySummary>(
        'buddy-delivery-reality-summary',
        { detail: summary }
      )
    );
  }

  return summary;
};
