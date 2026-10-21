import { PlatformName } from '../types/models';

export type OrderTrafficLightVerdict =
  | 'ACEITAR'
  | 'AVALIAR'
  | 'RECUSAR'
  | 'GREEN_ACCEPT'
  | 'YELLOW_EVALUATE'
  | 'RED_DECLINE';
export type TrafficLightVerdict = OrderTrafficLightVerdict;

export interface PlatformActionButtonTemplate {
  acceptLabels: string[];
  declineLabels: string[];
  chatInputHints: string[];
  acceptButtonCoordsPct: { xPct: number; yPct: number };
  declineButtonCoordsPct: { xPct: number; yPct: number };
  chatInputCoordsPct: { xPct: number; yPct: number };
}

export interface LearnedPlatformScreenTemplate {
  platform: PlatformName;
  packageNames: string[];
  euroRegexSource: string;
  kmRegexSource: string;
  minutesRegexSource: string;
  actionButtons: PlatformActionButtonTemplate;
  learnedRestaurants: string[];
  learnedStreets: string[];
  learnedScanCount: number;
  learnedSamplesCount?: number;
  acceptButtonBounds?: { xRatio: number; yRatio: number };
  rejectButtonBounds?: { xRatio: number; yRatio: number };
  lastUpdatedIso: string;
}

export type PlatformScreenTemplate = LearnedPlatformScreenTemplate;

export interface ParsedOrderScreenResult {
  platform: PlatformName;
  grossEur: number;
  distanceKm: number;
  estimatedMinutes: number;
  pickupName: string;
  dropoffAddress: string;
  netProfitEur: number;
  netEurPerKm: number;
  netEurPerHour: number;
  verdict: OrderTrafficLightVerdict;
  verdictBadgeLabel: string;
  spokenSummaryPt: string;
  actionButtons: PlatformActionButtonTemplate;
}

const LEARNED_TEMPLATES_STORAGE_KEY = 'buddy_learned_order_templates_v1';

export const PRETRAINED_PORTUGAL_PLATFORM_TEMPLATES: Record<
  PlatformName,
  LearnedPlatformScreenTemplate
