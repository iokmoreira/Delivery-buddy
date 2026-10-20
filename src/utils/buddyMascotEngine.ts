export type BuddyMascotState = 'INACTIVE' | 'ACTIVE' | 'DELIVERY';

export type BubbleRestingPreset =
  | 'BOTTOM_RIGHT'
  | 'BOTTOM_LEFT'
  | 'MIDDLE_RIGHT'
  | 'MIDDLE_LEFT'
  | 'CUSTOM_DRAG';

export interface BuddyMascotImagesSet {
  mascotInactive: string;
  mascotActive: string;
  mascotDelivery: string;
  isCustomUploaded: boolean;
}

export const BUDDY_MASCOT_IMAGES_STORAGE_KEY =
  'delivery_buddy_mascot_3poses_v2';

export const BUBBLE_RESTING_PRESET_STORAGE_KEY =
  'delivery_buddy_bubble_resting_preset_v1';

export const BUDDY_MASCOT_SYNC_ID_STORAGE_KEY =
  'delivery_buddy_mascot_sync_id_v1';

export const BUDDY_MASCOT_CLIPBOARD_PREFIX = '__BUDDY_MASCOT_3POSES__:';

export function getOrCreateMascotSyncId(): string {
  if (typeof window === 'undefined') return 'amarante_default';
  try {
    const existing = window.localStorage.getItem(
      BUDDY_MASCOT_SYNC_ID_STORAGE_KEY
    );
    if (existing && /^[a-z0-9_-]{4,24}$/i.test(existing.trim())) {
      return existing.trim().toLowerCase();
    }
    const courierUuid = window.localStorage.getItem('buddy_my_courier_id');
    const cleanBase = courierUuid
      ? courierUuid.replace(/[^a-z0-9]/gi, '').slice(0, 10).toLowerCase()
      : Math.random().toString(36).slice(2, 10).toLowerCase();
    const syncId = cleanBase || 'buddy01';
    window.localStorage.setItem(BUDDY_MASCOT_SYNC_ID_STORAGE_KEY, syncId);
    return syncId;
  } catch {
    return 'amarante_default';
  }
}

export function isLegacyAndroidWebViewWithoutFileChooser(): boolean {
  if (typeof window === 'undefined') return false;
  const winAny = window as unknown as {
    BuddyNativeOverlay?: {
      getNativeBridgeVersion?: () => number;
    };
  };
  if (!winAny.BuddyNativeOverlay) return false;
  try {
    const ver =
      typeof winAny.BuddyNativeOverlay.getNativeBridgeVersion === 'function'
        ? winAny.BuddyNativeOverlay.getNativeBridgeVersion()
        : 1;
    return ver < 11;
  } catch {
    return true;
  }
}

export const BUBBLE_RESTING_PRESET_OPTIONS: {
  id: BubbleRestingPreset;
  label: string;
  shortDesc: string;
}[] = [
  {
    id: 'BOTTOM_RIGHT',
    label: 'Canto Inferior Direito (Padrão)',
    shortDesc: 'Posição ergonómica para o polegar direito acima da dock',
  },
  {
    id: 'BOTTOM_LEFT',
    label: 'Canto Inferior Esquerdo',
    shortDesc: 'Posição ergonómica para a mão esquerda acima da dock',
  },
  {
    id: 'MIDDLE_RIGHT',
    label: 'Meio Direita',
    shortDesc: 'Encostada à margem direita a meia altura do ecrã',
  },
  {
    id: 'MIDDLE_LEFT',
    label: 'Meio Esquerda',
    shortDesc: 'Encostada à margem esquerda a meia altura do ecrã',
  },
  {
    id: 'CUSTOM_DRAG',
    label: '📌 Fixar onde eu arrastar a bolinha',
    shortDesc: 'Guarda automaticamente o último ponto (X, Y) onde largar a bolinha',
  },
];

