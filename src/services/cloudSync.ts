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

export const LIVE_SYNC_TOPIC = 'db_amarante_live_sync_v2';
export const ACCOUNTS_SYNC_TOPIC = 'db_amarante_accounts_v2';
export const CLOUD_SHARED_STATE_STORAGE_KEY = 'buddy_cloud_shared_state_v2';

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
  lastSeen: string;
}

export interface CloudApprovalRequest {
  id: string;
  username: string;
  emailOrPhone: string;
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
  lastUpdatedMs: number;
}

export type CloudSharedStateSnapshot = CloudSharedState;

type CloudPacketType =
  | 'COURIER_PRESENCE'
  | 'APPROVAL_REQUEST'
  | 'ADMIN_APPROVAL_DECISION'
  | 'PEER_DISCOVERY_PING'
  | 'CROSSWALK_TAUGHT'
  | 'WALKIE_MSG'
  | 'DIRECT_MSG'
  | 'ROAD_HAZARD'
  | 'COURIER_LOGOUT';

interface CloudSyncEnvelope {
  v: 2;
  type: CloudPacketType;
  senderId: string;
  ts: number;
  payload: unknown;
}

const DEFAULT_AMARANTE_LAT = 41.2704;
const DEFAULT_AMARANTE_LNG = -8.0818;