> = {
  Glovo: {
    platform: 'Glovo',
    packageNames: ['com.glovo.rider', 'com.glovoapp.rider', 'com.glovo.courier'],
    euroRegexSource: '(?:(\\d{1,3}[.,]\\d{2})\\s*€|€\\s*(\\d{1,3}[.,]\\d{2}))',
    kmRegexSource: '(\\d{1,2}(?:[.,]\\d{1,2})?)\\s*km\\b',
    minutesRegexSource: '(\\d{1,3})\\s*min\\b',
    actionButtons: {
      acceptLabels: ['Aceitar', 'Aceitar pedido', 'Confirmar', 'Aceitar oferta'],
      declineLabels: ['Recusar', 'Rejeitar', 'Ignorar'],
      chatInputHints: [
        'Escreve uma mensagem',
        'Enviar mensagem ao cliente',
        'Mensagem',
      ],
      acceptButtonCoordsPct: { xPct: 50, yPct: 89 },
      declineButtonCoordsPct: { xPct: 86, yPct: 12 },
      chatInputCoordsPct: { xPct: 45, yPct: 92 },
    },
    learnedRestaurants: [
      'McDonald’s Amarante',
      'Burger King Amarante',
      'Pizzaria Tâmega',
      'Continente Amarante',
      'KFC Amarante',
      'Confeitaria da Ponte (São Gonçalo)',
    ],
    learnedStreets: [
      'Av. General Silveira — Amarante Centro',
      'Largo de São Gonçalo — Amarante',
      'Rua Cândido dos Reis — Centro Histórico',
      'Santa Luzia / Rua 31 de Janeiro — Cepelos',
      'Av. 1.º de Maio — Telões / Retail',
      'Rua Dr. Miguel Pinto Martins — Madalena',
    ],
    learnedScanCount: 18,
    lastUpdatedIso: '2026-10-21T10:00:00.000Z',
  },
  'Uber Eats': {
    platform: 'Uber Eats',
    packageNames: ['com.ubercab.driver'],
    euroRegexSource: '(?:(\\d{1,3}[.,]\\d{2})\\s*€|€\\s*(\\d{1,3}[.,]\\d{2}))',
    kmRegexSource: '(\\d{1,2}(?:[.,]\\d{1,2})?)\\s*km\\b',
    minutesRegexSource: '(\\d{1,3})\\s*min\\b',
    actionButtons: {
      acceptLabels: [
        'Aceitar',
        'Aceitar pedido',
        'Corresponder',
        'Confirmar',
        'Toque para aceitar',
      ],
      declineLabels: ['Recusar', 'Rejeitar', 'Ignorar', 'Fechar'],
      chatInputHints: [
        'Enviar mensagem',
        'Escreva uma mensagem',
        'Mensagem para o cliente',
      ],
      acceptButtonCoordsPct: { xPct: 50, yPct: 88 },
      declineButtonCoordsPct: { xPct: 88, yPct: 14 },
      chatInputCoordsPct: { xPct: 44, yPct: 91 },
    },
    learnedRestaurants: [
      'McDonald’s Amarante Drive',
      'Pingo Doce Amarante',
      'Restaurante Zé da Calçada',
      'Churrasqueira de São Gonçalo',
      'Subway Amarante',
    ],
    learnedStreets: [
      'Av. General Silveira — São Gonçalo',
      'Rua de Santa Luzia — Cepelos',
      'Urb. do Queimado — Amarante',
      'Freixo de Cima — EN15',
      'Padronelo — Amarante',
    ],
    learnedScanCount: 24,
    lastUpdatedIso: '2026-10-21T10:00:00.000Z',
  },
  'Bolt Food': {
    platform: 'Bolt Food',
    packageNames: ['ee.mtakso.driver', 'com.bolt.delivery'],
    euroRegexSource: '(?:(\\d{1,3}[.,]\\d{2})\\s*€|€\\s*(\\d{1,3}[.,]\\d{2}))',
    kmRegexSource: '(\\d{1,2}(?:[.,]\\d{1,2})?)\\s*km\\b',
    minutesRegexSource: '(\\d{1,3})\\s*min\\b',
    actionButtons: {
      acceptLabels: ['Aceitar', 'Aceitar pedido', 'Confirmar'],
      declineLabels: ['Rejeitar', 'Recusar', 'Ignorar'],
      chatInputHints: ['Mensagem', 'Escrever mensagem ao cliente'],
      acceptButtonCoordsPct: { xPct: 50, yPct: 90 },
      declineButtonCoordsPct: { xPct: 18, yPct: 90 },
      chatInputCoordsPct: { xPct: 46, yPct: 92 },
    },
    learnedRestaurants: [
      'Burger King Amarante',
      'Kebabs & Pizzas São Gonçalo',
      'Sushi Tâmega Amarante',
    ],
    learnedStreets: [
      'Largo Conselheiro António Cândido — Amarante',
      'Rua 31 de Janeiro — Santa Luzia',
      'Av. 1.º de Maio — Amarante',
    ],
    learnedScanCount: 11,
    lastUpdatedIso: '2026-10-21T10:00:00.000Z',
  },
};

export function loadLearnedPlatformTemplates(): Record<
  PlatformName,
  LearnedPlatformScreenTemplate
> {
  if (typeof window === 'undefined') {
    return PRETRAINED_PORTUGAL_PLATFORM_TEMPLATES;
  }
  try {
    const raw = window.localStorage.getItem(LEARNED_TEMPLATES_STORAGE_KEY);
    if (!raw) return PRETRAINED_PORTUGAL_PLATFORM_TEMPLATES;
    const parsed = JSON.parse(raw) as Partial<
      Record<PlatformName, LearnedPlatformScreenTemplate>
    >;
    return {
      Glovo: {
        ...PRETRAINED_PORTUGAL_PLATFORM_TEMPLATES.Glovo,
        ...(parsed.Glovo || {}),
      },
      'Uber Eats': {
        ...PRETRAINED_PORTUGAL_PLATFORM_TEMPLATES['Uber Eats'],
        ...(parsed['Uber Eats'] || {}),
      },
      'Bolt Food': {
        ...PRETRAINED_PORTUGAL_PLATFORM_TEMPLATES['Bolt Food'],
        ...(parsed['Bolt Food'] || {}),
      },
    };
  } catch {
    return PRETRAINED_PORTUGAL_PLATFORM_TEMPLATES;
  }
}

export function saveLearnedPlatformTemplates(
  templates: Record<PlatformName, LearnedPlatformScreenTemplate>
): Record<PlatformName, LearnedPlatformScreenTemplate> {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        LEARNED_TEMPLATES_STORAGE_KEY,
        JSON.stringify(templates)
      );
      window.dispatchEvent(new CustomEvent('buddy-learned-templates-updated'));
      window.dispatchEvent(new CustomEvent('buddy-order-template-updated'));
    } catch {
      // ignore storage errors
    }
  }
  return templates;
}