const svgToDataUrl = (svg: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

// Pose 1: ACTIVE / ONLINE (Robot 3/4 front, glowing green eyes, DB backpack on side, Thumbs-Up 👍)
const BUILTIN_SVG_ACTIVE = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <radialGradient id="bgAct" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </radialGradient>
    <linearGradient id="packGreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="botBody" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
  </defs>
  <circle cx="80" cy="80" r="78" fill="url(#bgAct)"/>
  <!-- DB Green Backpack peeking on left/back -->
  <rect x="24" y="64" width="34" height="50" rx="10" fill="url(#packGreen)" stroke="#a7f3d0" stroke-width="2"/>
  <text x="41" y="88" text-anchor="middle" fill="#022c22" font-family="Arial, sans-serif" font-weight="900" font-size="14">DB</text>
  <text x="41" y="101" text-anchor="middle" fill="#ecfdf5" font-family="Arial, sans-serif" font-weight="800" font-size="7">BUDDY</text>
  <!-- Antenna -->
  <line x1="80" y1="18" x2="80" y2="30" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
  <circle cx="80" cy="15" r="6" fill="#10b981"/>
  <!-- Robot Torso -->
  <rect x="52" y="88" width="56" height="46" rx="18" fill="url(#botBody)" stroke="#64748b" stroke-width="2.5"/>
  <!-- Backpack Straps -->
  <path d="M58 90 L58 124 M102 90 L102 124" stroke="#059669" stroke-width="5" stroke-linecap="round"/>
  <!-- Chest Emblem -->
  <rect x="68" y="100" width="24" height="16" rx="5" fill="#0f172a" stroke="#10b981" stroke-width="1.8"/>
  <text x="80" y="112" text-anchor="middle" fill="#34d399" font-family="Arial, sans-serif" font-weight="900" font-size="10">DB</text>
  <!-- Robot Head -->
  <rect x="46" y="30" width="68" height="54" rx="24" fill="url(#botBody)" stroke="#64748b" stroke-width="2.5"/>
  <!-- Side Ear Pods -->
  <rect x="40" y="48" width="7" height="20" rx="3.5" fill="#10b981"/>
  <rect x="113" y="48" width="7" height="20" rx="3.5" fill="#10b981"/>
  <!-- Dark Visor -->
  <rect x="55" y="41" width="50" height="32" rx="14" fill="#090d16" stroke="#334155" stroke-width="2"/>
  <!-- Glowing Happy Eyes -->
  <ellipse cx="70" cy="54" rx="6" ry="7" fill="#10b981"/>
  <ellipse cx="92" cy="54" rx="6" ry="7" fill="#10b981"/>
  <circle cx="72" cy="52" r="2" fill="#ecfdf5"/>
  <circle cx="94" cy="52" r="2" fill="#ecfdf5"/>
  <!-- Smile Arc -->
  <path d="M71 64 Q81 71 91 64" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round"/>
  <!-- Right Arm Raised Giving Thumbs-Up -->
  <path d="M108 102 Q126 98 130 82" fill="none" stroke="#e2e8f0" stroke-width="10" stroke-linecap="round"/>
  <!-- Robot Hand + Thumb Up -->
  <circle cx="131" cy="78" r="10" fill="#10b981" stroke="#ecfdf5" stroke-width="2"/>
  <rect x="128" y="61" width="7" height="13" rx="3.5" fill="#34d399" stroke="#ecfdf5" stroke-width="1.5"/>
</svg>
`);

// Pose 2: INACTIVE / PAUSE (Robot turned from behind showing the green DB BUDDY backpack in standby)
const BUILTIN_SVG_INACTIVE = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <radialGradient id="bgInact" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#090d16"/>
    </radialGradient>
    <linearGradient id="packStandby" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="botBack" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>
  </defs>
  <circle cx="80" cy="80" r="78" fill="url(#bgInact)"/>
  <!-- Antenna in Standby -->
  <line x1="80" y1="16" x2="80" y2="28" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
  <circle cx="80" cy="14" r="5" fill="#64748b"/>
  <!-- Back of Robot Head -->
  <rect x="48" y="28" width="64" height="48" rx="22" fill="url(#botBack)" stroke="#475569" stroke-width="2.5"/>
  <line x1="62" y1="50" x2="98" y2="50" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
  <rect x="42" y="44" width="6" height="18" rx="3" fill="#475569"/>
  <rect x="112" y="44" width="6" height="18" rx="3" fill="#475569"/>
  <!-- Robot Shoulders / Arms at Rest -->
  <rect x="34" y="80" width="16" height="38" rx="8" fill="url(#botBack)" stroke="#475569" stroke-width="2"/>
  <rect x="110" y="80" width="16" height="38" rx="8" fill="url(#botBack)" stroke="#475569" stroke-width="2"/>
  <!-- Prominent Green DB BUDDY Backpack (Rear View) -->
  <rect x="44" y="66" width="72" height="66" rx="14" fill="url(#packStandby)" stroke="#a7f3d0" stroke-width="2.5"/>
  <!-- Top Flap of Backpack -->
  <path d="M46 78 L114 78" stroke="#064e3b" stroke-width="2.5"/>
  <!-- DB BUDDY Logo on Back -->
  <rect x="56" y="83" width="48" height="32" rx="8" fill="#064e3b" stroke="#34d399" stroke-width="1.5"/>
  <text x="80" y="101" text-anchor="middle" fill="#34d399" font-family="Arial, sans-serif" font-weight="900" font-size="16">DB</text>
  <text x="80" y="111" text-anchor="middle" fill="#ecfdf5" font-family="Arial, sans-serif" font-weight="800" font-size="8" letter-spacing="1">BUDDY</text>
  <!-- Bottom Thruster Nozzles (Off/Standby) -->
  <rect x="56" y="132" width="16" height="8" rx="3" fill="#334155"/>
  <rect x="88" y="132" width="16" height="8" rx="3" fill="#334155"/>
</svg>
`);

