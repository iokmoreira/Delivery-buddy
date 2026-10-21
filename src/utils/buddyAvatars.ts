import { useSyncExternalStore } from 'react';

/**
 * Official 1:1 3D Buddy avatar assets (public/assets/*.jpg, rendered on pure black).
 * Used by the floating Buddy button, Perfil status preview, header brand icon,
 * Presidente/Admin badges and the BuddyLaunchAnimation centerpiece.
 */
const ASSET_BASE_URL =
  typeof import.meta !== 'undefined' &&
  typeof (import.meta as unknown as { env?: { BASE_URL?: string } }).env
    ?.BASE_URL === 'string'
    ? (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL
    : './';

const ASSET_VERSION = 'v=3d1';

export const BUDDY_AVATARS = {
  flying: `${ASSET_BASE_URL}assets/buddy-flying.jpg?${ASSET_VERSION}`,
  online: `${ASSET_BASE_URL}assets/buddy-online.jpg?${ASSET_VERSION}`,
  ausente: `${ASSET_BASE_URL}assets/buddy-ausente.jpg?${ASSET_VERSION}`,
  ninja: `${ASSET_BASE_URL}assets/buddy-ninja.jpg?${ASSET_VERSION}`,
  presidente: `${ASSET_BASE_URL}assets/buddy-presidente.jpg?${ASSET_VERSION}`,
  halloween: `${ASSET_BASE_URL}assets/buddy-halloween.jpg?${ASSET_VERSION}`,
} as const;

/** Optional external 3D launch video (drop a file in public/assets/ to enable). */
export const BUDDY_LAUNCH_VIDEO_SRC = `${ASSET_BASE_URL}assets/buddy-launch.mp4`;

export type BuddyShiftVisualState = 'ONLINE' | 'AUSENTE' | 'NINJA' | 'DELIVERY';
export type BuddySkin = 'DEFAULT' | 'HALLOWEEN';

export const BUDDY_SKIN_STORAGE_KEY = 'delivery_buddy_visual_skin_v1';
const BUDDY_SKIN_EVENT = 'buddy-visual-skin-changed';

export function resolveBuddyShiftVisualState(input: {
  isAppPaused?: boolean;
  isNinja?: boolean;
  isDelivery?: boolean;
}): BuddyShiftVisualState {
  if (input.isNinja) return 'NINJA';
  if (input.isAppPaused) return 'AUSENTE';
  if (input.isDelivery) return 'DELIVERY';
  return 'ONLINE';
}

/**
 * Avatar for the current shift state:
 * Online -> Buddy Explorador • Ausente -> Buddy de Costas • Modo Ninja -> Buddy Ninja
 * Em entrega -> Buddy a voar. The Halloween skin replaces the Online/Entrega poses only,
 * so Ausente and Modo Ninja keep communicating the real shift state.
 */
export function getBuddyAvatarForState(
  state: BuddyShiftVisualState,
  skin: BuddySkin = 'DEFAULT'
): string {
  if (state === 'NINJA') return BUDDY_AVATARS.ninja;
  if (state === 'AUSENTE') return BUDDY_AVATARS.ausente;
  if (skin === 'HALLOWEEN') return BUDDY_AVATARS.halloween;
  if (state === 'DELIVERY') return BUDDY_AVATARS.flying;
  return BUDDY_AVATARS.online;
}

export function readBuddySkin(): BuddySkin {
  if (typeof window === 'undefined') return 'DEFAULT';
  try {
    return window.localStorage.getItem(BUDDY_SKIN_STORAGE_KEY) === 'HALLOWEEN'
      ? 'HALLOWEEN'
      : 'DEFAULT';
  } catch {
    return 'DEFAULT';
  }
}

export function setBuddySkin(skin: BuddySkin): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BUDDY_SKIN_STORAGE_KEY, skin);
  } catch {
    // ignore quota errors
  }
  window.dispatchEvent(new CustomEvent(BUDDY_SKIN_EVENT, { detail: { skin } }));
}

function subscribeBuddySkin(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const onStorage = (e: StorageEvent) => {
    if (e.key === BUDDY_SKIN_STORAGE_KEY) callback();
  };
  window.addEventListener(BUDDY_SKIN_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(BUDDY_SKIN_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}

/** Reactive hook for the selected Buddy visual skin (persisted in localStorage). */
export function useBuddySkin(): [BuddySkin, (skin: BuddySkin) => void] {
  const skin = useSyncExternalStore(
    subscribeBuddySkin,
    readBuddySkin,
    () => 'DEFAULT' as BuddySkin
  );
  return [skin, setBuddySkin];
}

// =========================================================================
// Launch animation replay bus (header mascot tap -> BuddyLaunchAnimation)
// =========================================================================
export const BUDDY_LAUNCH_REPLAY_EVENT = 'buddy-launch-replay';
export const BUDDY_LAUNCH_SESSION_KEY = 'buddy_launch_played';

export function requestBuddyLaunchReplay(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(BUDDY_LAUNCH_REPLAY_EVENT));
}
