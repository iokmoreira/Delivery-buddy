import {
  AmaranteBaseZoneOption,
  CourierRegistrationVehicle,
  PlatformName,
  RealCourierMapProfile,
  RoadHazardPin,
  SupabaseCourierRow,
  WalkieChannelId,
  WalkieMessage,
} from '../types/models';
import { AmaranteCrosswalkPoint } from '../utils/amaranteCopilotTelemetry';

export const FLEET_SYNC_TOPIC = 'db_amarante_fleet_v3';
export const LIVE_SYNC_TOPIC = 'db_amarante_fleet_v3';
export const LEGACY_LIVE_SYNC_TOPIC = 'db_amarante_live_sync_v2';
export const ACCOUNTS_SYNC_TOPIC = 'db_amarante_accounts_v2';
export const CLOUD_SHARED_STATE_STORAGE_KEY = 'buddy_cloud_shared_state_v3';

export type CourierApprovalStatus = 'approved' | 'pending' | 'blocked';
export type CourierCloudRole = 'admin' | 'courier';
export type CourierLivePresenceStatus = 'online' | 'busy' | 'paused';

export interface CloudCourierPresence {
  id: string;
  name: string;
  role: CourierCloudRole;
  vehicle: string;
  platforms: PlatformName[];
  zone: string;
  status: CourierLivePresenceStatus;
  approvalStatus: CourierApprovalStatus;
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number;
  avatar?: string;
  deviceModel?: string;
  screenAspectRatio?: string;
  whatsapp?: string;
  email?: string;
  optInWhatsapp?: boolean;
  optInEmail?: boolean;
  lastSeen: string;
}

export interface CloudApprovalRequest {
  id: string;
  username: string;
  emailOrPhone: string;
  whatsapp?: string;
  email?: string;
  optInWhatsapp?: boolean;
  optInEmail?: boolean;
  vehicle: CourierRegistrationVehicle | string;
  platforms: PlatformName[];
  zone: AmaranteBaseZoneOption | string;
  role: CourierCloudRole;
  approvalStatus: CourierApprovalStatus;
  lat: number;
  lng: number;
  deviceModel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotificationConfig {
  adminWhatsapp: string;
  adminEmail: string;
  autoNotifyNewUsers: boolean;
  autoNotifyReportsAndSos: boolean;
}

export interface AdminNotificationEvent {
  id: string;
  eventType: 'NEW_USER' | 'REPORT' | 'SUPPORT' | 'SOS';
  title: string;
  body: string;
  senderName: string;
  senderWhatsapp?: string;
  senderEmail?: string;
  createdAt: string;
}

export interface CloudDirectChatMessage {
  id: string;
  senderId: string;
  senderCallsign: string;
  recipientId: string;
  text: string;
  messageBody?: string;
  channelType?: string;
  createdAt: string;
}

export interface CloudSharedState {
  couriers: Record<string, CloudCourierPresence>;
  approvalRequests: CloudApprovalRequest[];
  approvalRequestsMap: Record<string, CloudApprovalRequest>;
  approvalDecisionsByName: Record<string, CourierApprovalStatus>;
  crosswalks: Record<string, AmaranteCrosswalkPoint>;
  passadeiras: AmaranteCrosswalkPoint[];
  walkieMessages: WalkieMessage[];
  directMessages: CloudDirectChatMessage[];
  roadHazards: RoadHazardPin[];
  adminNotifications?: AdminNotificationEvent[];
  adminConfig?: AdminNotificationConfig;
  lastUpdatedMs: number;
}

export type CloudSharedStateSnapshot = CloudSharedState;

type CloudPacketType =
  | 'SYNC_COURIER'
  | 'APPROVAL_UPDATE'
  | 'COURIER_PRESENCE'
  | 'APPROVAL_REQUEST'
  | 'ADMIN_APPROVAL_DECISION'
  | 'PEER_DISCOVERY_PING'
  | 'CROSSWALK_TAUGHT'
  | 'WALKIE_MSG'
  | 'DIRECT_MSG'
  | 'ROAD_HAZARD'
  | 'COURIER_LOGOUT'
  | 'ADMIN_NOTIFICATION'
  | 'ADMIN_CONFIG_SYNC';

interface CloudSyncEnvelope {
  v?: 2;
  type: CloudPacketType;
  senderId?: string;
  ts?: number;
  timestamp?: number;
  payload?: unknown;
  courier?: CloudCourierPresence;
  courierId?: string;
  targetCourierId?: string;
  targetUsername?: string;
  approvalStatus?: CourierApprovalStatus;
  decision?: CourierApprovalStatus;
}

const DEFAULT_AMARANTE_LAT = 41.2704;
const DEFAULT_AMARANTE_LNG = -8.0818;

export const FOUNDER_ADMIN_COURIER_ID = 'courier_founder_presidente';

/**
 * STRICT ADMIN LOCK:
 * Only the founder account whose name/handle is strictly 'Presidente' (case-insensitive)
 * gets role: 'admin' and access to the Admin button/dashboard.
 */
export function isCourierAdminByName(name: string): boolean {
  const clean = (name || '')
    .replace(/\s*\(Tu\)\s*$/i, '')
    .trim()
    .toLowerCase();
  return clean === 'presidente';
}

export function generateUniqueCourierIdForName(name?: string): string {
  if (name && isCourierAdminByName(name)) {
    return FOUNDER_ADMIN_COURIER_ID;
  }
  const randomSuffix = Math.random().toString(36).slice(2, 7);
  return `courier_${Date.now()}_${randomSuffix}`;
}

export function normalizeAccountKey(rawNameOrId: string): string {
  return (rawNameOrId || '')
    .replace(/\s*\(Tu\)\s*$/i, '')
    .trim()
    .toLowerCase();
}

function getSafeAvatarForRelay(avatarUrl?: string): string | undefined {
  if (!avatarUrl) return undefined;
  // Keep relay packet well below ntfy's 4096-byte text message limit
  if (avatarUrl.length <= 750) {
    return avatarUrl;
  }
  return undefined;
}

export function loadCloudSharedState(): CloudSharedState {
  if (typeof window === 'undefined') {
    return {
      couriers: {},
      approvalRequests: [],
      approvalRequestsMap: {},
      approvalDecisionsByName: {},
      crosswalks: {},
      passadeiras: [],
      walkieMessages: [],
      directMessages: [],
      roadHazards: [],
      lastUpdatedMs: 0,
    };
  }
  try {
    const raw = window.localStorage.getItem(CLOUD_SHARED_STATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CloudSharedState>;
      const reqMap: Record<string, CloudApprovalRequest> =
        parsed.approvalRequestsMap && typeof parsed.approvalRequestsMap === 'object'
          ? parsed.approvalRequestsMap
          : {};
      if (Array.isArray(parsed.approvalRequests)) {
        parsed.approvalRequests.forEach((r) => {
          if (r && r.id) reqMap[r.id] = r;
        });
      } else if (parsed.approvalRequests && typeof parsed.approvalRequests === 'object') {
        Object.values(parsed.approvalRequests as Record<string, CloudApprovalRequest>).forEach(
          (r) => {
            if (r && r.id) reqMap[r.id] = r;
          }
        );
      }
      const cwMap: Record<string, AmaranteCrosswalkPoint> =
        parsed.crosswalks && typeof parsed.crosswalks === 'object'
          ? parsed.crosswalks
          : {};
      if (Array.isArray(parsed.passadeiras)) {
        parsed.passadeiras.forEach((cw) => {
          if (cw && cw.id) cwMap[cw.id] = cw;
        });
      }
      return {
        couriers:
          parsed.couriers && typeof parsed.couriers === 'object' ? parsed.couriers : {},
        approvalRequestsMap: reqMap,
        approvalRequests: Object.values(reqMap),
        approvalDecisionsByName:
          parsed.approvalDecisionsByName &&
          typeof parsed.approvalDecisionsByName === 'object'
            ? parsed.approvalDecisionsByName
            : {},
        crosswalks: cwMap,
        passadeiras: Object.values(cwMap),
        walkieMessages: Array.isArray(parsed.walkieMessages)
          ? parsed.walkieMessages.slice(-40)
          : [],
        directMessages: Array.isArray(parsed.directMessages)
          ? parsed.directMessages.slice(-80)
          : [],
        roadHazards: Array.isArray(parsed.roadHazards)
          ? parsed.roadHazards.slice(0, 30)
          : [],
        lastUpdatedMs: Number(parsed.lastUpdatedMs || 0),
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    couriers: {},
    approvalRequests: [],
    approvalRequestsMap: {},
    approvalDecisionsByName: {},
    crosswalks: {},
    passadeiras: [],
    walkieMessages: [],
    directMessages: [],
    roadHazards: [],
    lastUpdatedMs: 0,
  };
}

let inMemoryCloudState: CloudSharedState = loadCloudSharedState();
const stateListeners = new Set<(state: CloudSharedState) => void>();
let lastDiscoveryReplyMs = 0;
let localIdentityProvider: (() => void | {
  presence: CloudCourierPresence | null;
  accounts: CloudApprovalRequest[];
}) | null = null;

function persistAndNotifyCloudState(): void {
  inMemoryCloudState.approvalRequests = Object.values(
    inMemoryCloudState.approvalRequestsMap
  );
  inMemoryCloudState.passadeiras = Object.values(inMemoryCloudState.crosswalks);
  inMemoryCloudState.lastUpdatedMs = Date.now();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        CLOUD_SHARED_STATE_STORAGE_KEY,
        JSON.stringify(inMemoryCloudState)
      );
    } catch {
      // ignore storage errors
    }
    try {
      window.dispatchEvent(
        new CustomEvent('buddy-cloud-sync-updated', {
          detail: inMemoryCloudState,
        })
      );
    } catch {
      // ignore
    }
  }
  stateListeners.forEach((cb) => {
    try {
      cb(inMemoryCloudState);
    } catch {
      // ignore listener error
    }
  });
}