// Pose 3: EM ENTREGA (Robot flying with jet flames firing from DB BUDDY backpack 🚀)
const BUILTIN_SVG_DELIVERY = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <radialGradient id="bgDel" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </radialGradient>
    <linearGradient id="packJet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="jetFlame" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#a7f3d0"/>
      <stop offset="45%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <circle cx="80" cy="80" r="78" fill="url(#bgDel)"/>
  <!-- Speed Lines -->
  <line x1="22" y1="42" x2="36" y2="28" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
  <line x1="128" y1="54" x2="142" y2="40" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
  <!-- Twin Jet Thruster Flames at Bottom -->
  <path d="M52 118 L62 154 L72 118 Z" fill="url(#jetFlame)"/>
  <path d="M88 118 L98 154 L108 118 Z" fill="url(#jetFlame)"/>
  <path d="M57 118 L62 142 L67 118 Z" fill="#ecfdf5"/>
  <path d="M93 118 L98 142 L103 118 Z" fill="#ecfdf5"/>
  <!-- DB Jetpack Visible Behind Flying Robot -->
  <rect x="34" y="64" width="92" height="46" rx="12" fill="url(#packJet)" stroke="#a7f3d0" stroke-width="2"/>
  <text x="48" y="88" text-anchor="middle" fill="#022c22" font-family="Arial, sans-serif" font-weight="900" font-size="11">DB</text>
  <text x="112" y="88" text-anchor="middle" fill="#022c22" font-family="Arial, sans-serif" font-weight="900" font-size="11">DB</text>
  <!-- Robot Torso Tilted Forward -->
  <rect x="54" y="76" width="52" height="44" rx="16" fill="#f8fafc" stroke="#64748b" stroke-width="2.5"/>
  <rect x="68" y="88" width="24" height="15" rx="4" fill="#0f172a" stroke="#34d399" stroke-width="1.8"/>
  <text x="80" y="99" text-anchor="middle" fill="#34d399" font-family="Arial, sans-serif" font-weight="900" font-size="9">BUDDY</text>
  <!-- Flying Arms Extended Forward/Out -->
  <path d="M52 86 L26 70" stroke="#f8fafc" stroke-width="10" stroke-linecap="round"/>
  <path d="M108 86 L134 70" stroke="#f8fafc" stroke-width="10" stroke-linecap="round"/>
  <circle cx="24" cy="68" r="7" fill="#10b981"/>
  <circle cx="136" cy="68" r="7" fill="#10b981"/>
  <!-- Robot Helmet -->
  <rect x="48" y="24" width="64" height="50" rx="22" fill="#f8fafc" stroke="#64748b" stroke-width="2.5"/>
  <line x1="80" y1="12" x2="80" y2="24" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
  <circle cx="80" cy="10" r="6" fill="#34d399"/>
  <!-- Visor with Focused Turbo Eyes -->
  <rect x="56" y="34" width="48" height="30" rx="13" fill="#090d16" stroke="#10b981" stroke-width="2"/>
  <path d="M63 45 L76 49 L63 53 Z" fill="#34d399"/>
  <path d="M97 45 L84 49 L97 53 Z" fill="#34d399"/>
  <path d="M72 58 Q80 63 88 58" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round"/>
</svg>
`);

const MASCOT_BASE_URL =
  typeof import.meta !== 'undefined' &&
  typeof (import.meta as unknown as { env?: { BASE_URL?: string } }).env
    ?.BASE_URL === 'string'
    ? (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL
    : './';

export const DEFAULT_BUILTIN_MASCOT_IMAGES: BuddyMascotImagesSet = {
  mascotActive: `${MASCOT_BASE_URL}mascot/buddy-active.png`,
  mascotInactive: `${MASCOT_BASE_URL}mascot/buddy-pause.png`,
  mascotDelivery: `${MASCOT_BASE_URL}mascot/buddy-delivery.png`,
  isCustomUploaded: false,
};

export function loadSavedMascotImages(): BuddyMascotImagesSet {
  if (typeof window === 'undefined') return DEFAULT_BUILTIN_MASCOT_IMAGES;
  try {
    const raw = window.localStorage.getItem(BUDDY_MASCOT_IMAGES_STORAGE_KEY);
    if (!raw) return DEFAULT_BUILTIN_MASCOT_IMAGES;
    const parsed = JSON.parse(raw) as Partial<BuddyMascotImagesSet>;
    if (
      parsed &&
      parsed.isCustomUploaded &&
      typeof parsed.mascotActive === 'string' &&
      parsed.mascotActive.length > 5 &&
      !parsed.mascotActive.startsWith('data:image/svg+xml') &&
      typeof parsed.mascotInactive === 'string' &&
      parsed.mascotInactive.length > 5 &&
      typeof parsed.mascotDelivery === 'string' &&
      parsed.mascotDelivery.length > 5
    ) {
      return {
        mascotActive: parsed.mascotActive,
        mascotInactive: parsed.mascotInactive,
        mascotDelivery: parsed.mascotDelivery,
        isCustomUploaded: true,
      };
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_BUILTIN_MASCOT_IMAGES;
}

export function saveMascotImagesToStorage(images: BuddyMascotImagesSet): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      BUDDY_MASCOT_IMAGES_STORAGE_KEY,
      JSON.stringify(images)
    );
  } catch {
    // ignore storage quota errors
  }
}

export function clearCustomMascotImagesFromStorage(): BuddyMascotImagesSet {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(BUDDY_MASCOT_IMAGES_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return DEFAULT_BUILTIN_MASCOT_IMAGES;
}

/**
 * Slices a 3-panel horizontal concept sheet image (from DataURL or Image URL) into 3 square circular-ready Data URLs:
 * - Left Panel (x = 0 to w/3, y = 0 to h * 0.78) -> mascotActive (Ativo 👍)
 * - Center Panel (x = w/3 to 2*w/3, y = 0 to h * 0.78) -> mascotInactive (Inativo / De Costas)
 * - Right Panel (x = 2*w/3 to w, y = 0 to h * 0.78) -> mascotDelivery (Em Entrega 🚀)
 */
export async function sliceThreePoseMascotSheetFromDataUrl(
  dataUrl: string,
  outSize = 136
): Promise<BuddyMascotImagesSet> {
  // Check if dataUrl is actually a JSON package of already-sliced 3 poses from clipboard/bridge
  const maybePreSliced = parseMascotClipboardOrJsonText(dataUrl);
  if (maybePreSliced) {
    saveMascotImagesToStorage(maybePreSliced);
    return maybePreSliced;
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Formato de imagem inválido.'));
    el.src = dataUrl;
  });

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const isHorizontalSheet = w >= h * 1.35;
  const panelW = isHorizontalSheet ? w / 3 : w;
  // Crop out the bottom caption banner ("1 EXPLORADOR", "2 FOCO TOTAL", "3 SEMPRE MAIS LONGE") when horizontal 3-pose sheet
  const usableH = isHorizontalSheet ? h * 0.78 : h;

  const cropPanelToDataUrl = (panelIndex: 0 | 1 | 2): string => {
    const canvas = document.createElement('canvas');
    canvas.width = outSize;
    canvas.height = outSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return DEFAULT_BUILTIN_MASCOT_IMAGES.mascotActive;

    const sxRaw = isHorizontalSheet ? panelIndex * panelW : 0;
    const syRaw = 0;
    const side = Math.min(panelW * 0.94, usableH * 0.94);
    const sx = sxRaw + (panelW - side) / 2;
    const sy = syRaw + Math.max(0, (usableH - side) * 0.38);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, outSize, outSize);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize);

    // Use compact high-clarity JPEG (0.82) so each pose is ~2.2 KB for instant Cloud Bridge & Native Overlay sync
    const jpegUrl = canvas.toDataURL('image/jpeg', 0.82);
    return jpegUrl.startsWith('data:image/')
      ? jpegUrl
      : canvas.toDataURL('image/png');
  };

  const sliced: BuddyMascotImagesSet = {
    mascotActive: cropPanelToDataUrl(0),
    mascotInactive: cropPanelToDataUrl(1),
    mascotDelivery: cropPanelToDataUrl(2),
    isCustomUploaded: true,
  };

  saveMascotImagesToStorage(sliced);
  return sliced;
}

export async function sliceThreePoseMascotSheetFile(
  file: File | Blob
): Promise<BuddyMascotImagesSet> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () =>
      reject(new Error('Falha ao ler ficheiro de imagem.'));
    reader.readAsDataURL(file);
  });

  return sliceThreePoseMascotSheetFromDataUrl(dataUrl);
}

export function serializeMascotImagesForClipboard(
  images: BuddyMascotImagesSet
): string {
  return `${BUDDY_MASCOT_CLIPBOARD_PREFIX}${JSON.stringify({
    mascotActive: images.mascotActive,
    mascotInactive: images.mascotInactive,
    mascotDelivery: images.mascotDelivery,
    isCustomUploaded: true,
    ts: Date.now(),
  })}`;
}

export function parseMascotClipboardOrJsonText(
  rawText: string
): BuddyMascotImagesSet | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();
  const jsonPart = trimmed.startsWith(BUDDY_MASCOT_CLIPBOARD_PREFIX)
    ? trimmed.slice(BUDDY_MASCOT_CLIPBOARD_PREFIX.length).trim()
    : trimmed.startsWith('{')
    ? trimmed
    : '';
  if (!jsonPart) return null;
  try {
    const parsed = JSON.parse(jsonPart) as Partial<BuddyMascotImagesSet>;
    if (
      parsed &&
      typeof parsed.mascotActive === 'string' &&
      parsed.mascotActive.startsWith('data:image/') &&
      typeof parsed.mascotInactive === 'string' &&
      parsed.mascotInactive.startsWith('data:image/') &&
      typeof parsed.mascotDelivery === 'string' &&
      parsed.mascotDelivery.startsWith('data:image/')
    ) {
      return {
        mascotActive: parsed.mascotActive,
        mascotInactive: parsed.mascotInactive,
        mascotDelivery: parsed.mascotDelivery,
        isCustomUploaded: true,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Publishes the 3 sliced mascot poses from External Chrome to the Cloud Bridge
 * (`ntfy.sh` instant pub/sub + Supabase `direct_messages` if configured)
 * so the installed Delivery Buddy app receives them automatically without reinstalling the APK.
 */
export async function publishMascotImagesToCloudBridge(
  images: BuddyMascotImagesSet,
  syncId: string,
  supabaseConfig?: { supabaseUrl?: string; supabaseAnonKey?: string }
): Promise<boolean> {
  const cleanSyncId =
    (syncId || 'amarante_default').replace(/[^a-z0-9_-]/gi, '').toLowerCase() ||
    'amarante_default';
  const batchTs = Date.now();
  const topics = Array.from(
    new Set([`db_mascot_${cleanSyncId}`, 'db_mascot_amarante_global'])
  );

  // Ensure each pose fits well under 3.6 KB for ntfy.sh by downscaling if needed
  const compressPoseForRelay = async (srcDataUrl: string): Promise<string> => {
    if (srcDataUrl.length <= 3200) return srcDataUrl;
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('err'));
        el.src = srcDataUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');
      if (!ctx) return srcDataUrl;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 96, 96);
      ctx.drawImage(img, 0, 0, 96, 96);
      return canvas.toDataURL('image/jpeg', 0.72);
    } catch {
      return srcDataUrl;
    }
  };

  const [activeCompact, inactiveCompact, deliveryCompact] = await Promise.all([
    compressPoseForRelay(images.mascotActive),
    compressPoseForRelay(images.mascotInactive),
    compressPoseForRelay(images.mascotDelivery),
  ]);

  let anyOk = false;

  // 1. Publish to ntfy.sh topics (instant zero-config HTTPS relay)
  for (const topic of topics) {
    try {
      const poses: { pose: 'ACTIVE' | 'INACTIVE' | 'DELIVERY'; dataUrl: string }[] = [
        { pose: 'ACTIVE', dataUrl: activeCompact },
        { pose: 'INACTIVE', dataUrl: inactiveCompact },
        { pose: 'DELIVERY', dataUrl: deliveryCompact },
      ];
      for (const item of poses) {
        const res = await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            pose: item.pose,
            ts: batchTs,
            syncId: cleanSyncId,
            dataUrl: item.dataUrl,
          }),
        });
        if (res.ok) anyOk = true;
      }
    } catch {
      // ignore network error
    }
  }

  // 2. Also publish to Supabase direct_messages if configured
  const sbUrl = (supabaseConfig?.supabaseUrl || '').trim().replace(/\/+$/, '');
  const sbKey = (supabaseConfig?.supabaseAnonKey || '').trim();
  if (sbUrl && sbKey && sbUrl.includes('.supabase.co')) {
    try {
      const res = await fetch(`${sbUrl}/rest/v1/direct_messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          sender_id: cleanSyncId,
          sender_callsign: 'MASCOT_CLOUD_BRIDGE',
          recipient_id: cleanSyncId,
          channel_type: 'DIRECT_1ON1',
          message_body: serializeMascotImagesForClipboard({
            mascotActive: activeCompact,
            mascotInactive: inactiveCompact,
            mascotDelivery: deliveryCompact,
            isCustomUploaded: true,
          }),
          dictated_by_voice: false,
          created_at: new Date().toISOString(),
        }),
      });
      if (res.ok) anyOk = true;
    } catch {
      // ignore
    }
  }

  return anyOk;
}