export function saveLearnedPlatformTemplate(
  template: LearnedPlatformScreenTemplate
): Record<PlatformName, LearnedPlatformScreenTemplate> {
  const current = loadLearnedPlatformTemplates();
  const next: Record<PlatformName, LearnedPlatformScreenTemplate> = {
    ...current,
    [template.platform]: {
      ...template,
      lastUpdatedIso: new Date().toISOString(),
    },
  };
  return saveLearnedPlatformTemplates(next);
}

export function resolvePlatformFromPackageOrText(
  rawTextOrPkg: string,
  fallback: PlatformName = 'Glovo'
): PlatformName {
  const lower = (rawTextOrPkg || '').toLowerCase();
  if (lower.includes('ubercab') || lower.includes('uber')) {
    return 'Uber Eats';
  }
  if (lower.includes('mtakso') || lower.includes('bolt')) {
    return 'Bolt Food';
  }
  if (lower.includes('glovo')) {
    return 'Glovo';
  }
  return fallback;
}

/**
 * Extracts Gross Price (€), Distance (km), Estimated Time (min), Pickup Store & Dropoff Address
 * from raw screen text / Accessibility nodes / OCR and computes the Traffic-Light Verdict:
 * - 🟢 ACEITAR
 * - 🟡 AVALIAR
 * - 🔴 RECUSAR
 */
export function parseOrderScreenText(
  paramsOrRawText:
    | {
        rawText: string;
        platformHint?: PlatformName;
        costPerKmEur?: number;
        taxPct?: number;
        minTargetEurPerKm?: number;
        minTargetGrossEur?: number;
      }
    | string,
  pkgOrPlatformHint?: string,
  costPerKmEurArg?: number
): ParsedOrderScreenResult {
  const params =
    typeof paramsOrRawText === 'string'
      ? {
          rawText: paramsOrRawText,
          platformHint: resolvePlatformFromPackageOrText(
            pkgOrPlatformHint || paramsOrRawText,
            'Glovo'
          ),
          costPerKmEur: costPerKmEurArg,
        }
      : paramsOrRawText;

  const {
    rawText,
    platformHint = 'Glovo',
    costPerKmEur = 0.16,
    taxPct = 0.11,
    minTargetEurPerKm = 1.15,
    minTargetGrossEur = 4.0,
  } = params;

  const platform = resolvePlatformFromPackageOrText(rawText, platformHint);
  const templates = loadLearnedPlatformTemplates();
  const tpl = templates[platform] || PRETRAINED_PORTUGAL_PLATFORM_TEMPLATES[platform];

  // 1. Gross Price (€): \d+[.,]\d{2}\s*€ or €\s*\d+[.,]\d{2}
  const euroMatch1 = rawText.match(/(\d{1,3}[.,]\d{2})\s*€/i);
  const euroMatch2 = rawText.match(/€\s*(\d{1,3}[.,]\d{2})/i);
  const rawEuroStr = euroMatch1?.[1] || euroMatch2?.[1] || '5.50';
  const grossEur = Number(
    Math.max(1.5, Math.min(120, parseFloat(rawEuroStr.replace(',', '.')) || 5.5)).toFixed(2)
  );

  // 2. Distance (km): \d+([.,]\d+)?\s*km
  const kmMatch = rawText.match(/(\d{1,2}(?:[.,]\d{1,2})?)\s*km\b/i);
  const rawKmStr = kmMatch?.[1] || '3.1';
  const distanceKm = Number(
    Math.max(0.3, Math.min(65, parseFloat(rawKmStr.replace(',', '.')) || 3.1)).toFixed(1)
  );

  // 3. Estimated Time (min): \d+\s*min
  const minMatch = rawText.match(/(\d{1,3})\s*min\b/i);
  const estimatedMinutes = minMatch?.[1]
    ? Math.max(4, Math.min(120, parseInt(minMatch[1], 10)))
    : Math.max(6, Math.round(distanceKm * 3.8));

  // 4. Pickup (Restaurante/Loja) & Dropoff Address (Morada)
  let pickupName =
    tpl.learnedRestaurants.find((r) =>
      rawText.toLowerCase().includes(r.toLowerCase().split(' ')[0])
    ) || `${platform} • ${tpl.learnedRestaurants[0] || 'Amarante Centro'}`;

  let dropoffAddress =
    tpl.learnedStreets.find((s) =>
      rawText.toLowerCase().includes(s.toLowerCase().split('—')[0].trim())
    ) ||
    tpl.learnedStreets[0] ||
    'Av. General Silveira — Amarante';

  const streetRegex =
    /(?:Rua|Av\.|Avenida|Largo|Travessa|Rotunda|Praceta|Urbanização|EN15)\s+[^\n|,;]{4,48}/gi;
  const streetMatches = rawText.match(streetRegex);
  if (streetMatches && streetMatches.length > 0) {
    dropoffAddress = streetMatches[streetMatches.length - 1].trim();
    if (streetMatches.length >= 2) {
      pickupName = streetMatches[0].trim();
    }
  }

  // 5. Net Profit (€ líq.), €/km, €/h
  const taxDeduction = grossEur * Math.max(0, Math.min(0.35, taxPct));
  const vehicleDeduction = distanceKm * Math.max(0.08, costPerKmEur);
  const netProfitEur = Number(
    Math.max(0.25, grossEur - taxDeduction - vehicleDeduction).toFixed(2)
  );
  const netEurPerKm = Number((netProfitEur / Math.max(0.2, distanceKm)).toFixed(2));
  const netEurPerHour = Number(
    ((netProfitEur / Math.max(5, estimatedMinutes)) * 60).toFixed(2)
  );

  // 6. Traffic-Light Verdict (🟢 ACEITAR / 🟡 AVALIAR / 🔴 RECUSAR)
  let verdict: OrderTrafficLightVerdict = 'RECUSAR';
  let verdictBadgeLabel = '🔴 RECUSAR';

  if (netEurPerKm >= minTargetEurPerKm && grossEur >= minTargetGrossEur) {
    verdict = 'ACEITAR';
    verdictBadgeLabel = '🟢 ACEITAR';
  } else if (
    netEurPerKm >= minTargetEurPerKm * 0.85 &&
    grossEur >= minTargetGrossEur * 0.85
  ) {
    verdict = 'AVALIAR';
    verdictBadgeLabel = '🟡 AVALIAR';
  }

  const eurosSpoken = grossEur.toFixed(2).replace('.', ',');
  const kmSpoken = distanceKm.toFixed(1).replace('.', ',');
  const netSpoken = netProfitEur.toFixed(2).replace('.', ',');
  const perKmSpoken = netEurPerKm.toFixed(2).replace('.', ',');
  const perHourSpoken = netEurPerHour.toFixed(0);

  const verdictSpoken =
    verdict === 'ACEITAR'
      ? 'Veredito verde: compensa aceitar!'
      : verdict === 'AVALIAR'
        ? 'Veredito amarelo: avaliar pedido.'
        : 'Veredito vermelho: abaixo da meta, recusar!';

  const spokenSummaryPt = `Pedido ${platform}: ${eurosSpoken} euros para ${kmSpoken} quilómetros. Líquido ${netSpoken} euros, ${perKmSpoken} por quilómetro, ritmo ${perHourSpoken} euros por hora. ${verdictSpoken}`;

  return {
    platform,
    grossEur,
    distanceKm,
    estimatedMinutes,
    pickupName,
    dropoffAddress,
    netProfitEur,
    netEurPerKm,
    netEurPerHour,
    verdict,
    verdictBadgeLabel,
    spokenSummaryPt,
    actionButtons: tpl.actionButtons,
  };
}