export function isCourierAdminByName(name: string): boolean {
  const clean = (name || '').trim().toLowerCase();
  return (
    clean === 'presidente' ||
    clean === 'admin' ||
    clean === 'administrador' ||
    clean === 'ceo' ||
    clean.includes('presidente') ||
    clean.includes('(admin)') ||
    clean.includes('ceo')
  );
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
    });
    return res.ok;
  } catch {
    return false;
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

  const resolvedApproval = resolveApprovalStatusForCourier(
    presence.id,
    presence.name,
    presence.approvalStatus
  );

  const cleanPresence: CloudCourierPresence = {
    ...presence,
    name: presence.name.trim(),
    role: isCourierAdminByName(presence.name) ? 'admin' : presence.role || 'courier',
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
    lastSeen: new Date().toISOString(),
  };

  inMemoryCloudState.couriers[cleanPresence.id] = cleanPresence;

  const existingReq = inMemoryCloudState.approvalRequestsMap[cleanPresence.id];
  const reqRecord: CloudApprovalRequest = {
    id: cleanPresence.id,
    username: cleanPresence.name,
    emailOrPhone: existingReq?.emailOrPhone || cleanPresence.name,
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

  await postPacketToNtfyTopic(LIVE_SYNC_TOPIC, {
    v: 2,
    type: 'COURIER_PRESENCE',
    senderId: cleanPresence.id,
    ts: Date.now(),
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
  const id =
    account.id ||
    `acc-${normalizeAccountKey(cleanName).replace(/[^a-z0-9]/g, '') || 'user'}`;
  const resolvedApproval = resolveApprovalStatusForCourier(
    id,
    cleanName,
    account.approvalStatus
  );

  const cleanReq: CloudApprovalRequest = {
    ...account,
    id,
    username: cleanName,
    role: isCourierAdminByName(cleanName) ? 'admin' : account.role || 'courier',
    approvalStatus: resolvedApproval,
    lat:
      typeof account.lat === 'number' && Number.isFinite(account.lat) && account.lat !== 0
        ? Number(account.lat.toFixed(6))
        : DEFAULT_AMARANTE_LAT,
    lng:
      typeof account.lng === 'number' && Number.isFinite(account.lng) && account.lng !== 0
        ? Number(account.lng.toFixed(6))
        : DEFAULT_AMARANTE_LNG,
    createdAt: account.createdAt || new Date().toISOString(),
    updatedAt: account.updatedAt || new Date().toISOString(),
  };

  inMemoryCloudState.approvalRequestsMap[id] = cleanReq;
  persistAndNotifyCloudState();

  await Promise.all([
    postPacketToNtfyTopic(ACCOUNTS_SYNC_TOPIC, {
      v: 2,
      type: 'APPROVAL_REQUEST',
      senderId: id,
      ts: Date.now(),
      payload: cleanReq,
    }),
    postPacketToNtfyTopic(LIVE_SYNC_TOPIC, {
      v: 2,
      type: 'APPROVAL_REQUEST',
      senderId: id,
      ts: Date.now(),
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

  const decisionPayload = {
    targetCourierId: effectiveCourierId,
    targetUsername: effectiveUsername.trim(),
    decision: effectiveDecision,
    updatedAt: new Date().toISOString(),
  };

  await Promise.all([
    postPacketToNtfyTopic(ACCOUNTS_SYNC_TOPIC, {
      v: 2,
      type: 'ADMIN_APPROVAL_DECISION',
      senderId: params.adminSenderId || 'ADMIN_CEO',
      ts: Date.now(),
      payload: decisionPayload,
    }),
    postPacketToNtfyTopic(LIVE_SYNC_TOPIC, {
      v: 2,
      type: 'ADMIN_APPROVAL_DECISION',
      senderId: params.adminSenderId || 'ADMIN_CEO',
      ts: Date.now(),
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

  await postPacketToNtfyTopic(LIVE_SYNC_TOPIC, {
    v: 2,
    type: 'COURIER_LOGOUT',
    senderId: courierId,
    ts: Date.now(),
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
  await postPacketToNtfyTopic(LIVE_SYNC_TOPIC, {
    v: 2,
    type: 'PEER_DISCOVERY_PING',
    senderId: myDeviceId,
    ts: Date.now(),
    payload: { requesterId: myDeviceId },
  });
}

export async function publishTaughtCrosswalkToCloud(
  crosswalk: AmaranteCrosswalkPoint,
  senderId = 'local_device'
): Promise<void> {
  inMemoryCloudState.crosswalks[crosswalk.id] = crosswalk;
  persistAndNotifyCloudState();

  await postPacketToNtfyTopic(LIVE_SYNC_TOPIC, {
    v: 2,
    type: 'CROSSWALK_TAUGHT',
    senderId,
    ts: Date.now(),
    payload: crosswalk,
  });
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

  await postPacketToNtfyTopic(LIVE_SYNC_TOPIC, {
    v: 2,
    type: 'WALKIE_MSG',
    senderId,
    ts: Date.now(),
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

  await postPacketToNtfyTopic(LIVE_SYNC_TOPIC, {
    v: 2,
    type: 'DIRECT_MSG',
    senderId: normalizedDm.senderId,
    ts: Date.now(),
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

  await postPacketToNtfyTopic(LIVE_SYNC_TOPIC, {
    v: 2,
    type: 'ROAD_HAZARD',
    senderId,
    ts: Date.now(),
    payload: hazard,
  });
}

function ingestEnvelope(
  envelope: CloudSyncEnvelope,
  myDeviceId: string
): boolean {
  if (!envelope || envelope.v !== 2 || !envelope.type) return false;
  let stateChanged = false;

  switch (envelope.type) {
    case 'COURIER_PRESENCE': {
      const p = envelope.payload as CloudCourierPresence;
      if (!p || typeof p.id !== 'string' || typeof p.name !== 'string' || !p.name.trim()) {
        break;
      }
      const resolvedApproval = resolveApprovalStatusForCourier(
        p.id,
        p.name,
        p.approvalStatus
      );
      const existing = inMemoryCloudState.couriers[p.id];
      const existingMs = existing?.lastSeen ? Date.parse(existing.lastSeen) : 0;
      const incomingMs = p.lastSeen ? Date.parse(p.lastSeen) : envelope.ts;

      if (!existing || incomingMs >= existingMs - 2000) {
        inMemoryCloudState.couriers[p.id] = {
          ...existing,
          ...p,
          name: p.name.trim(),
          role: isCourierAdminByName(p.name) ? 'admin' : p.role || 'courier',
          approvalStatus: resolvedApproval,
          lat:
            Number.isFinite(p.lat) && p.lat !== 0
              ? Number(p.lat)
              : DEFAULT_AMARANTE_LAT,
          lng:
            Number.isFinite(p.lng) && p.lng !== 0
              ? Number(p.lng)
              : DEFAULT_AMARANTE_LNG,
          avatar: p.avatar || existing?.avatar,
          lastSeen: p.lastSeen || new Date(envelope.ts).toISOString(),
        };

        const prevReq = inMemoryCloudState.approvalRequestsMap[p.id];
        inMemoryCloudState.approvalRequestsMap[p.id] = {
          id: p.id,
          username: p.name.trim(),
          emailOrPhone: prevReq?.emailOrPhone || p.name.trim(),
          vehicle: p.vehicle || prevReq?.vehicle || 'Mota 125cc',
          platforms:
            Array.isArray(p.platforms) && p.platforms.length > 0
              ? p.platforms
              : prevReq?.platforms || ['Uber Eats', 'Glovo'],
          zone: p.zone || prevReq?.zone || 'Amarante Centro / São Gonçalo',
          role: isCourierAdminByName(p.name) ? 'admin' : 'courier',
          approvalStatus: resolvedApproval,
          lat:
            Number.isFinite(p.lat) && p.lat !== 0
              ? Number(p.lat)
              : DEFAULT_AMARANTE_LAT,
          lng:
            Number.isFinite(p.lng) && p.lng !== 0
              ? Number(p.lng)
              : DEFAULT_AMARANTE_LNG,
          deviceModel: p.deviceModel || prevReq?.deviceModel,
          createdAt: prevReq?.createdAt || p.lastSeen || new Date().toISOString(),
          updatedAt: p.lastSeen || new Date().toISOString(),
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
      const reqId =
        req.id ||
        `acc-${normalizeAccountKey(req.username).replace(/[^a-z0-9]/g, '')}`;
      const resolvedApproval = resolveApprovalStatusForCourier(
        reqId,
        req.username,
        req.approvalStatus
      );
      const prev = inMemoryCloudState.approvalRequestsMap[reqId];
      inMemoryCloudState.approvalRequestsMap[reqId] = {
        ...prev,
        ...req,
        id: reqId,
        username: req.username.trim(),
        role: isCourierAdminByName(req.username) ? 'admin' : 'courier',
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
        updatedAt: req.updatedAt || new Date(envelope.ts).toISOString(),
      };

      if (
        !inMemoryCloudState.couriers[reqId] &&
        Date.now() - envelope.ts <= 2 * 60 * 60 * 1000
      ) {
        inMemoryCloudState.couriers[reqId] = {
          id: reqId,
          name: req.username.trim(),
          role: isCourierAdminByName(req.username) ? 'admin' : 'courier',
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
          lastSeen: req.updatedAt || new Date(envelope.ts).toISOString(),
        };
      }
      stateChanged = true;
      break;
    }

    case 'ADMIN_APPROVAL_DECISION': {
      const dec = envelope.payload as {
        targetCourierId?: string;
        targetUsername?: string;
        decision?: CourierApprovalStatus;
      };
      if (!dec || !dec.decision) break;
      const nameKey = normalizeAccountKey(dec.targetUsername || '');
      if (nameKey) {
        inMemoryCloudState.approvalDecisionsByName[nameKey] = dec.decision;
      }
      Object.values(inMemoryCloudState.approvalRequestsMap).forEach((r) => {
        if (
          (dec.targetCourierId && r.id === dec.targetCourierId) ||
          (nameKey && normalizeAccountKey(r.username) === nameKey)
        ) {
          r.approvalStatus = dec.decision!;
        }
      });
      Object.values(inMemoryCloudState.couriers).forEach((c) => {
        if (
          (dec.targetCourierId && c.id === dec.targetCourierId) ||
          (nameKey && normalizeAccountKey(c.name) === nameKey)
        ) {
          c.approvalStatus = dec.decision!;
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
        Date.now() - envelope.ts < 30000 &&
        Date.now() - lastDiscoveryReplyMs > 3500 &&
        localIdentityProvider
      ) {
        lastDiscoveryReplyMs = Date.now();
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
  }

  return stateChanged;
}

export async function pollCloudSyncTopicsOnce(
  myDeviceId = 'local_device',
  includeAccountsHistory = false
): Promise<CloudSharedState> {
  const urls = [
    `https://ntfy.sh/${LIVE_SYNC_TOPIC}/json?poll=1&since=2h`,
    ...(includeAccountsHistory
      ? [`https://ntfy.sh/${ACCOUNTS_SYNC_TOPIC}/json?poll=1&since=12h`]
      : []),
  ];

  let anyChanged = false;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
      });
      if (!res.ok) continue;
      const text = await res.text();
      if (!text.trim()) continue;
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
    } catch {
      // ignore network error
    }
  }

  if (anyChanged) {
    persistAndNotifyCloudState();
  }
  return getCloudSharedStateSnapshot();
}

export async function syncCloudStateNow(): Promise<CloudSharedState> {
  if (localIdentityProvider) {
    try {
      const res = localIdentityProvider();
      if (res && typeof res === 'object') {
        if (res.presence) void publishCourierPresenceToCloud(res.presence);
        if (Array.isArray(res.accounts)) {
          res.accounts.forEach((acc) => void publishAccountRegistrationToCloud(acc));
        }
      }
    } catch {
      // ignore
    }
  }
  void publishPeerDiscoveryPing('admin_sync_now');
  return pollCloudSyncTopicsOnce('admin_sync_now', true);
}

export function startRealtimeCloudSyncStream(
  myDeviceId = 'local_device'
): () => void {
  if (typeof window === 'undefined') return () => {};

  let liveEventSource: EventSource | null = null;
  let accountsEventSource: EventSource | null = null;
  let stopped = false;

  const connectStreams = () => {
    if (stopped || typeof EventSource === 'undefined') return;
    try {
      liveEventSource = new EventSource(
        `https://ntfy.sh/${LIVE_SYNC_TOPIC}/sse?since=30m`
      );
      liveEventSource.onmessage = (ev) => {
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
  void pollCloudSyncTopicsOnce(myDeviceId, true);
  void publishPeerDiscoveryPing(myDeviceId);

  let tickCount = 0;
  const pollTimer = window.setInterval(() => {
    if (stopped) return;
    tickCount += 1;
    // Poll live sync every 4s, and accounts topic every 12s
    void pollCloudSyncTopicsOnce(myDeviceId, tickCount % 3 === 0);
  }, 4000);

  return () => {
    stopped = true;
    window.clearInterval(pollTimer);
    try {
      liveEventSource?.close();
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
 * Computes a deterministic visual offset (±0.00018 lat/lng) when two or more couriers
 * are within < 15 meters of each other (e.g., two phones inside the same house)
 * so both 3D Buddy pins and name badges sit clearly side-by-side on the map.
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
      return distMeters < 15;
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  if (nearbyCluster.length <= 1) {
    return { lat: safeLat, lng: safeLng, isOffsetApplied: false };
  }

  const idx = nearbyCluster.findIndex((p) => p.id === targetId);
  const resolvedIdx = idx >= 0 ? idx : 0;
  const count = nearbyCluster.length;

  // Deterministic side-by-side spread (±0.00018 deg ≈ 18 meters)
  const radius = 0.00018;
  if (count === 2) {
    const sign = resolvedIdx === 0 ? -1 : 1;
    return {
      lat: Number((safeLat + sign * 0.00007).toFixed(6)),
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
  const role: CourierCloudRole = isCourierAdminByName(params.profile.name)
    ? 'admin'
    : 'courier';
  const status: CourierLivePresenceStatus = params.isPaused
    ? 'paused'
    : params.hasActiveOrder || params.profile.has_order
      ? 'busy'
      : 'online';
  const approvalStatus = resolveApprovalStatusForCourier(
    params.profile.id,
    params.profile.name,
    role === 'admin' ? 'approved' : 'pending'
  );

  return {
    id: params.profile.id,
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