/**
 * Polls the Cloud Bridge (`ntfy.sh`) for newly uploaded 3-pose mascot images from External Chrome.
 */
export async function pollMascotImagesFromCloudBridge(
  syncId: string,
  lastBatchTsRef: { current: number }
): Promise<BuddyMascotImagesSet | null> {
  const cleanSyncId =
    (syncId || 'amarante_default').replace(/[^a-z0-9_-]/gi, '').toLowerCase() ||
    'amarante_default';
  const topics = [`db_mascot_${cleanSyncId}`, 'db_mascot_amarante_global'];

  for (const topic of topics) {
    try {
      const res = await fetch(
        `https://ntfy.sh/${topic}/json?poll=1&since=15m`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );
      if (!res.ok) continue;
      const text = await res.text();
      if (!text.trim()) continue;

      const lines = text.trim().split('\n');
      let latestActive = '';
      let latestInactive = '';
      let latestDelivery = '';
      let newestTs = lastBatchTsRef.current;

      for (const line of lines) {
        try {
          const outer = JSON.parse(line) as { message?: string };
          if (!outer?.message) continue;
          const inner = JSON.parse(outer.message) as {
            pose?: string;
            ts?: number;
            dataUrl?: string;
          };
          const msgTs = Number(inner.ts || 0);
          if (
            msgTs > lastBatchTsRef.current &&
            typeof inner.dataUrl === 'string' &&
            inner.dataUrl.startsWith('data:image/')
          ) {
            if (msgTs > newestTs) newestTs = msgTs;
            if (inner.pose === 'ACTIVE') latestActive = inner.dataUrl;
            if (inner.pose === 'INACTIVE') latestInactive = inner.dataUrl;
            if (inner.pose === 'DELIVERY') latestDelivery = inner.dataUrl;
          }
        } catch {
          // ignore malformed line
        }
      }

      if (latestActive && latestInactive && latestDelivery) {
        lastBatchTsRef.current = newestTs;
        const synced: BuddyMascotImagesSet = {
          mascotActive: latestActive,
          mascotInactive: latestInactive,
          mascotDelivery: latestDelivery,
          isCustomUploaded: true,
        };
        saveMascotImagesToStorage(synced);
        return synced;
      }
    } catch {
      // ignore network error
    }
  }

  return null;
}