/**
 * Self-Learning Visual Calibration ("Ensinar Tela ao Buddy"):
 * Updates the platform's learned restaurants, addresses, and button coordinates whenever
 * a courier scans an order screenshot/photo via "📷 Ler Pedido" or calibrates coordinates.
 */
export function learnFromScannedOrderSample(params: {
  platform: PlatformName;
  grossEur?: number;
  distanceKm?: number;
  estimatedMinutes?: number;
  pickupName?: string;
  originName?: string;
  dropoffAddress?: string;
  destinationName?: string;
  acceptCoordsPct?: { xPct: number; yPct: number };
  declineCoordsPct?: { xPct: number; yPct: number };
  acceptButtonXY?: { xRatio: number; yRatio: number };
  rejectButtonXY?: { xRatio: number; yRatio: number };
}): Record<PlatformName, LearnedPlatformScreenTemplate> {
  const templates = loadLearnedPlatformTemplates();
  const existing =
    templates[params.platform] ||
    PRETRAINED_PORTUGAL_PLATFORM_TEMPLATES[params.platform];

  const cleanPickup = (params.pickupName || params.originName || '').trim();
  const cleanDropoff = (
    params.dropoffAddress ||
    params.destinationName ||
    ''
  ).trim();

  const updatedRestaurants = cleanPickup
    ? Array.from(new Set([cleanPickup, ...existing.learnedRestaurants])).slice(
        0,
        25
      )
    : existing.learnedRestaurants;

  const updatedStreets = cleanDropoff
    ? Array.from(new Set([cleanDropoff, ...existing.learnedStreets])).slice(
        0,
        30
      )
    : existing.learnedStreets;

  const nextAcceptPct = params.acceptCoordsPct
    ? params.acceptCoordsPct
    : params.acceptButtonXY
      ? {
          xPct: Math.round(params.acceptButtonXY.xRatio * 100),
          yPct: Math.round(params.acceptButtonXY.yRatio * 100),
        }
      : existing.actionButtons.acceptButtonCoordsPct;

  const nextDeclinePct = params.declineCoordsPct
    ? params.declineCoordsPct
    : params.rejectButtonXY
      ? {
          xPct: Math.round(params.rejectButtonXY.xRatio * 100),
          yPct: Math.round(params.rejectButtonXY.yRatio * 100),
        }
      : existing.actionButtons.declineButtonCoordsPct;

  const nextCount = (existing.learnedScanCount || 0) + 1;

  const updated: LearnedPlatformScreenTemplate = {
    ...existing,
    learnedRestaurants: updatedRestaurants,
    learnedStreets: updatedStreets,
    learnedScanCount: nextCount,
    learnedSamplesCount: nextCount,
    acceptButtonBounds: {
      xRatio: nextAcceptPct.xPct / 100,
      yRatio: nextAcceptPct.yPct / 100,
    },
    rejectButtonBounds: {
      xRatio: nextDeclinePct.xPct / 100,
      yRatio: nextDeclinePct.yPct / 100,
    },
    actionButtons: {
      ...existing.actionButtons,
      acceptButtonCoordsPct: nextAcceptPct,
      declineButtonCoordsPct: nextDeclinePct,
    },
    lastUpdatedIso: new Date().toISOString(),
  };

  return saveLearnedPlatformTemplate(updated);
}