export function getCloudSharedStateSnapshot(): CloudSharedState {
  inMemoryCloudState.approvalRequests = Object.values(
    inMemoryCloudState.approvalRequestsMap
  );
  inMemoryCloudState.passadeiras = Object.values(inMemoryCloudState.crosswalks);
  return inMemoryCloudState;
}

export function subscribeToCloudSharedState(
  listener: (state: CloudSharedState) => void
): () => void {
  stateListeners.add(listener);
  return () => {
    stateListeners.delete(listener);
  };
}

export function registerLocalCloudIdentityProvider(
  provider: () => void | {
    presence: CloudCourierPresence | null;
    accounts: CloudApprovalRequest[];
  }
): void {
  localIdentityProvider = provider;
}

async function postPacketToNtfyTopic(
  topic: string,
  envelope: CloudSyncEnvelope
): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
  try {
    const bodyStr = JSON.stringify(envelope);
    if (bodyStr.length > 3900) {
      return false;
    }
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: bodyStr,
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function resolveApprovalStatusForCourier(
  courierId: string,
  courierName: string,
  fallbackStatus?: CourierApprovalStatus
): CourierApprovalStatus {
  if (isCourierAdminByName(courierName)) {
    return 'approved';
  }
  const byId = inMemoryCloudState.approvalRequestsMap[courierId]?.approvalStatus;
  if (byId) return byId;
  const nameKey = normalizeAccountKey(courierName);
  if (nameKey && inMemoryCloudState.approvalDecisionsByName[nameKey]) {
    return inMemoryCloudState.approvalDecisionsByName[nameKey];
  }
  return fallbackStatus || 'pending';
}

export type CourierPresenceInput =
  | CloudCourierPresence
  | {
      profile: RealCourierMapProfile | SupabaseCourierRow;
      status?: CourierLivePresenceStatus;
      approvalStatus?: CourierApprovalStatus;
      heading?: number | null;
      speed?: number;
    };

export async function publishCourierPresenceToCloud(
  input: CourierPresenceInput
): Promise<void> {
  let presence: CloudCourierPresence;
  if ('profile' in input) {
    const p = input.profile;
    const role: CourierCloudRole = isCourierAdminByName(p.name) ? 'admin' : 'courier';
    const status: CourierLivePresenceStatus =
      input.status ||
      (p.has_order
        ? 'busy'
        : p.status === 'Pausa'
          ? 'paused'
          : 'online');
    const approvalStatus = resolveApprovalStatusForCourier(
      p.id,
      p.name,
      input.approvalStatus || (role === 'admin' ? 'approved' : 'pending')
    );
    presence = {
      id: p.id,
      name: p.name.trim(),
      role,
      vehicle: p.vehicle || 'Mota 125cc',
      platforms:
        p.active_platforms && p.active_platforms.length > 0
          ? p.active_platforms
          : ['Uber Eats', 'Glovo'],
      zone: p.zone || 'Amarante Centro / São Gonçalo',
      status,
      approvalStatus,
      lat: Number.isFinite(p.lat) && p.lat !== 0 ? p.lat : DEFAULT_AMARANTE_LAT,
      lng: Number.isFinite(p.lng) && p.lng !== 0 ? p.lng : DEFAULT_AMARANTE_LNG,
      heading: input.heading ?? null,
      speed: input.speed ?? 0,
      avatar: p.avatar_url,
      deviceModel: p.device_model,
      screenAspectRatio: p.screen_aspect_ratio,
      lastSeen: new Date().toISOString(),
    };
  } else {
    presence = input;
  }

  if (!presence.id || !presence.name.trim()) return;

  const isFounderAdmin = isCourierAdminByName(presence.name);
  const effectiveId = isFounderAdmin ? FOUNDER_ADMIN_COURIER_ID : presence.id;
  const existingCourier = inMemoryCloudState.couriers[effectiveId];
  const existingReq = inMemoryCloudState.approvalRequestsMap[effectiveId];

  const resolvedApproval = resolveApprovalStatusForCourier(
    effectiveId,
    presence.name,
    isFounderAdmin ? 'approved' : presence.approvalStatus || 'pending'
  );

  const cleanPresence: CloudCourierPresence = {
    ...presence,
    id: effectiveId,
    name: presence.name.trim(),
    role: isFounderAdmin ? 'admin' : 'courier',
    approvalStatus: resolvedApproval,
    lat:
      Number.isFinite(presence.lat) && presence.lat !== 0
        ? Number(presence.lat.toFixed(6))
        : DEFAULT_AMARANTE_LAT,
    lng:
      Number.isFinite(presence.lng) && presence.lng !== 0
        ? Number(presence.lng.toFixed(6))
        : DEFAULT_AMARANTE_LNG,
    avatar: getSafeAvatarForRelay(presence.avatar),
    whatsapp:
      presence.whatsapp ?? existingCourier?.whatsapp ?? existingReq?.whatsapp,
    email: presence.email ?? existingCourier?.email ?? existingReq?.email,
    optInWhatsapp:
      presence.optInWhatsapp ??
      existingCourier?.optInWhatsapp ??
      existingReq?.optInWhatsapp,
    optInEmail:
      presence.optInEmail ??
      existingCourier?.optInEmail ??
      existingReq?.optInEmail,
    lastSeen: new Date().toISOString(),
  };

  inMemoryCloudState.couriers[cleanPresence.id] = cleanPresence;

  // Deduplicate any older entry with the same normalized username but a legacy acc-* ID
  const cleanNameKey = normalizeAccountKey(cleanPresence.name);
  Object.keys(inMemoryCloudState.approvalRequestsMap).forEach((k) => {
    const item = inMemoryCloudState.approvalRequestsMap[k];
    if (
      k !== cleanPresence.id &&
      item &&
      normalizeAccountKey(item.username) === cleanNameKey
    ) {
      delete inMemoryCloudState.approvalRequestsMap[k];
    }
  });
  Object.keys(inMemoryCloudState.couriers).forEach((k) => {
    const item = inMemoryCloudState.couriers[k];
    if (
      k !== cleanPresence.id &&
      item &&
      normalizeAccountKey(item.name) === cleanNameKey
    ) {
      delete inMemoryCloudState.couriers[k];
    }
  });

  const reqRecord: CloudApprovalRequest = {
    id: cleanPresence.id,
    username: cleanPresence.name,
    emailOrPhone:
      existingReq?.emailOrPhone ||
      cleanPresence.whatsapp ||
      cleanPresence.email ||
      cleanPresence.name,
    whatsapp: cleanPresence.whatsapp,
    email: cleanPresence.email,
    optInWhatsapp: cleanPresence.optInWhatsapp,
    optInEmail: cleanPresence.optInEmail,
    vehicle: cleanPresence.vehicle,
    platforms:
      cleanPresence.platforms && cleanPresence.platforms.length > 0
        ? cleanPresence.platforms
        : ['Uber Eats', 'Glovo'],
    zone: cleanPresence.zone || 'Amarante Centro / São Gonçalo',
    role: cleanPresence.role,
    approvalStatus: resolvedApproval,
    lat: cleanPresence.lat,
    lng: cleanPresence.lng,
    deviceModel: cleanPresence.deviceModel || existingReq?.deviceModel,
    createdAt: existingReq?.createdAt || cleanPresence.lastSeen,
    updatedAt: cleanPresence.lastSeen,
  };
  inMemoryCloudState.approvalRequestsMap[cleanPresence.id] = reqRecord;

  persistAndNotifyCloudState();

  const nowTs = Date.now();
  await postPacketToNtfyTopic(FLEET_SYNC_TOPIC, {
    v: 2,
    type: 'SYNC_COURIER',
    senderId: cleanPresence.id,
    ts: nowTs,
    timestamp: nowTs,
    courier: cleanPresence,
    payload: cleanPresence,
  });
}

export type CloudApprovalRequestInput = Omit<
  CloudApprovalRequest,
  'id' | 'role' | 'approvalStatus' | 'lat' | 'lng' | 'createdAt' | 'updatedAt'
> & {
  id?: string;
  role?: CourierCloudRole;
  approvalStatus?: CourierApprovalStatus;
  lat?: number;
  lng?: number;
  createdAt?: string;
  updatedAt?: string;
};

export async function publishAccountRegistrationToCloud(
  account: CloudApprovalRequestInput
): Promise<void> {
  if (!account.username || !account.username.trim()) return;
  const cleanName = account.username.trim();
  const isFounderAdmin = isCourierAdminByName(cleanName);
  const cleanNameKey = normalizeAccountKey(cleanName);

  // Reuse existing courier ID for this username if already known, so we never duplicate
  const existingCourierMatch = Object.values(inMemoryCloudState.couriers).find(
    (c) => c && normalizeAccountKey(c.name) === cleanNameKey
  );
  const existingReqMatch = Object.values(
    inMemoryCloudState.approvalRequestsMap
  ).find((r) => r && normalizeAccountKey(r.username) === cleanNameKey);

  const id = isFounderAdmin
    ? FOUNDER_ADMIN_COURIER_ID
    : account.id ||
      existingCourierMatch?.id ||
      existingReqMatch?.id ||
      `courier_${Date.now()}_${cleanNameKey.replace(/[^a-z0-9]/g, '').slice(0, 6) || 'user'}`;

  const resolvedApproval = resolveApprovalStatusForCourier(
    id,
    cleanName,
    isFounderAdmin ? 'approved' : account.approvalStatus || 'pending'
  );

  const existingLat =
    existingCourierMatch &&
    typeof existingCourierMatch.lat === 'number' &&
    Number.isFinite(existingCourierMatch.lat) &&
    existingCourierMatch.lat !== 0
      ? existingCourierMatch.lat
      : existingReqMatch &&
          typeof existingReqMatch.lat === 'number' &&
          Number.isFinite(existingReqMatch.lat) &&
          existingReqMatch.lat !== 0
        ? existingReqMatch.lat
        : null;

  const existingLng =
    existingCourierMatch &&
    typeof existingCourierMatch.lng === 'number' &&
    Number.isFinite(existingCourierMatch.lng) &&
    existingCourierMatch.lng !== 0
      ? existingCourierMatch.lng
      : existingReqMatch &&
          typeof existingReqMatch.lng === 'number' &&
          Number.isFinite(existingReqMatch.lng) &&
          existingReqMatch.lng !== 0
        ? existingReqMatch.lng
        : null;

  const cleanReq: CloudApprovalRequest = {
    ...account,
    id,
    username: cleanName,
    role: isFounderAdmin ? 'admin' : 'courier',
    approvalStatus: resolvedApproval,
    lat:
      existingLat !== null
        ? existingLat
        : typeof account.lat === 'number' &&
            Number.isFinite(account.lat) &&
            account.lat !== 0
          ? Number(account.lat.toFixed(6))
          : DEFAULT_AMARANTE_LAT,
    lng:
      existingLng !== null
        ? existingLng
        : typeof account.lng === 'number' &&
            Number.isFinite(account.lng) &&
            account.lng !== 0
          ? Number(account.lng.toFixed(6))
          : DEFAULT_AMARANTE_LNG,
    createdAt: account.createdAt || new Date().toISOString(),
    updatedAt: account.updatedAt || new Date().toISOString(),
  };

  Object.keys(inMemoryCloudState.approvalRequestsMap).forEach((k) => {
    const item = inMemoryCloudState.approvalRequestsMap[k];
    if (k !== id && item && normalizeAccountKey(item.username) === cleanNameKey) {
      delete inMemoryCloudState.approvalRequestsMap[k];
    }
  });

  inMemoryCloudState.approvalRequestsMap[id] = cleanReq;

  const courierObj: CloudCourierPresence = {
    id,
    name: cleanName,
    role: isFounderAdmin ? 'admin' : 'courier',
    vehicle: String(cleanReq.vehicle || 'Mota 125cc'),
    platforms:
      Array.isArray(cleanReq.platforms) && cleanReq.platforms.length > 0
        ? cleanReq.platforms
        : ['Uber Eats', 'Glovo'],
    zone: String(cleanReq.zone || 'Amarante Centro / São Gonçalo'),
    status: inMemoryCloudState.couriers[id]?.status || 'online',
    approvalStatus: resolvedApproval,
    lat: cleanReq.lat,
    lng: cleanReq.lng,
    deviceModel: cleanReq.deviceModel,
    whatsapp: cleanReq.whatsapp,
    email: cleanReq.email,
    optInWhatsapp: cleanReq.optInWhatsapp,
    optInEmail: cleanReq.optInEmail,
    lastSeen: cleanReq.updatedAt,
  };
  inMemoryCloudState.couriers[id] = courierObj;

  persistAndNotifyCloudState();

  const nowTs = Date.now();
  await Promise.all([
    postPacketToNtfyTopic(FLEET_SYNC_TOPIC, {
      v: 2,
      type: 'SYNC_COURIER',
      senderId: id,
      ts: nowTs,
      timestamp: nowTs,
      courier: courierObj,
      payload: cleanReq,
    }),
    postPacketToNtfyTopic(ACCOUNTS_SYNC_TOPIC, {
      v: 2,
      type: 'APPROVAL_REQUEST',
      senderId: id,
      ts: nowTs,
      timestamp: nowTs,
      payload: cleanReq,
    }),
  ]);
}

export async function publishAdminApprovalDecisionToCloud(params: {
  targetCourierId?: string;
  courierId?: string;
  targetUsername?: string;
  username?: string;
  decision?: CourierApprovalStatus;
  approvalStatus?: CourierApprovalStatus;
  adminSenderId?: string;
}): Promise<void> {
  const effectiveCourierId = params.targetCourierId || params.courierId;
  const effectiveUsername = params.targetUsername || params.username || '';
  const effectiveDecision: CourierApprovalStatus =
    params.decision || params.approvalStatus || 'approved';

  const cleanNameKey = normalizeAccountKey(effectiveUsername);
  if (cleanNameKey) {
    inMemoryCloudState.approvalDecisionsByName[cleanNameKey] = effectiveDecision;
  }

  Object.values(inMemoryCloudState.approvalRequestsMap).forEach((req) => {
    if (
      (effectiveCourierId && req.id === effectiveCourierId) ||
      (cleanNameKey && normalizeAccountKey(req.username) === cleanNameKey)
    ) {
      req.approvalStatus = effectiveDecision;
      req.updatedAt = new Date().toISOString();
    }
  });

  Object.values(inMemoryCloudState.couriers).forEach((c) => {
    if (
      (effectiveCourierId && c.id === effectiveCourierId) ||
      (cleanNameKey && normalizeAccountKey(c.name) === cleanNameKey)
    ) {
      c.approvalStatus = effectiveDecision;
    }
  });

  persistAndNotifyCloudState();

  const nowTs = Date.now();
  const decisionPayload = {
    targetCourierId: effectiveCourierId,
    courierId: effectiveCourierId,
    targetUsername: effectiveUsername.trim(),
    approvalStatus: effectiveDecision,
    decision: effectiveDecision,
    updatedAt: new Date().toISOString(),
  };

  await Promise.all([
    postPacketToNtfyTopic(FLEET_SYNC_TOPIC, {
      v: 2,
      type: 'APPROVAL_UPDATE',
      senderId: params.adminSenderId || FOUNDER_ADMIN_COURIER_ID,
      ts: nowTs,
      timestamp: nowTs,
      courierId: effectiveCourierId,
      targetCourierId: effectiveCourierId,
      targetUsername: effectiveUsername.trim(),
      approvalStatus: effectiveDecision,
      decision: effectiveDecision,
      payload: decisionPayload,
    }),
    postPacketToNtfyTopic(ACCOUNTS_SYNC_TOPIC, {
      v: 2,
      type: 'ADMIN_APPROVAL_DECISION',
      senderId: params.adminSenderId || FOUNDER_ADMIN_COURIER_ID,
      ts: nowTs,
      timestamp: nowTs,
      payload: decisionPayload,
    }),
  ]);
}

export async function publishCourierLogoutToCloud(
  courierId: string
): Promise<void> {
  if (!courierId) return;
  delete inMemoryCloudState.couriers[courierId];
  persistAndNotifyCloudState();

  await postPacketToNtfyTopic(FLEET_SYNC_TOPIC, {
    v: 2,
    type: 'COURIER_LOGOUT',
    senderId: courierId,
    ts: Date.now(),
    timestamp: Date.now(),
    payload: { id: courierId },
  });
}

export function removeCourierFromCloudState(courierId: string): void {
  void publishCourierLogoutToCloud(courierId);
}

export function findExistingCourierInCloudState(
  nameOrCallsign: string
): SupabaseCourierRow | null {
  const cleanKey = normalizeAccountKey(nameOrCallsign);
  if (!cleanKey) return null;
  const rows = getActiveCloudCourierRows();
  return rows.find((r) => normalizeAccountKey(r.name) === cleanKey) || null;
}

export async function publishPeerDiscoveryPing(
  myDeviceId = 'local_device'
): Promise<void> {
  await postPacketToNtfyTopic(FLEET_SYNC_TOPIC, {
    v: 2,
    type: 'PEER_DISCOVERY_PING',
    senderId: myDeviceId,
    ts: Date.now(),
    timestamp: Date.now(),
    payload: { requesterId: myDeviceId },
  });
}

export async function publishTaughtCrosswalkToCloud(
  crosswalk: AmaranteCrosswalkPoint,
  senderId = 'local_device'
): Promise<void> {
  inMemoryCloudState.crosswalks[crosswalk.id] = crosswalk;
  persistAndNotifyCloudState();

  await postPacketToNtfyTopic(FLEET_SYNC_TOPIC, {
    v: 2,
    type: 'CROSSWALK_TAUGHT',
    senderId,
    ts: Date.now(),
    timestamp: Date.now(),
    payload: crosswalk,
  });
}

export function removeCrosswalkFromCloud(crosswalkId: string): void {
  if (!crosswalkId) return;
  if (inMemoryCloudState.crosswalks[crosswalkId]) {
    delete inMemoryCloudState.crosswalks[crosswalkId];
    persistAndNotifyCloudState();
  }
}

export async function publishWalkieMessageToCloud(
  msg: WalkieMessage,
  senderId = 'local_device'
): Promise<void> {
  if (!inMemoryCloudState.walkieMessages.some((m) => m.id === msg.id)) {
    inMemoryCloudState.walkieMessages = [
      ...inMemoryCloudState.walkieMessages.slice(-39),
      msg,
    ];
    persistAndNotifyCloudState();
  }

  await postPacketToNtfyTopic(FLEET_SYNC_TOPIC, {
    v: 2,
    type: 'WALKIE_MSG',
    senderId,
    ts: Date.now(),
    timestamp: Date.now(),
    payload: msg,
  });
}

export async function publishDirectMessageToCloud(
  dm: Omit<CloudDirectChatMessage, 'id' | 'text' | 'createdAt'> & {
    id?: string;
    text?: string;
    createdAt?: string;
  }
): Promise<void> {
  const normalizedDm: CloudDirectChatMessage = {
    ...dm,
    id: dm.id || `dm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: dm.text || dm.messageBody || '',
    messageBody: dm.messageBody || dm.text || '',
    channelType: dm.channelType || 'DIRECT_1ON1',
    createdAt: dm.createdAt || new Date().toISOString(),
  };
  if (!inMemoryCloudState.directMessages.some((m) => m.id === normalizedDm.id)) {
    inMemoryCloudState.directMessages = [
      ...inMemoryCloudState.directMessages.slice(-79),
      normalizedDm,
    ];
    persistAndNotifyCloudState();
  }

  await postPacketToNtfyTopic(FLEET_SYNC_TOPIC, {
    v: 2,
    type: 'DIRECT_MSG',
    senderId: normalizedDm.senderId,
    ts: Date.now(),
    timestamp: Date.now(),
    payload: normalizedDm,
  });
}

export async function publishRoadHazardToCloud(
  hazard: RoadHazardPin,
  senderId = 'local_device'
): Promise<void> {
  if (!inMemoryCloudState.roadHazards.some((h) => h.id === hazard.id)) {
    inMemoryCloudState.roadHazards = [
      hazard,
      ...inMemoryCloudState.roadHazards.slice(0, 29),
    ];
    persistAndNotifyCloudState();
  }

  await postPacketToNtfyTopic(FLEET_SYNC_TOPIC, {
    v: 2,
    type: 'ROAD_HAZARD',
    senderId,
    ts: Date.now(),
    timestamp: Date.now(),
    payload: hazard,
  });
}

function ingestEnvelope(
  envelope: CloudSyncEnvelope,
  myDeviceId: string
): boolean {
  if (!envelope || !envelope.type) return false;
  let stateChanged = false;
  const packetTs = Number(envelope.timestamp || envelope.ts || Date.now());

  switch (envelope.type) {
    case 'SYNC_COURIER':
    case 'COURIER_PRESENCE': {
      const rawCourier = (envelope.courier ||
        envelope.payload) as Partial<CloudCourierPresence> & {
        username?: string;
        emailOrPhone?: string;
      };
      const resolvedName = (rawCourier?.name || rawCourier?.username || '').trim();
      if (!rawCourier || !resolvedName) {
        break;
      }
      const isFounder = isCourierAdminByName(resolvedName);
      const resolvedId = isFounder
        ? FOUNDER_ADMIN_COURIER_ID
        : rawCourier.id ||
          envelope.senderId ||
          `courier_${packetTs}_${normalizeAccountKey(resolvedName).replace(/[^a-z0-9]/g, '').slice(0, 6)}`;

      const resolvedApproval = resolveApprovalStatusForCourier(
        resolvedId,
        resolvedName,
        isFounder ? 'approved' : rawCourier.approvalStatus || 'pending'
      );
      const existing = inMemoryCloudState.couriers[resolvedId];
      const existingMs = existing?.lastSeen ? Date.parse(existing.lastSeen) : 0;
      const incomingMs = rawCourier.lastSeen
        ? Date.parse(rawCourier.lastSeen)
        : packetTs;

      if (!existing || incomingMs >= existingMs - 5000) {
        const cleanNameKey = normalizeAccountKey(resolvedName);
        Object.keys(inMemoryCloudState.couriers).forEach((k) => {
          const item = inMemoryCloudState.couriers[k];
          if (
            k !== resolvedId &&
            item &&
            normalizeAccountKey(item.name) === cleanNameKey
          ) {
            delete inMemoryCloudState.couriers[k];
          }
        });
        Object.keys(inMemoryCloudState.approvalRequestsMap).forEach((k) => {
          const item = inMemoryCloudState.approvalRequestsMap[k];
          if (
            k !== resolvedId &&
            item &&
            normalizeAccountKey(item.username) === cleanNameKey
          ) {
            delete inMemoryCloudState.approvalRequestsMap[k];
          }
        });

        inMemoryCloudState.couriers[resolvedId] = {
          ...existing,
          ...rawCourier,
          id: resolvedId,
          name: resolvedName,
          role: isFounder ? 'admin' : 'courier',
          vehicle: rawCourier.vehicle || existing?.vehicle || 'Mota 125cc',
          platforms:
            Array.isArray(rawCourier.platforms) && rawCourier.platforms.length > 0
              ? rawCourier.platforms
              : existing?.platforms || ['Uber Eats', 'Glovo'],
          zone:
            rawCourier.zone ||
            existing?.zone ||
            'Amarante Centro / São Gonçalo',
          status: rawCourier.status || existing?.status || 'online',
          approvalStatus: resolvedApproval,
          lat:
            Number.isFinite(rawCourier.lat) && Number(rawCourier.lat) !== 0
              ? Number(rawCourier.lat)
              : existing?.lat || DEFAULT_AMARANTE_LAT,
          lng:
            Number.isFinite(rawCourier.lng) && Number(rawCourier.lng) !== 0
              ? Number(rawCourier.lng)
              : existing?.lng || DEFAULT_AMARANTE_LNG,
          heading: rawCourier.heading ?? existing?.heading ?? null,
          speed: rawCourier.speed ?? existing?.speed ?? 0,
          avatar: rawCourier.avatar || existing?.avatar,
          deviceModel: rawCourier.deviceModel || existing?.deviceModel,
          lastSeen: rawCourier.lastSeen || new Date(packetTs).toISOString(),
        };

        const prevReq = inMemoryCloudState.approvalRequestsMap[resolvedId];
        inMemoryCloudState.approvalRequestsMap[resolvedId] = {
          id: resolvedId,
          username: resolvedName,
          emailOrPhone:
            rawCourier.emailOrPhone || prevReq?.emailOrPhone || resolvedName,
          vehicle: rawCourier.vehicle || prevReq?.vehicle || 'Mota 125cc',
          platforms:
            Array.isArray(rawCourier.platforms) && rawCourier.platforms.length > 0
              ? rawCourier.platforms
              : prevReq?.platforms || ['Uber Eats', 'Glovo'],
          zone:
            rawCourier.zone ||
            prevReq?.zone ||
            'Amarante Centro / São Gonçalo',
          role: isFounder ? 'admin' : 'courier',
          approvalStatus: resolvedApproval,
          lat: inMemoryCloudState.couriers[resolvedId].lat,
          lng: inMemoryCloudState.couriers[resolvedId].lng,
          deviceModel: rawCourier.deviceModel || prevReq?.deviceModel,
          createdAt:
            prevReq?.createdAt ||
            rawCourier.lastSeen ||
            new Date(packetTs).toISOString(),
          updatedAt: rawCourier.lastSeen || new Date(packetTs).toISOString(),
        };
        stateChanged = true;
      }
      break;
    }

    case 'APPROVAL_REQUEST': {
      const req = envelope.payload as CloudApprovalRequest;
      if (!req || typeof req.username !== 'string' || !req.username.trim()) {
        break;
      }
      const cleanName = req.username.trim();
      const isFounder = isCourierAdminByName(cleanName);
      const cleanNameKey = normalizeAccountKey(cleanName);
      const existingCourierMatch = Object.values(
        inMemoryCloudState.couriers
      ).find((c) => c && normalizeAccountKey(c.name) === cleanNameKey);

      const reqId = isFounder
        ? FOUNDER_ADMIN_COURIER_ID
        : existingCourierMatch?.id ||
          req.id ||
          `courier_${packetTs}_${cleanNameKey.replace(/[^a-z0-9]/g, '').slice(0, 6)}`;

      const resolvedApproval = resolveApprovalStatusForCourier(
        reqId,
        cleanName,
        isFounder ? 'approved' : req.approvalStatus || 'pending'
      );

      Object.keys(inMemoryCloudState.approvalRequestsMap).forEach((k) => {
        const item = inMemoryCloudState.approvalRequestsMap[k];
        if (k !== reqId && item && normalizeAccountKey(item.username) === cleanNameKey) {
          delete inMemoryCloudState.approvalRequestsMap[k];
        }
      });

      const prev = inMemoryCloudState.approvalRequestsMap[reqId];
      inMemoryCloudState.approvalRequestsMap[reqId] = {
        ...prev,
        ...req,
        id: reqId,
        username: cleanName,
        role: isFounder ? 'admin' : 'courier',
        approvalStatus: resolvedApproval,
        lat:
          Number.isFinite(req.lat) && req.lat !== 0
            ? Number(req.lat)
            : prev?.lat || DEFAULT_AMARANTE_LAT,
        lng:
          Number.isFinite(req.lng) && req.lng !== 0
            ? Number(req.lng)
            : prev?.lng || DEFAULT_AMARANTE_LNG,
        createdAt: prev?.createdAt || req.createdAt || new Date().toISOString(),
        updatedAt: req.updatedAt || new Date(packetTs).toISOString(),
      };

      if (
        !inMemoryCloudState.couriers[reqId] &&
        Date.now() - packetTs <= 2 * 60 * 60 * 1000
      ) {
        inMemoryCloudState.couriers[reqId] = {
          id: reqId,
          name: cleanName,
          role: isFounder ? 'admin' : 'courier',
          vehicle: String(req.vehicle || 'Mota 125cc'),
          platforms:
            Array.isArray(req.platforms) && req.platforms.length > 0
              ? req.platforms
              : ['Uber Eats', 'Glovo'],
          zone: String(req.zone || 'Amarante Centro / São Gonçalo'),
          status: 'online',
          approvalStatus: resolvedApproval,
          lat:
            Number.isFinite(req.lat) && req.lat !== 0
              ? Number(req.lat)
              : DEFAULT_AMARANTE_LAT,
          lng:
            Number.isFinite(req.lng) && req.lng !== 0
              ? Number(req.lng)
              : DEFAULT_AMARANTE_LNG,
          deviceModel: req.deviceModel,
          lastSeen: req.updatedAt || new Date(packetTs).toISOString(),
        };
      }
      stateChanged = true;
      break;
    }

    case 'APPROVAL_UPDATE':
    case 'ADMIN_APPROVAL_DECISION': {
      const payloadObj = (envelope.payload || {}) as {
        targetCourierId?: string;
        courierId?: string;
        targetUsername?: string;
        decision?: CourierApprovalStatus;
        approvalStatus?: CourierApprovalStatus;
      };
      const targetId =
        envelope.courierId ||
        envelope.targetCourierId ||
        payloadObj.courierId ||
        payloadObj.targetCourierId;
      const targetUser =
        envelope.targetUsername || payloadObj.targetUsername || '';
      const decisionVal =
        envelope.approvalStatus ||
        envelope.decision ||
        payloadObj.approvalStatus ||
        payloadObj.decision;

      if (!decisionVal) break;
      const nameKey = normalizeAccountKey(targetUser);
      if (nameKey) {
        inMemoryCloudState.approvalDecisionsByName[nameKey] = decisionVal;
      }
      Object.values(inMemoryCloudState.approvalRequestsMap).forEach((r) => {
        if (
          (targetId && r.id === targetId) ||
          (nameKey && normalizeAccountKey(r.username) === nameKey)
        ) {
          r.approvalStatus = decisionVal;
          r.updatedAt = new Date().toISOString();
        }
      });
      Object.values(inMemoryCloudState.couriers).forEach((c) => {
        if (
          (targetId && c.id === targetId) ||
          (nameKey && normalizeAccountKey(c.name) === nameKey)
        ) {
          c.approvalStatus = decisionVal;
        }
      });
      stateChanged = true;
      break;
    }

    case 'COURIER_LOGOUT': {
      const out = envelope.payload as { id?: string };
      if (out?.id && inMemoryCloudState.couriers[out.id]) {
        delete inMemoryCloudState.couriers[out.id];
        stateChanged = true;
      }
      break;
    }

    case 'PEER_DISCOVERY_PING': {
      if (
        envelope.senderId &&
        envelope.senderId !== myDeviceId &&
        Date.now() - packetTs < 30000 &&
        Date.now() - lastDiscoveryReplyMs > 3500
      ) {
        lastDiscoveryReplyMs = Date.now();
        broadcastLocalStorageAccountsAndProfileNow();
        if (localIdentityProvider) {
          const localData = localIdentityProvider();
          if (localData && typeof localData === 'object') {
            if (localData.presence) {
              void publishCourierPresenceToCloud(localData.presence);
            }
            if (Array.isArray(localData.accounts)) {
              localData.accounts.forEach((acc) => {
                void publishAccountRegistrationToCloud(acc);
              });
            }
          }
        }
      }
      break;
    }

    case 'CROSSWALK_TAUGHT': {
      const cw = envelope.payload as AmaranteCrosswalkPoint;
      if (
        cw &&
        cw.id &&
        typeof cw.lat === 'number' &&
        typeof cw.lng === 'number' &&
        !inMemoryCloudState.crosswalks[cw.id]
      ) {
        inMemoryCloudState.crosswalks[cw.id] = cw;
        stateChanged = true;
      }
      break;
    }

    case 'WALKIE_MSG': {
      const wm = envelope.payload as WalkieMessage;
      if (
        wm &&
        wm.id &&
        typeof wm.text === 'string' &&
        !inMemoryCloudState.walkieMessages.some((m) => m.id === wm.id)
      ) {
        inMemoryCloudState.walkieMessages = [
          ...inMemoryCloudState.walkieMessages.slice(-39),
          wm,
        ];
        stateChanged = true;
      }
      break;
    }

    case 'DIRECT_MSG': {
      const dm = envelope.payload as CloudDirectChatMessage;
      if (
        dm &&
        dm.id &&
        typeof (dm.text || dm.messageBody) === 'string' &&
        !inMemoryCloudState.directMessages.some((m) => m.id === dm.id)
      ) {
        const normalizedDm: CloudDirectChatMessage = {
          ...dm,
          text: dm.text || dm.messageBody || '',
          messageBody: dm.messageBody || dm.text || '',
        };
        inMemoryCloudState.directMessages = [
          ...inMemoryCloudState.directMessages.slice(-79),
          normalizedDm,
        ];
        stateChanged = true;
      }
      break;
    }

    case 'ROAD_HAZARD': {
      const hz = envelope.payload as RoadHazardPin;
      if (
        hz &&
        hz.id &&
        !inMemoryCloudState.roadHazards.some((h) => h.id === hz.id)
      ) {
        inMemoryCloudState.roadHazards = [
          hz,
          ...inMemoryCloudState.roadHazards.slice(0, 29),
        ];
        stateChanged = true;
      }
      break;
    }

    case 'ADMIN_NOTIFICATION': {
      const ev = envelope.payload as AdminNotificationEvent;
      if (ev && ev.id && ev.title) {
        const list = Array.isArray(inMemoryCloudState.adminNotifications)
          ? inMemoryCloudState.adminNotifications
          : [];
        if (!list.some((item) => item.id === ev.id)) {
          inMemoryCloudState.adminNotifications = [ev, ...list.slice(0, 39)];
          stateChanged = true;
        }
      }
      break;
    }

    case 'ADMIN_CONFIG_SYNC': {
      const cfg = envelope.payload as AdminNotificationConfig;
      if (cfg && typeof cfg === 'object') {
        inMemoryCloudState.adminConfig = {
          adminWhatsapp: String(cfg.adminWhatsapp || ''),
          adminEmail: String(cfg.adminEmail || ''),
          autoNotifyNewUsers: cfg.autoNotifyNewUsers !== false,
          autoNotifyReportsAndSos: cfg.autoNotifyReportsAndSos !== false,
        };
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(
              'buddy_admin_notify_config_v1',
              JSON.stringify(inMemoryCloudState.adminConfig)
            );
          } catch {
            // ignore
          }
        }
        stateChanged = true;
      }
      break;
    }
  }

  return stateChanged;
}

export const ADMIN_NOTIFY_CONFIG_STORAGE_KEY = 'buddy_admin_notify_config_v1';

export function loadAdminNotificationConfig(): AdminNotificationConfig {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(ADMIN_NOTIFY_CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AdminNotificationConfig>;
        return {
          adminWhatsapp: String(parsed.adminWhatsapp || ''),
          adminEmail: String(parsed.adminEmail || ''),
          autoNotifyNewUsers: parsed.autoNotifyNewUsers !== false,
          autoNotifyReportsAndSos: parsed.autoNotifyReportsAndSos !== false,
        };
      }
    } catch {
      // ignore
    }
  }
  if (inMemoryCloudState.adminConfig) {
    return inMemoryCloudState.adminConfig;
  }
  return {
    adminWhatsapp: '+351',
    adminEmail: '',
    autoNotifyNewUsers: true,
    autoNotifyReportsAndSos: true,
  };
}

export async function saveAdminNotificationConfig(
  cfg: AdminNotificationConfig
): Promise<void> {
  const clean: AdminNotificationConfig = {
    adminWhatsapp: (cfg.adminWhatsapp || '').trim(),
    adminEmail: (cfg.adminEmail || '').trim(),
    autoNotifyNewUsers: cfg.autoNotifyNewUsers !== false,
    autoNotifyReportsAndSos: cfg.autoNotifyReportsAndSos !== false,
  };
  inMemoryCloudState.adminConfig = clean;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        ADMIN_NOTIFY_CONFIG_STORAGE_KEY,
        JSON.stringify(clean)
      );
    } catch {
      // ignore
    }
  }
  persistAndNotifyCloudState();
  await postPacketToNtfyTopic(FLEET_SYNC_TOPIC, {
    v: 2,
    type: 'ADMIN_CONFIG_SYNC',
    senderId: FOUNDER_ADMIN_COURIER_ID,
    ts: Date.now(),
    timestamp: Date.now(),
    payload: clean,
  });
}

export function buildWhatsAppDeepLink(phone: string, message: string): string {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  const normalizedPhone =
    digits.length === 9 ? `351${digits}` : digits.length >= 10 ? digits : '';
  const encodedText = encodeURIComponent(message);
  if (normalizedPhone) {
    return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

export function buildMailtoDeepLink(
  email: string,
  subject: string,
  body: string,
  bccList?: string[]
): string {
  const to = (email || '').trim();
  const params: string[] = [];
  if (bccList && bccList.length > 0) {
    params.push(`bcc=${encodeURIComponent(bccList.join(','))}`);
  }
  params.push(`subject=${encodeURIComponent(subject)}`);
  params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${encodeURIComponent(to)}?${params.join('&')}`;
}

export async function dispatchAdminNotificationEvent(
  input: Omit<AdminNotificationEvent, 'id' | 'createdAt'> & {
    id?: string;
    createdAt?: string;
  }
): Promise<AdminNotificationEvent> {
  const ev: AdminNotificationEvent = {
    id:
      input.id ||
      `adm_notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    eventType: input.eventType,
    title: input.title,
    body: input.body,
    senderName: input.senderName,
    senderWhatsapp: input.senderWhatsapp,
    senderEmail: input.senderEmail,
    createdAt: input.createdAt || new Date().toISOString(),
  };

  const list = Array.isArray(inMemoryCloudState.adminNotifications)
    ? inMemoryCloudState.adminNotifications
    : [];
  inMemoryCloudState.adminNotifications = [
    ev,
    ...list.filter((x) => x.id !== ev.id).slice(0, 39),
  ];
  persistAndNotifyCloudState();

  // 1. Broadcast real-time notification packet to Admin via Cloud Relay
  void postPacketToNtfyTopic(FLEET_SYNC_TOPIC, {
    v: 2,
    type: 'ADMIN_NOTIFICATION',
    senderId: ev.senderName,
    ts: Date.now(),
    timestamp: Date.now(),
    payload: ev,
  });

  // 2. If Admin configured an Email, also attempt a zero-config background email relay
  const adminCfg = loadAdminNotificationConfig();
  if (adminCfg.adminEmail && adminCfg.adminEmail.includes('@')) {
    try {
      void fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(adminCfg.adminEmail.trim())}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            _subject: `[Delivery Buddy Admin] ${ev.title}`,
            Tipo: ev.eventType,
            Estafeta: ev.senderName,
            WhatsApp: ev.senderWhatsapp || 'N/A',
            Email: ev.senderEmail || 'N/A',
            Mensagem: ev.body,
            Data: new Date(ev.createdAt).toLocaleString('pt-PT'),
          }),
        }
      ).catch(() => {
        // ignore if offline or unactivated
      });
    } catch {
      // ignore
    }
  }

  return ev;
}

export interface CourierContactOptInPreferences {
  whatsapp: string;
  email: string;
  optInWhatsapp: boolean;
  optInEmail: boolean;
}

export function getCourierContactAndOptInPreferences(
  courierNameOrId?: string
): CourierContactOptInPreferences {
  const cleanKey = normalizeAccountKey(courierNameOrId || '');
  if (typeof window !== 'undefined') {
    try {
      const rawContact = window.localStorage.getItem(
        `buddy_contact_optin_${cleanKey || 'default'}`
      );
      if (rawContact) {
        const parsed = JSON.parse(
          rawContact
        ) as Partial<CourierContactOptInPreferences>;
        return {
          whatsapp: String(parsed.whatsapp || ''),
          email: String(parsed.email || ''),
          optInWhatsapp: parsed.optInWhatsapp !== false,
          optInEmail: parsed.optInEmail !== false,
        };
      }
      const rawAccounts = window.localStorage.getItem('buddy_saved_accounts_v1');
      if (rawAccounts) {
        const parsedAccounts = JSON.parse(rawAccounts) as Array<{
          username?: string;
          whatsapp?: string;
          email?: string;
          optInWhatsapp?: boolean;
          optInEmail?: boolean;
        }>;
        const found = parsedAccounts.find(
          (a) => a && normalizeAccountKey(a.username || '') === cleanKey
        );
        if (found) {
          return {
            whatsapp: String(found.whatsapp || ''),
            email: String(found.email || ''),
            optInWhatsapp: found.optInWhatsapp !== false,
            optInEmail: found.optInEmail !== false,
          };
        }
      }
    } catch {
      // ignore
    }
  }
  const cloudCourier = Object.values(inMemoryCloudState.couriers).find(
    (c) =>
      c &&
      (c.id === courierNameOrId ||
        normalizeAccountKey(c.name) === cleanKey)
  );
  if (cloudCourier) {
    return {
      whatsapp: String(cloudCourier.whatsapp || ''),
      email: String(cloudCourier.email || ''),
      optInWhatsapp: cloudCourier.optInWhatsapp !== false,
      optInEmail: cloudCourier.optInEmail !== false,
    };
  }
  return {
    whatsapp: '',
    email: '',
    optInWhatsapp: true,
    optInEmail: true,
  };
}

export async function saveCourierContactAndOptInPreferences(params: {
  courierId: string;
  courierName: string;
  whatsapp: string;
  email: string;
  optInWhatsapp: boolean;
  optInEmail: boolean;
}): Promise<void> {
  const cleanKey = normalizeAccountKey(params.courierName || '');
  const cleanPrefs: CourierContactOptInPreferences = {
    whatsapp: (params.whatsapp || '').trim(),
    email: (params.email || '').trim(),
    optInWhatsapp: Boolean(params.optInWhatsapp),
    optInEmail: Boolean(params.optInEmail),
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        `buddy_contact_optin_${cleanKey || 'default'}`,
        JSON.stringify(cleanPrefs)
      );
      const rawAccounts = window.localStorage.getItem('buddy_saved_accounts_v1');
      if (rawAccounts) {
        const parsedAccounts = JSON.parse(rawAccounts) as Array<
          Record<string, unknown> & { username?: string }
        >;
        if (Array.isArray(parsedAccounts)) {
          const updated = parsedAccounts.map((acc) => {
            if (
              acc &&
              normalizeAccountKey(acc.username || '') === cleanKey
            ) {
              return {
                ...acc,
                whatsapp: cleanPrefs.whatsapp,
                email: cleanPrefs.email,
                optInWhatsapp: cleanPrefs.optInWhatsapp,
                optInEmail: cleanPrefs.optInEmail,
              };
            }
            return acc;
          });
          window.localStorage.setItem(
            'buddy_saved_accounts_v1',
            JSON.stringify(updated)
          );
        }
      }
    } catch {
      // ignore
    }
  }

  Object.values(inMemoryCloudState.couriers).forEach((c) => {
    if (
      c &&
      (c.id === params.courierId ||
        normalizeAccountKey(c.name) === cleanKey)
    ) {
      c.whatsapp = cleanPrefs.whatsapp;
      c.email = cleanPrefs.email;
      c.optInWhatsapp = cleanPrefs.optInWhatsapp;
      c.optInEmail = cleanPrefs.optInEmail;
    }
  });
  Object.values(inMemoryCloudState.approvalRequestsMap).forEach((r) => {
    if (
      r &&
      (r.id === params.courierId ||
        normalizeAccountKey(r.username) === cleanKey)
    ) {
      r.whatsapp = cleanPrefs.whatsapp;
      r.email = cleanPrefs.email;
      r.optInWhatsapp = cleanPrefs.optInWhatsapp;
      r.optInEmail = cleanPrefs.optInEmail;
    }
  });

  persistAndNotifyCloudState();
  broadcastLocalStorageAccountsAndProfileNow();
}

export function broadcastLocalStorageAccountsAndProfileNow(): void {
  if (typeof window === 'undefined') return;

  try {
    const rawProfile =
      window.localStorage.getItem('buddy_my_profile') ||
      window.localStorage.getItem('delivery_buddy_real_courier_profile_v1') ||
      window.localStorage.getItem('real_courier_profile_v1');
    if (rawProfile) {
      const parsedProfile = JSON.parse(rawProfile) as RealCourierMapProfile;
      if (
        parsedProfile &&
        parsedProfile.isRegistered !== false &&
        parsedProfile.id &&
        parsedProfile.name &&
        parsedProfile.name.trim()
      ) {
        const cleanName = parsedProfile.name.trim();
        const isFounder = isCourierAdminByName(cleanName);
        const resolvedId = isFounder
          ? FOUNDER_ADMIN_COURIER_ID
          : parsedProfile.id;
        const contactPrefs = getCourierContactAndOptInPreferences(cleanName);

        void publishCourierPresenceToCloud({
          profile: {
            ...parsedProfile,
            id: resolvedId,
            name: cleanName,
          },
          status: parsedProfile.has_order ? 'busy' : 'online',
          approvalStatus: isFounder ? 'approved' : undefined,
        });
        if (inMemoryCloudState.couriers[resolvedId]) {
          inMemoryCloudState.couriers[resolvedId].whatsapp =
            contactPrefs.whatsapp ||
            inMemoryCloudState.couriers[resolvedId].whatsapp;
          inMemoryCloudState.couriers[resolvedId].email =
            contactPrefs.email ||
            inMemoryCloudState.couriers[resolvedId].email;
          inMemoryCloudState.couriers[resolvedId].optInWhatsapp =
            contactPrefs.optInWhatsapp;
          inMemoryCloudState.couriers[resolvedId].optInEmail =
            contactPrefs.optInEmail;
        }
      }
    }
  } catch {
    // ignore storage errors
  }
}

async function fetchNtfyPollJsonWithTimeout(
  url: string,
  timeoutMs = 2500
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const fetchPromise = (async () => {
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!res.ok) return '';
      return await res.text();
    })();
    const timeoutPromise = new Promise<string>((resolve) =>
      setTimeout(() => resolve(''), timeoutMs)
    );
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch {
    return '';
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function pollCloudSyncTopicsOnce(
  myDeviceId = 'local_device',
  includeAccountsHistory = false
): Promise<CloudSharedState> {
  const urls = [
    `https://ntfy.sh/${FLEET_SYNC_TOPIC}/json?poll=1&since=24h`,
    ...(includeAccountsHistory
      ? [
          `https://ntfy.sh/${ACCOUNTS_SYNC_TOPIC}/json?poll=1&since=48h`,
          `https://ntfy.sh/${LEGACY_LIVE_SYNC_TOPIC}/json?poll=1&since=24h`,
        ]
      : []),
  ];

  let anyChanged = false;

  try {
    const texts = await Promise.all(
      urls.map((url) => fetchNtfyPollJsonWithTimeout(url, 2500))
    );

    for (const text of texts) {
      if (!text || !text.trim()) continue;
      const lines = text.trim().split('\n');
      for (const line of lines) {
        try {
          const ntfyRow = JSON.parse(line) as {
            event?: string;
            message?: string;
            time?: number;
          };
          if (ntfyRow.event && ntfyRow.event !== 'message') continue;
          if (!ntfyRow.message) continue;
          const env = JSON.parse(ntfyRow.message) as CloudSyncEnvelope;
          if (ingestEnvelope(env, myDeviceId)) {
            anyChanged = true;
          }
        } catch {
          // ignore malformed line
        }
      }
    }
  } catch {
    // ignore network error
  }

  if (anyChanged) {
    persistAndNotifyCloudState();
  }
  return getCloudSharedStateSnapshot();
}

export async function syncCloudStateNow(): Promise<CloudSharedState> {
  try {
    broadcastLocalStorageAccountsAndProfileNow();
    if (localIdentityProvider) {
      const res = localIdentityProvider();
      if (res && typeof res === 'object') {
        if (res.presence) void publishCourierPresenceToCloud(res.presence);
        if (Array.isArray(res.accounts)) {
          res.accounts.forEach((acc) => void publishAccountRegistrationToCloud(acc));
        }
      }
    }
    void publishPeerDiscoveryPing('admin_sync_now');
  } catch {
    // ignore
  }

  const timeoutFallback = new Promise<CloudSharedState>((resolve) =>
    setTimeout(() => resolve(getCloudSharedStateSnapshot()), 2500)
  );
  return Promise.race([
    pollCloudSyncTopicsOnce('admin_sync_now', true),
    timeoutFallback,
  ]);
}

export function startRealtimeCloudSyncStream(
  myDeviceId = 'local_device'
): () => void {
  if (typeof window === 'undefined') return () => {};

  let fleetEventSource: EventSource | null = null;
  let accountsEventSource: EventSource | null = null;
  let stopped = false;

  const connectStreams = () => {
    if (stopped || typeof EventSource === 'undefined') return;
    try {
      fleetEventSource = new EventSource(
        `https://ntfy.sh/${FLEET_SYNC_TOPIC}/sse?since=2h`
      );
      fleetEventSource.onmessage = (ev) => {
        try {
          const ntfyRow = JSON.parse(ev.data) as { message?: string };
          if (!ntfyRow?.message) return;
          const env = JSON.parse(ntfyRow.message) as CloudSyncEnvelope;
          if (ingestEnvelope(env, myDeviceId)) {
            persistAndNotifyCloudState();
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // fallback to 4s poll
    }

    try {
      accountsEventSource = new EventSource(
        `https://ntfy.sh/${ACCOUNTS_SYNC_TOPIC}/sse?since=12h`
      );
      accountsEventSource.onmessage = (ev) => {
        try {
          const ntfyRow = JSON.parse(ev.data) as { message?: string };
          if (!ntfyRow?.message) return;
          const env = JSON.parse(ntfyRow.message) as CloudSyncEnvelope;
          if (ingestEnvelope(env, myDeviceId)) {
            persistAndNotifyCloudState();
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }
  };

  connectStreams();
  broadcastLocalStorageAccountsAndProfileNow();
  void pollCloudSyncTopicsOnce(myDeviceId, true);
  void publishPeerDiscoveryPing(myDeviceId);

  let tickCount = 0;
  const pollTimer = window.setInterval(() => {
    if (stopped) return;
    tickCount += 1;
    // Publish current user's live profile & GPS every 12 seconds so peers always stay synced
    if (tickCount % 3 === 1) {
      broadcastLocalStorageAccountsAndProfileNow();
    }
    // Poll db_amarante_fleet_v3 every 4s, and legacy/accounts topics every 12s
    void pollCloudSyncTopicsOnce(myDeviceId, tickCount % 3 === 0);
  }, 4000);

  return () => {
    stopped = true;
    window.clearInterval(pollTimer);
    try {
      fleetEventSource?.close();
    } catch {
      // ignore
    }
    try {
      accountsEventSource?.close();
    } catch {
      // ignore
    }
  };
}

/**
 * Converts active CloudCourierPresence entries into SupabaseCourierRow format
 * so existing map, Buddys directory, and Admin KYC pipelines merge them seamlessly.
 */
export function getActiveCloudCourierRows(
  stateOrMaxAgeMs?: CloudSharedState | number
): SupabaseCourierRow[] {
  const maxAgeMs =
    typeof stateOrMaxAgeMs === 'number' ? stateOrMaxAgeMs : 2 * 60 * 60 * 1000;
  const sourceState =
    stateOrMaxAgeMs && typeof stateOrMaxAgeMs === 'object'
      ? stateOrMaxAgeMs
      : inMemoryCloudState;
  const nowMs = Date.now();
  const rows: SupabaseCourierRow[] = [];

  Object.values(sourceState.couriers).forEach((c) => {
    if (!c || !c.id || !c.name || !c.name.trim()) return;
    if (c.approvalStatus === 'blocked') return;
    const seenMs = c.lastSeen ? Date.parse(c.lastSeen) : 0;
    if (seenMs > 0 && nowMs - seenMs > maxAgeMs) return;

    rows.push({
      id: c.id,
      name: c.name.trim(),
      vehicle: c.vehicle || 'Mota 125cc',
      status:
        c.status === 'busy'
          ? 'Ocupado'
          : c.status === 'paused'
            ? 'Pausa'
            : 'Disponível',
      has_order: c.status === 'busy',
      lat:
        Number.isFinite(c.lat) && c.lat !== 0 ? c.lat : DEFAULT_AMARANTE_LAT,
      lng:
        Number.isFinite(c.lng) && c.lng !== 0 ? c.lng : DEFAULT_AMARANTE_LNG,
      zone: c.zone || 'Amarante Centro / São Gonçalo',
      reputation: 100,
      buddy_since:
        c.approvalStatus === 'pending'
          ? '⏳ Pendente Aprovação'
          : 'Fundador • Out 2026',
      updated_at: c.lastSeen || new Date().toISOString(),
      avatar_url: c.avatar,
      active_platforms:
        Array.isArray(c.platforms) && c.platforms.length > 0
          ? c.platforms
          : ['Uber Eats', 'Glovo'],
      device_model: c.deviceModel,
      screen_aspect_ratio: c.screenAspectRatio || '20:9',
    });
  });

  return rows;
}

/**
 * Computes a deterministic visual offset (±0.00012 lat/lng) ONLY when two or more couriers
 * are physically within < 12 meters of each other (e.g., two phones inside the same house at the same time)
 * so both 3D Buddy pins and name badges sit clearly side-by-side on the map without overlapping.
 * Once a courier moves >= 12m away, both pins render at their exact respective real locations.
 */
export function computeSameLocationPinOffset(
  targetId: string,
  targetLat: number,
  targetLng: number,
  allPins: Array<{ id: string; lat: number; lng: number }>
): { lat: number; lng: number; isOffsetApplied: boolean } {
  const safeLat =
    Number.isFinite(targetLat) && targetLat !== 0
      ? targetLat
      : DEFAULT_AMARANTE_LAT;
  const safeLng =
    Number.isFinite(targetLng) && targetLng !== 0
      ? targetLng
      : DEFAULT_AMARANTE_LNG;

  const nearbyCluster = allPins
    .filter((p) => {
      const pLat =
        Number.isFinite(p.lat) && p.lat !== 0 ? p.lat : DEFAULT_AMARANTE_LAT;
      const pLng =
        Number.isFinite(p.lng) && p.lng !== 0 ? p.lng : DEFAULT_AMARANTE_LNG;
      const dLat = (pLat - safeLat) * 111320;
      const dLng =
        (pLng - safeLng) * 111320 * Math.cos((safeLat * Math.PI) / 180);
      const distMeters = Math.sqrt(dLat * dLat + dLng * dLng);
      return distMeters < 12;
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  if (nearbyCluster.length <= 1) {
    return { lat: safeLat, lng: safeLng, isOffsetApplied: false };
  }

  const idx = nearbyCluster.findIndex((p) => p.id === targetId);
  const resolvedIdx = idx >= 0 ? idx : 0;
  const count = nearbyCluster.length;

  // Deterministic side-by-side spread (±0.00012 deg ≈ 12 meters)
  const radius = 0.00012;
  if (count === 2) {
    const sign = resolvedIdx === 0 ? -1 : 1;
    return {
      lat: Number((safeLat + sign * 0.00006).toFixed(6)),
      lng: Number((safeLng + sign * radius).toFixed(6)),
      isOffsetApplied: true,
    };
  }

  const angleRad = (resolvedIdx * 2 * Math.PI) / count;
  return {
    lat: Number((safeLat + Math.sin(angleRad) * radius).toFixed(6)),
    lng: Number((safeLng + Math.cos(angleRad) * radius).toFixed(6)),
    isOffsetApplied: true,
  };
}

export function buildRealCourierPresencePayload(params: {
  profile: RealCourierMapProfile;
  isPaused: boolean;
  hasActiveOrder: boolean;
  heading?: number | null;
  speed?: number;
}): CloudCourierPresence {
  const isFounder = isCourierAdminByName(params.profile.name);
  const role: CourierCloudRole = isFounder ? 'admin' : 'courier';
  const effectiveId = isFounder ? FOUNDER_ADMIN_COURIER_ID : params.profile.id;
  const status: CourierLivePresenceStatus = params.isPaused
    ? 'paused'
    : params.hasActiveOrder || params.profile.has_order
      ? 'busy'
      : 'online';
  const approvalStatus = resolveApprovalStatusForCourier(
    effectiveId,
    params.profile.name,
    role === 'admin' ? 'approved' : 'pending'
  );

  return {
    id: effectiveId,
    name: params.profile.name.trim(),
    role,
    vehicle: params.profile.vehicle || 'Mota 125cc',
    platforms:
      params.profile.active_platforms &&
      params.profile.active_platforms.length > 0
        ? params.profile.active_platforms
        : ['Uber Eats', 'Glovo'],
    zone: params.profile.zone || 'Amarante Centro / São Gonçalo',
    status,
    approvalStatus,
    lat:
      Number.isFinite(params.profile.lat) && params.profile.lat !== 0
        ? params.profile.lat
        : DEFAULT_AMARANTE_LAT,
    lng:
      Number.isFinite(params.profile.lng) && params.profile.lng !== 0
        ? params.profile.lng
        : DEFAULT_AMARANTE_LNG,
    heading: params.heading ?? null,
    speed: params.speed ?? 0,
    avatar: params.profile.avatar_url,
    deviceModel: params.profile.device_model,
    screenAspectRatio: params.profile.screen_aspect_ratio,
    lastSeen: new Date().toISOString(),
  };
}

export type { WalkieChannelId };