export function loadSavedBubbleRestingPreset(): BubbleRestingPreset {
  if (typeof window === 'undefined') return 'BOTTOM_RIGHT';
  try {
    const raw = window.localStorage.getItem(BUBBLE_RESTING_PRESET_STORAGE_KEY);
    if (
      raw === 'BOTTOM_RIGHT' ||
      raw === 'BOTTOM_LEFT' ||
      raw === 'MIDDLE_RIGHT' ||
      raw === 'MIDDLE_LEFT' ||
      raw === 'CUSTOM_DRAG'
    ) {
      return raw;
    }
  } catch {
    // ignore
  }
  return 'BOTTOM_RIGHT';
}

export function saveBubbleRestingPreset(preset: BubbleRestingPreset): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BUBBLE_RESTING_PRESET_STORAGE_KEY, preset);
  } catch {
    // ignore
  }
}

export function syncMascotImagesToNativeBridge(
  images: BuddyMascotImagesSet
): void {
  if (typeof window === 'undefined') return;
  const winAny = window as unknown as {
    BuddyNativeOverlay?: {
      setBubbleMascotImages?: (
        inactiveBase64: string,
        activeBase64: string,
        deliveryBase64: string
      ) => void;
    };
  };
  try {
    if (images.isCustomUploaded) {
      winAny.BuddyNativeOverlay?.setBubbleMascotImages?.(
        images.mascotInactive,
        images.mascotActive,
        images.mascotDelivery
      );
    } else {
      winAny.BuddyNativeOverlay?.setBubbleMascotImages?.('', '', '');
    }
  } catch {
    // ignore bridge errors
  }
}

export function syncMascotStateToNativeBridge(state: BuddyMascotState): void {
  if (typeof window === 'undefined') return;
  const winAny = window as unknown as {
    BuddyNativeOverlay?: {
      setBubbleMascotState?: (state: string) => void;
    };
  };
  try {
    winAny.BuddyNativeOverlay?.setBubbleMascotState?.(state);
  } catch {
    // ignore
  }
}

export function syncBubbleRestingPresetToNativeBridge(
  preset: BubbleRestingPreset
): void {
  if (typeof window === 'undefined') return;
  const winAny = window as unknown as {
    BuddyNativeOverlay?: {
      setBubbleRestingPreset?: (preset: string) => void;
    };
  };
  try {
    winAny.BuddyNativeOverlay?.setBubbleRestingPreset?.(preset);
  } catch {
    // ignore
  }
}