/**
 * Triggers native Android AccessibilityService click action (ACTION_CLICK or gesture tap)
 * on the detected "Aceitar" or "Recusar" button when the courier says
 * "Buddy, aceitar pedido" or "Buddy, recusar pedido".
 */
export function triggerNativeOrderButtonClick(
  action: 'ACCEPT' | 'DECLINE' | 'REJECT',
  platform: PlatformName = 'Glovo',
  _customHint?: unknown
): boolean {
  if (typeof window === 'undefined') return false;
  const templates = loadLearnedPlatformTemplates();
  const tpl =
    templates[platform] || PRETRAINED_PORTUGAL_PLATFORM_TEMPLATES[platform];
  const normalizedAction = action === 'ACCEPT' ? 'ACCEPT' : 'DECLINE';
  const coords =
    normalizedAction === 'ACCEPT'
      ? tpl.actionButtons.acceptButtonCoordsPct
      : tpl.actionButtons.declineButtonCoordsPct;

  const winAny = window as unknown as {
    BuddyNativeOverlay?: {
      performNativeOrderAction?: (
        act: string,
        xPct: number,
        yPct: number
      ) => boolean;
    };
  };

  try {
    if (
      typeof winAny.BuddyNativeOverlay?.performNativeOrderAction === 'function'
    ) {
      return Boolean(
        winAny.BuddyNativeOverlay.performNativeOrderAction(
          normalizedAction,
          coords.xPct,
          coords.yPct
        )
      );
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Copies customer chat message to clipboard AND injects it into the active platform chat input
 * via Android AccessibilityService when the courier says:
 * - "Buddy, avisar cliente a caminho"
 * - "Buddy, avisar cliente cheguei"
 */
export function executeCustomerChatVoiceMacro(
  macroType: 'A_CAMINHO' | 'CHEGUEI',
  customMessage?: string
): string {
  const messageText =
    customMessage ||
    (macroType === 'CHEGUEI'
      ? 'Olá! Já cheguei à sua morada com o seu pedido. Muito obrigado!'
      : 'Olá! Já recolhi o seu pedido na loja e estou a caminho da sua morada.');

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      void navigator.clipboard.writeText(messageText);
    } catch {
      // ignore clipboard fallback
    }
  }

  if (typeof window !== 'undefined') {
    const winAny = window as unknown as {
      BuddyNativeOverlay?: {
        injectCustomerChatMessage?: (msg: string) => boolean;
      };
    };
    try {
      if (
        typeof winAny.BuddyNativeOverlay?.injectCustomerChatMessage ===
        'function'
      ) {
        winAny.BuddyNativeOverlay.injectCustomerChatMessage(messageText);
      }
    } catch {
      // ignore
    }
  }

  return messageText;
}
