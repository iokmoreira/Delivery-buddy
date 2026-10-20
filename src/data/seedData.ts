import {
  AdminBroadcastMessage,
  AdminManagedCourierRecord,
  AdminSponsoredCampaign,
  AiAgentMasterConfig,
  AiSkillLearningLogEntry,
  AlertPopupPreferences,
  AppTabId,
  B2BPartnerSponsorshipRecord,
  BuddyRewardsState,
  ComplaintRecord,
  ContextualHelpEntry,
  CourierVerifiedAccount,
  CustomAutoMessage,
  GlovoDailyWalletState,
  HeavyItemReference,
  IncomingContactRequest,
  LocationNoteCategory,
  LocationRouteNote,
  MasterUserPreferences,
  OnlineDirectoryCourier,
  OrderAuditedItem,
  PersonalGoalsState,
  RegionalExplorerDataset,
  RewardMarketplaceItem,
  RiderSafetyTelemetryState,
  RoadHazardPin,
  RoadHazardType,
  RouteTrapTag,
  ScannedOffer,
  ShiftTripLog,
  SocialBuddyPost,
  TacticalMapCell,
  TaxAndFleetConfigState,
  VehicleCostProfile,
  VoiceActivationConfig,
  WalkieMessage,
  ZonePactRule,
  EvidentiaryVaultRecord,
  PlatformLedgersMap,
} from '../types/models';

export const ROUTE_TRAP_QUICK_TAGS: RouteTrapTag[] = [
  'Zona Pedonal / Pilaretes (Bloqueado)',
  'Sentido Proibido / Trajeto Ilegal',
  'Escadaria / Passagem Pedonal',
  'Via Cortada / Obras Ignoradas',
  'Faixa Exclusiva BUS / Multa',
];

export const DEFAULT_VEHICLE_PROFILE: VehicleCostProfile = {
  vehicleType: 'Mota 125cc (Gasolina)',
  fuelOrEnergyPerKm: 0.06,
  maintenanceAndTiresPerKm: 0.04,
  insuranceAndTaxPerDay: 2.2,
  minTargetNetPerKm: 1.0,
  minTargetHourlyEur: 11.0,
  platformKmReferenceRate: 0.65,
};

export const SEED_COMPLAINTS: ComplaintRecord[] = [
  // =========================================================================
  // STEP 2: 3 PRE-POPULATED PORTUGUESE ROUTE TRAP RECORDS ("Rotas Ilegais / Desvios")
  // =========================================================================
  {
    id: 'TRP-PT-01',
    createdAt: '2026-10-17T18:10:00Z',
    category: 'ROTA_ILEGAL_DESVIO',
    platform: 'Glovo',
    cityZone: 'Amarante Centro / São Gonçalo',
    title: 'Zona Histórica Bloqueada por Pilaretes Hidráulicos (Desvio Obrigatório)',
    segmentOriginDest: 'São Gonçalo → Largo de Santa Luzia / Rua 31 de Janeiro',
    appAnnouncedKm: 2.1,
    realLegalKm: 4.4,
    unpaidDetourKm: 2.3,
    stolenTariffEur: 1.5,
    routeTrapTags: [
      'Zona Pedonal / Pilaretes (Bloqueado)',
      'Faixa Exclusiva BUS / Multa',
    ],
    description:
      'O algoritmo da Glovo traça linha direta pela zona pedonal histórica de São Gonçalo / Rua 31 de Janeiro fechada com pilaretes automáticos. Obriga a dar a volta completa pela Ponte Nova e EN15 (+2.3 km reais não pagos na tarifa).',
    confirmationsCount: 19,
  },
  {
    id: 'TRP-PT-02',
    createdAt: '2026-10-17T16:40:00Z',
    category: 'ROTA_ILEGAL_DESVIO',
    platform: 'Uber Eats',
    cityZone: 'Amarante — Freixo de Cima / Baixo',
    title: 'Atalho em Sentido Proibido Calculado como Rota Normal pela App',
    segmentOriginDest: 'Av. General Silveira → Travessa de Freixo de Baixo',
    appAnnouncedKm: 1.6,
    realLegalKm: 3.4,
    unpaidDetourKm: 1.8,
    stolenTariffEur: 1.17,
    routeTrapTags: [
      'Sentido Proibido / Trajeto Ilegal',
      'Via Cortada / Obras Ignoradas',
    ],
    description:
      'A Uber Eats calcula 1.6 km subindo uma travessa de sentido único proibido (contra-mão com sinal C1). O contorno legal pela rotunda da EN15 exige +1.8 km adicionais que a plataforma recusa pagar automaticamente.',
    confirmationsCount: 14,
  },
  {
    id: 'TRP-PT-03',
    createdAt: '2026-10-17T14:25:00Z',
    category: 'ROTA_ILEGAL_DESVIO',
    platform: 'Bolt Food',
    cityZone: 'Amarante — Margem Rio Tâmega',
    title: 'Escadaria Pedonal Ribeirinha Mapeada como Estrada para Motas',
    segmentOriginDest: 'Cais do Rio Tâmega → Largo Conselheiro António Cândido',
    appAnnouncedKm: 1.2,
    realLegalKm: 2.9,
    unpaidDetourKm: 1.7,
    stolenTariffEur: 1.11,
    routeTrapTags: [
      'Escadaria / Passagem Pedonal',
      'Zona Pedonal / Pilaretes (Bloqueado)',
    ],
    description:
      'O mapa da Bolt Food assume as escadarias pedonais junto ao Rio Tâmega como via transitável para veículos motorizados. Para subir legalmente são 2.9 km (+1.7 km de subida não paga).',
    confirmationsCount: 23,
  },

  // =========================================================================
  // STEP 1: CRITICAL RESTAURANTS, DIFFICULT CLIENTS & PLATFORM TARIFF ISSUES
  // =========================================================================
  {
    id: 'CMP-REST-01',
    createdAt: '2026-10-17T19:05:00Z',
    category: 'RESTAURANTE_CRITICO',
    platform: 'Bolt Food',
    cityZone: 'Amarante — Vila Meã / Retail',
    restaurantName: 'Burger King — Amarante Retail',
    avgWaitTimeMinutes: 32,
    title: 'Espera Crítica Superior a 30 Minutos e Pedidos Só Iniciados à Chegada',
    description:
      'Priorizam fila presencial e drive-thru em Amarante Retail. Estafetas aguardam em média 32 minutos na porta sem compensação de tempo de espera.',
    confirmationsCount: 31,
  },
  {
    id: 'CMP-REST-02',
    createdAt: '2026-10-17T13:15:00Z',
    category: 'RESTAURANTE_CRITICO',
    platform: 'Uber Eats',
    cityZone: 'Amarante — Vila Meã / Marco',
    restaurantName: "McDonald's — Vila Meã / Marco",
    avgWaitTimeMinutes: 27,
    title: 'Atraso Sistemático em Horas de Ponta (>25 min) e Parque Sem Lugar p/ Motas',
    description:
      'Sacos retidos no balcão interno sem atualização no ecrã de recolha.',
    confirmationsCount: 24,
  },
  {
    id: 'CMP-CLI-01',
    createdAt: '2026-10-16T21:40:00Z',
    category: 'CLIENTE_MORADA',
    platform: 'Glovo',
    cityZone: 'Amarante Centro / São Gonçalo',
    title: '4.º Andar Sem Elevador com 3 Garrafões de 6L + Código de Porta Errado',
    description:
      'Cliente em Av. General Silveira não atende chamadas nos primeiros 8 minutos e exige subida de 27 kg por escadas estreitas sem iluminação.',
    confirmationsCount: 9,
  },
  {
    id: 'CMP-TAR-01',
    createdAt: '2026-10-16T20:10:00Z',
    category: 'TARIFA_SUPORTE',
    platform: 'Uber Eats',
    cityZone: 'Amarante (25 km)',
    title: 'Segundo Pedido Agrupado (Duplo) Pago a Apenas +0,85 € Extra',
    description:
      'Adição de segunda recolha em restaurante distinto rumo a Freixo de Cima com +2.4 km adicionais remunerada abaixo do custo de combustível.',
    confirmationsCount: 42,
  },
];

// =========================================================================
// STEP 2: 5 REALISTIC AMARANTE (25 KM) OFFER SIMULATOR PRESETS FOR SCANNER
// =========================================================================
export const SCANNER_OFFER_PRESETS: ScannedOffer[] = [
  {
    id: 'PRESET-1-CLEAN',
    presetNumber: 1,
    presetBadge: '1. Oferta Limpa (7,80 €)',
    platform: 'Uber Eats',
    grossAmountEur: 7.8,
    appAnnouncedKm: 3.2,
    estimatedMinutes: 14,
    originName: 'Pizzaria Tâmega — Centro',
    destinationName: 'Freixo de Cima (EN15)',
    segmentText: 'Pizzaria Tâmega — Centro → Freixo de Cima',
    cityZone: 'Amarante Centro / São Gonçalo',
    ocrRawSnippet:
      'UBER EATS • INCLUI GORJETA ESTIMADA • 7,80 € • 14 min (3.2 km) Total • Recolha: Pizzaria Tâmega — Centro • Entrega: Freixo de Cima',
  },
  {
    id: 'PRESET-2-ROUTE-TRAP',
    presetNumber: 2,
    presetBadge: '2. Rota Proibida (4,50 €)',
    platform: 'Glovo',
    grossAmountEur: 4.5,
    appAnnouncedKm: 2.1,
    estimatedMinutes: 19,
    originName: 'Taberna do Tâmega — São Gonçalo',
    destinationName: 'Largo de Santa Luzia / Rua 31 de Janeiro',
    segmentText: 'São Gonçalo → Largo de Santa Luzia / Rua 31 de Janeiro',
    cityZone: 'Amarante Centro / São Gonçalo',
    matchedRouteTrapId: 'TRP-PT-01',
    ocrRawSnippet:
      'GLOVO • NOVA OFERTA • 4,50 € • Distância calculada: 2.1 km • Recolha: Taberna do Tâmega (São Gonçalo) • Entrega: Largo de Santa Luzia',
  },
  {
    id: 'PRESET-3-SPLIT-ORDER',
    presetNumber: 3,
    presetBadge: '3. Pedido Dividido / Supermercado (27,0 kg)',
    platform: 'Glovo',
    grossAmountEur: 9.8,
    appAnnouncedKm: 2.8,
    estimatedMinutes: 18,
    originName: 'Continente Modelo — Amarante',
    destinationName: 'Av. General Silveira (4.º Andar)',
    segmentText: 'Continente Modelo — Amarante → Av. General Silveira',
    cityZone: 'Amarante Centro / São Gonçalo',
    orderId: '#4829',
    isSplitOrderCandidate: true,
    itemsCountLabel: '3 artigos pesados (27.0 kg — Grade Cerveja + 2x Garrafões 6L)',
    splitOrderVolumeWarning:
      'Detetado Pedido #4829 (Zona: Av. General Silveira / Amarante) de supermercado com 27.0 kg! Exige divisão de carga com 2.º estafeta parceiro.',
    ocrRawSnippet:
      'GLOVO SUPERMERCADO • Pedido #4829 • Zona: Av. General Silveira (Amarante) • 9,80 € • 2.8 km • Peso auditado 27.0 kg • Entrega partilhada ativa',
  },
  {
    id: 'PRESET-4-CRITICAL-REST',
    presetNumber: 4,
    presetBadge: '4. Espera Crítica >25m (4,20 €)',
    platform: 'Bolt Food',
    grossAmountEur: 4.2,
    appAnnouncedKm: 2.6,
    estimatedMinutes: 22,
    originName: 'Burger King — Amarante Retail',
    destinationName: 'Vila Meã (EN15)',
    segmentText: 'Burger King — Amarante Retail → Vila Meã',
    cityZone: 'Amarante — Vila Meã',
    matchedRestaurantComplaintId: 'CMP-REST-01',
    ocrRawSnippet:
      'BOLT FOOD • 4,20 € • 2.6 km • Recolha: Burger King — Amarante Retail • Entrega: Vila Meã (EN15)',
  },
  {
    id: 'PRESET-5-BLACKLISTED-EST',
    presetNumber: 5,
    presetBadge: '5. Lista Negra Auto-Recusa (6,80 €)',
    platform: 'Uber Eats',
    grossAmountEur: 6.8,
    appAnnouncedKm: 2.4,
    estimatedMinutes: 16,
    originName: "McDonald's — Vila Meã / Marco (Espera Crítica)",
    destinationName: 'Pingo Doce — São Gonçalo',
    segmentText: "McDonald's — Vila Meã / Marco → São Gonçalo",
    cityZone: 'Amarante — Vila Meã / Marco',
    ocrRawSnippet:
      "UBER EATS • 6,80 € • 2.4 km • Recolha: McDonald's — Vila Meã / Marco (Espera Crítica) • Entrega: São Gonçalo",
  },
];

export const SEED_SHIFT_TRIPS: ShiftTripLog[] = [
  {
    id: 'SHF-101',
    timestamp: '2026-10-17T19:45:00Z',
    platform: 'Uber Eats',
    segment: 'Pizzaria Tâmega — Centro → Freixo de Cima',
    grossEur: 7.8,
    realKm: 3.2,
    netProfitEur: 7.48,
    netEurPerKm: 2.34,
    verdict: 'ACEITE',
  },
  {
    id: 'SHF-102',
    timestamp: '2026-10-17T20:15:00Z',
    platform: 'Glovo',
    segment: 'São Gonçalo → Largo de Santa Luzia (Desvio +2.3 km)',
    grossEur: 4.5,
    realKm: 4.4,
    netProfitEur: 4.06,
    netEurPerKm: 0.92,
    verdict: 'RECUSADA',
  },
  {
    id: 'SHF-103',
    timestamp: '2026-10-17T20:40:00Z',
    platform: 'Bolt Food',
    segment: 'Pingo Doce — São Gonçalo → Vila Meã',
    grossEur: 6.2,
    realKm: 2.5,
    netProfitEur: 5.95,
    netEurPerKm: 2.38,
    verdict: 'ACEITE',
  },
];

// =========================================================================
// STEP 3: PORTUGUESE HEAVY ITEM REFERENCE DATABASE (INCLUDING GLASS PACKAGING)
// =========================================================================
export const HEAVY_ITEMS_DB: HeavyItemReference[] = [
  {
    id: 'ITEM-GRADE-CERVEJA-24',
    name: 'Caixa/Grade de Cerveja (24x 33cl Vidro)',
    unitWeightKg: 14.8,
    includesGlassPackaging: true,
    singleItemOverloadAlert: true,
  },
  {
    id: 'ITEM-PACK-CERVEJA-6',
    name: 'Pack Cerveja (6x 33cl Vidro)',
    unitWeightKg: 3.8,
    includesGlassPackaging: true,
  },
  {
    id: 'ITEM-GARRAFAO-AGUA-6L',
    name: 'Garrafão de Água (6L)',
    unitWeightKg: 6.1,
  },
  {
    id: 'ITEM-PACK-LEITE-SUMOS-6X1L',
    name: 'Pack 6x Leite / Sumos (6x 1L)',
    unitWeightKg: 6.2,
  },
  {
    id: 'ITEM-SACO-BATATAS-ARROZ-5KG',
    name: 'Saco Batatas / Arroz (5kg)',
    unitWeightKg: 5.0,
  },
];

// Default audited items: 0 heavy items = 2.4 kg normal order weight (Preset 3 sets 27.0 kg)
export const DEFAULT_AUDITED_ITEMS: OrderAuditedItem[] = [
  { itemId: 'ITEM-GRADE-CERVEJA-24', quantity: 0 },
  { itemId: 'ITEM-GARRAFAO-AGUA-6L', quantity: 0 },
  { itemId: 'ITEM-PACK-CERVEJA-6', quantity: 0 },
  { itemId: 'ITEM-PACK-LEITE-SUMOS-6X1L', quantity: 0 },
  { itemId: 'ITEM-SACO-BATATAS-ARROZ-5KG', quantity: 0 },
];

export const WALKIE_QUICK_MACROS: string[] = [
  'Restaurante com fila caos',
  'Fiscalização na rotunda',
  'Alguém com a outra metade do pedido?',
];

export const PROFANITY_BLOCKLIST_PT: string[] = [
  'idiota',
  'estupido',
  'estúpido',
  'otario',
  'otário',
  'burro',
  'palhaco',
  'palhaço',
  'merda',
  'porra',
  'caralho',
  'foda',
  'puta',
  'cabrao',
  'cabrão',
  'roubo',
  'lixo',
];

export const NEARBY_COURIER_PEERS = [
  {
    id: 'PEER-TIAGO',
    name: 'Tiago R. - Mota (Parceiro #4829)',
    vehicle: 'Mota 125cc',
    trustScore: 99,
  },
  {
    id: 'PEER-CARLOS',
    name: 'Carlos M. - Scooter',
    vehicle: 'PCX 125',
    trustScore: 96,
  },
  {
    id: 'PEER-INES',
    name: 'Inês V. - E-Bike',
    vehicle: 'Bicicleta Elétrica',
    trustScore: 98,
  },
];

export const SEED_WALKIE_MESSAGES: WalkieMessage[] = [
  // Channel 1: Parceiro Pedido Dividido (1-on-1 with Tiago R. - Mota)
  {
    id: 'MSG-SPLIT-01',
    channel: 'PARCEIRO_PEDIDO_DIVIDIDO',
    senderId: 'PEER-TIAGO',
    senderName: 'Tiago R. - Mota',
    senderVehicle: 'Honda PCX 125',
    senderTrustScore: 99,
    timestamp: '22:18',
    text: 'Boas colega! Fui atribuído como 2.º estafeta ao Pedido #4829 (Av. General Silveira — Amarante) no Continente Modelo. São 27.0 kg no total!',
    isVoicePtt: true,
    voiceDurationSec: 6,
    communityFlagsCount: 0,
  },
  {
    id: 'MSG-SPLIT-02',
    channel: 'PARCEIRO_PEDIDO_DIVIDIDO',
    senderId: 'PEER-TIAGO',
    senderName: 'Tiago R. - Mota',
    senderVehicle: 'Honda PCX 125',
    senderTrustScore: 99,
    timestamp: '22:20',
    text: 'Marca na checklist o que carregares na tua mochila para eu recolher o resto no balcão de apoio do Continente Modelo Amarante.',
    isVoicePtt: false,
    communityFlagsCount: 0,
  },

  // Channel 2: Rádio da Zona (Local)
  {
    id: 'MSG-ZONE-01',
    channel: 'RADIO_ZONA_LOCAL',
    senderId: 'PEER-CARLOS',
    senderName: 'Carlos M. - Scooter',
    senderVehicle: 'Yamaha NMAX',
    senderTrustScore: 96,
    timestamp: '22:14',
    text: 'Atenção malta de Amarante / Vila Meã: Burger King do Amarante Retail está com fila caos (+30 min de espera). Evitem aceitar!',
    isVoicePtt: true,
    voiceDurationSec: 5,
    communityFlagsCount: 0,
  },
  {
    id: 'MSG-ZONE-02',
    channel: 'RADIO_ZONA_LOCAL',
    senderId: 'PEER-INES',
    senderName: 'Inês V. - E-Bike',
    senderVehicle: 'E-Bike Cargo',
    senderTrustScore: 98,
    timestamp: '22:19',
    text: 'Pilaretes do Centro Histórico de São Gonçalo levantados agora mesmo e fiscalização na rotunda da EN15. Cuidado com os atalhos sugeridos pela app.',
    isVoicePtt: false,
    communityFlagsCount: 0,
  },
  {
    id: 'MSG-ZONE-03',
    channel: 'RADIO_ZONA_LOCAL',
    senderId: 'PEER-SPAMMER',
    senderName: 'Rui K. - Conta Suspeita',
    senderVehicle: 'Mota',
    senderTrustScore: 64,
    timestamp: '22:21',
    text: 'Alguém a vender conta alugada sem verificação? Mandem MP rápido!',
    isVoicePtt: false,
    communityFlagsCount: 2, // 1 click away from reaching 3 flags and triggering Auto-Mute!
  },
];

// =========================================================================
// STEP 4: DELIVERY BUDDY MASTER PREFERENCES, 2M30S TACTICAL MAP & ROAD HAZARDS
// =========================================================================

export const DEFAULT_MASTER_PREFERENCES: MasterUserPreferences = {
  anonymousMode: false,
  locationPrivacyMode: 'APROXIMADA_ZONA_2M30S',
  contributeAnonymousStats: true,
  zoneWalkieActive: true,
  autoOpenMicOnSos: true,
  autoTtsOnNewOffer: true,
  minGrossOrderValueEur: 4.0,
  minNetProfitPerKmEur: 1.0,
  filterLogicMode: 'EXIGIR_AMBOS',
  autoAcceptEnabled: true,
  autoDeclineEnabled: true,
};

export const ROAD_HAZARD_TYPES: RoadHazardType[] = [
  'Acidente na Via',
  'Buraco Perigoso na Pista',
  'Obras na Via / Desvio',
  'Animais na Pista',
  'Piso Escorregadio / Óleo',
  'Anomalia Geral',
];

export const SEED_TACTICAL_CELLS: TacticalMapCell[] = [
  {
    id: 'CELL-AMR-CENTRO',
    zoneName: 'Amarante Centro / São Gonçalo',
    status: 'Alta Demanda / Poucos Estafetas',
    activeCouriersCount: 11,
    busyWithOrderCount: 7,
    availableIdleCount: 4,
    avgWaitOrdersCount: 14,
    recommendedAction:
      'Eixo Rio Tâmega & Santa Luzia — recolhas rápidas e alta procura',
  },
  {
    id: 'CELL-AMR-FREIXO',
    zoneName: 'Freixo de Cima / Baixo',
    status: 'Alta Demanda / Poucos Estafetas',
    activeCouriersCount: 8,
    busyWithOrderCount: 5,
    availableIdleCount: 3,
    avgWaitOrdersCount: 11,
    recommendedAction:
      'Corredor N15 norte — excelente rácio pedidos/estafeta (+1.45 €/km)',
  },
  {
    id: 'CELL-AMR-VILA-MEA',
    zoneName: 'Vila Meã',
    status: 'Equilibrado',
    activeCouriersCount: 7,
    busyWithOrderCount: 4,
    availableIdleCount: 3,
    avgWaitOrdersCount: 9,
    recommendedAction:
      'Acesso A4 / N15 oeste — fluxo constante e trânsito fluído',
  },
  {
    id: 'CELL-AMR-LIXA',
    zoneName: 'Lixa / Felgueiras',
    status: 'Alta Demanda / Poucos Estafetas',
    activeCouriersCount: 9,
    busyWithOrderCount: 6,
    availableIdleCount: 3,
    avgWaitOrdersCount: 13,
    recommendedAction:
      'Forte volume noturno a 14 km do centro de Amarante',
  },
  {
    id: 'CELL-AMR-MARCO',
    zoneName: 'Marco de Canaveses',
    status: 'Zona Saturada - Evitar',
    activeCouriersCount: 13,
    busyWithOrderCount: 5,
    availableIdleCount: 8,
    avgWaitOrdersCount: 6,
    recommendedAction:
      'Concentração elevada no centro — preferir eixo Amarante / Vila Meã',
  },
];

export const SEED_ROAD_HAZARD_PINS: RoadHazardPin[] = [
  {
    id: 'HAZ-AMR-01',
    hazardType: 'Piso Escorregadio / Óleo',
    streetLocation: 'Ponte de São Gonçalo / Largo Conselheiro António Cândido',
    cityZone: 'Amarante Centro / São Gonçalo',
    reportedAt: 'Há 3 min',
    reporterName: 'Carlos M. - Scooter',
    confirmations: 6,
    resolved: false,
    gridX: 48,
    gridY: 46,
  },
  {
    id: 'HAZ-AMR-02',
    hazardType: 'Buraco Perigoso na Pista',
    streetLocation: 'EN15 — Rotunda de Freixo de Cima (Faixa direita)',
    cityZone: 'Freixo de Cima / Baixo',
    reportedAt: 'Há 8 min',
    reporterName: 'Estafeta Anónimo',
    confirmations: 9,
    resolved: false,
    gridX: 38,
    gridY: 28,
  },
  {
    id: 'HAZ-AMR-03',
    hazardType: 'Obras na Via / Desvio',
    streetLocation: 'Acesso N211 / Nó A4 — Vila Meã',
    cityZone: 'Vila Meã',
    reportedAt: 'Há 12 min',
    reporterName: 'Tiago R. - Mota',
    confirmations: 4,
    resolved: false,
    gridX: 24,
    gridY: 56,
  },
  {
    id: 'HAZ-AMR-04',
    hazardType: 'Acidente na Via',
    streetLocation: 'EN101 — Ligação Amarante → Lixa',
    cityZone: 'Lixa / Felgueiras',
    reportedAt: 'Há 5 min',
    reporterName: 'Inês V. - E-Bike',
    confirmations: 11,
    resolved: false,
    gridX: 28,
    gridY: 18,
  },
];

// =========================================================================
// STEP 5: PERSONAL ESTABLISHMENT BLACKLIST & DEMO VERIFIED MULTI-APP ACCOUNT
// =========================================================================

export const SEED_PERSONAL_BLACKLIST: string[] = [
  "McDonald's — Vila Meã / Marco (Espera Crítica)",
  'Burger King — Amarante Retail',
];

export const DEFAULT_DEMO_VERIFIED_ACCOUNT: CourierVerifiedAccount = {
  courierName: 'Miguel A. (Estafeta Verificado)',
  emailOrPhone: 'miguel.estafeta@deliverybuddy.pt',
  connectedPlatforms: ['Uber Eats', 'Glovo', 'Bolt Food'],
  contractModel: 'Recibos Verdes / Independente',
  verificationMethod: 'IA_SCREENSHOT_FACIAL',
  verifiedAt: '2026-10-17T22:55:00Z',
  keepLoggedInShift: true,
  unifiedMapPinId: 'PIN-UNIFICADO-PT-8841',
};

// =========================================================================
// STEP 6: GLOVO NIGHTLY WALLET RECONCILER, FLEET (10%) & TAX TRACKER,
// PERSONAL GOALS PACING ENGINE & BUDDYREWARDS SYSTEM
// =========================================================================

export const DEFAULT_GLOVO_WALLET_STATE: GlovoDailyWalletState = {
  initialAppWalletEur: 15.0,
  dailyGrossGlovoEur: 68.4,
  cashReceivedHandsEur: 42.0,
  cashPaidAtRestaurantsEur: 14.5,
  nightlyTransferMadeEur: 20.0,
  // Expected = 15.00 + 68.40 - 42.00 + 14.50 - 20.00 = 35.90 €
  // Actual shown next morning = 31.40 € -> Triggers 4.50 € discrepancy warning!
  nextMorningActualGlovoBalanceEur: 31.4,
  auditClosedToday: false,
};

export const DEFAULT_TAX_AND_FLEET_CONFIG: TaxAndFleetConfigState = {
  workMode: 'FROTA_10_UBER',
  uberGrossEur: 485.0,
  glovoGrossEur: 390.0,
  boltGrossEur: 245.0,
  totalKmDriven: 820,
  firstYearSsExemption: false,
  vatIrsReserveRatePct: 8.5,
  invoiceChecklist: {
    emitirReciboVerde5DiaUtil: true,
    validarNifPlataformasIntracomunitario: true,
    confirmarDeclaracaoTrimestralSs: false,
  },
  // Step 7: Customizable Fiscal, CAE & Fleet Framework defaults
  caeCirsPreset: 'CAE 53200 - Outras atividades postais e de courier',
  customCaeInput: 'CAE 53200 - Outras atividades postais e de courier',
  customFleetCommissionPct: 10.0,
  socialSecurityRatePct: 21.4,
  ivaRegime: 'ISENTO_ART_53',
  irsWithholdingPct: 8.5,
};

export const DEFAULT_PERSONAL_GOALS: PersonalGoalsState = {
  dailyNetGoalEur: 85.0,
  weeklyNetGoalEur: 860.0,
  monthlyNetGoalEur: 2600.0,
  plannedShiftHours: 8.0,
  currentDailyNetEarnedEur: 56.5, // ~66.5% of 85.00 € daily goal
  currentWeeklyNetEarnedEur: 342.0,
  currentMonthlyNetEarnedEur: 1460.0,
  hoursWorkedToday: 4.5,
  completedDeliveriesToday: 12,
};

export const REWARD_MARKETPLACE_ITEMS: RewardMarketplaceItem[] = [
  {
    id: 'REWARD-FUEL-5EUR',
    title: 'Vale Combustível 5,00 € (Galp / Repsol / PRIO)',
    subtitle:
      'Poupança direta no abastecimento do turno. Código QR imediato válido em postos aderentes em Portugal.',
    rewardType: 'DIRETO',
    costBuddyCoins: 100,
    minCommunityReputationPct: 85,
    partnerBadge: 'Benefício Direto • Combustível B2B',
    voucherCodePrefix: 'GALP-BUDDY-5E',
    partnerBusinessName: 'Rede Galp / PRIO Frotas PT',
  },
  {
    id: 'REWARD-WORKSHOP-15PCT',
    title: 'Desconto 15% Oficina Parceira (Pneus, Travões e Óleo)',
    subtitle:
      'Manutenção prioritária para motas 125cc, scooters e e-bikes em oficinas parceiras Lisboa, Porto e Coimbra.',
    rewardType: 'DIRETO',
    costBuddyCoins: 140,
    minCommunityReputationPct: 85,
    partnerBadge: 'Benefício Direto • Oficina & Pneus B2B',
    voucherCodePrefix: 'OFICINA-15PT',
    partnerBusinessName: 'Oficina MotoBox 125 Lisboa & Porto',
  },
  {
    id: 'REWARD-ACCOUNTING-FREE',
    title:
      'Apoio Contabilístico Gratuito (Emissão de Faturas / Recibos Verdes e Declaração SS)',
    subtitle:
      'Sessão de apoio fiscal para estafetas: validação de CAE 53200 / CIRS 1519 no Portal das Finanças e Segurança Social Direta.',
    rewardType: 'DIRETO',
    costBuddyCoins: 180,
    minCommunityReputationPct: 80,
    partnerBadge: 'Benefício Direto • Apoio Fiscal PT',
    voucherCodePrefix: 'CONTAB-RV-PT',
    partnerBusinessName: 'Gabinete Fiscal Estafetas PT',
  },
  {
    id: 'REWARD-VIP-HIGH-DEMAND',
    title:
      'Destaque VIP & Acesso Prioritário a Zonas de Alta Demanda Projetadas',
    subtitle:
      'Vantagem tática indireta na app: desbloqueia previsão antecipada de células quentes 15 min antes do pico e selo VIP no Walkie-Talkie.',
    rewardType: 'INDIRETO',
    costBuddyCoins: 120,
    minCommunityReputationPct: 90,
    partnerBadge: 'Vantagem Tática Indireta • App VIP',
    voucherCodePrefix: 'VIP-RADAR-PRO',
    partnerBusinessName: 'Delivery Buddy Tactical Network',
  },
];

export const DEFAULT_BUDDY_REWARDS: BuddyRewardsState = {
  buddyCoins: 245,
  xpPoints: 380, // Nível 2: Piloto Tático (rumo a Nível 3: Veterano de Rua aos 500 XP)
  claimedRewardIds: [],
  claimedVoucherCodes: {},
  actionHistory: [
    {
      id: 'RWD-LOG-100',
      timestamp: 'Hoje, 21:55',
      taskKey: 'ADERIR_PACTO_ZONA_40',
      title: 'Aderir e Cumprir Acordo Zona Amarante (>= 5,00 €)',
      pointsAwarded: 40,
      xpAwarded: 40,
    },
    {
      id: 'RWD-LOG-101',
      timestamp: 'Hoje, 21:40',
      taskKey: 'SINCRONIZAR_PEDIDO_DIVIDIDO_25',
      title: 'Sincronizar Pedido Dividido com Colega (#4829)',
      pointsAwarded: 25,
      xpAwarded: 25,
    },
    {
      id: 'RWD-LOG-102',
      timestamp: 'Hoje, 20:55',
      taskKey: 'REGISTAR_ROTA_PROIBIDA_20',
      title: 'Registar Rota Proibida / Desvio com Prova (Rua das Flores)',
      pointsAwarded: 20,
      xpAwarded: 20,
    },
    {
      id: 'RWD-LOG-103',
      timestamp: 'Hoje, 19:30',
      taskKey: 'ALERTAR_ANOMALIA_MAPA_15',
      title: 'Alertar Anomalia / Buraco na Via no Mapa 2m30s',
      pointsAwarded: 15,
      xpAwarded: 15,
    },
    {
      id: 'RWD-LOG-104',
      timestamp: 'Ontem, 23:50',
      taskKey: 'BATER_META_DIARIA_50',
      title: 'Bater a Meta Pessoal Diária (85,00 € Líquidos)',
      pointsAwarded: 50,
      xpAwarded: 50,
    },
  ],
};

// =========================================================================
// STEP 7: COLLECTIVE AREA RULES ("ACORDOS DE ZONA"), SAFETY TELEMETRY & B2B
// =========================================================================

export const SEED_ZONE_PACTS: ZonePactRule[] = [
  {
    id: 'PACT-ZONA-CENTRO-01',
    title:
      'Acordo Amarante / Tâmega: Só aceitar pedidos >= 5,00 € (Das 19:00 às 22:00)',
    zoneName: 'Amarante Centro / São Gonçalo / Vila Meã',
    minCollectiveOrderEur: 5.0,
    minCollectivePerKmEur: 1.2,
    durationHoursLabel: 'Das 19:00 às 22:00 (3h)',
    boycottedEstablishment: 'Burger King — Centro Comercial (+25 min espera)',
    adheredCouriersCount: 34,
    joinedByUser: true,
    createdBy: 'Comunidade Estafetas Amarante',
  },
  {
    id: 'PACT-PORTO-BOAVISTA-02',
    title:
      'Acordo Noturno Lixa & Marco: Só aceitar pedidos >= 4,80 € e >= 1,15 €/km',
    zoneName: 'Lixa / Felgueiras & Marco de Canaveses',
    minCollectiveOrderEur: 4.8,
    minCollectivePerKmEur: 1.15,
    durationHoursLabel: 'Das 20:00 às 23:30 (3.5h)',
    boycottedEstablishment: 'McDonald’s — Rotunda EN15',
    adheredCouriersCount: 22,
    joinedByUser: false,
    createdBy: 'Núcleo Estafetas Tâmega e Sousa',
  },
];

export const DEFAULT_SAFETY_TELEMETRY: RiderSafetyTelemetryState = {
  speedLimitAlertEnabled: true,
  urbanSpeedCapKmh: 50,
  highwaySpeedCapKmh: 90,
  activeRoadMode: 'URBANO',
  currentSimulatedSpeedKmh: 38,
  phoneMisuseAlertEnabled: true,
  maxTouchDurationSec: 8,
  currentTouchDurationSec: 3,
  isPhoneMisuseTriggered: false,
  lastSafetyWarningMessage: null,
};

export const SEED_B2B_PARTNERS: B2BPartnerSponsorshipRecord[] = [
  {
    id: 'B2B-PT-01',
    businessName: 'Oficina MotoBox 125 (Arroios & Boavista)',
    category: 'Oficina de Motas / Pneus',
    cityZone: 'Lisboa & Porto',
    discountOfferTitle: 'Desconto 15% em Pneus Michelin City Grip 2 + Mudança de Óleo na Hora',
    monthlySponsorshipEur: 149,
    costBuddyCoins: 140,
    minReputationPct: 85,
    voucherPrefix: 'MOTOBOX-15PT',
    activeCouriersReached: 412,
  },
  {
    id: 'B2B-PT-02',
    businessName: 'Postos PRIO / Galp Frota Estafeta',
    category: 'Posto de Combustível',
    cityZone: 'Nacional — Portugal',
    discountOfferTitle: 'Vale Combustível 5,00 € + -9 cênt/L em Gasolina 95 Simples',
    monthlySponsorshipEur: 299,
    costBuddyCoins: 100,
    minReputationPct: 85,
    voucherPrefix: 'PRIO-GALP-5E',
    activeCouriersReached: 890,
  },
  {
    id: 'B2B-PT-03',
    businessName: 'RiderGear PT — Equipamento Térmico & Impermeáveis',
    category: 'Equipamento & Impermeáveis',
    cityZone: 'Lisboa — Avenidas Novas / Online PT',
    discountOfferTitle: '20% Desconto em Fato de Chuva Térmico + Suporte Estanque c/ Carregador',
    monthlySponsorshipEur: 99,
    costBuddyCoins: 110,
    minReputationPct: 80,
    voucherPrefix: 'RIDERGEAR-20',
    activeCouriersReached: 275,
  },
];

// =========================================================================
// STEP 8: MULTI-REGION EXPLORER DATASETS (PORTUGAL — DEFAULT AMARANTE 25KM)
// =========================================================================

export const SEED_REGIONAL_EXPLORER_DATA: RegionalExplorerDataset[] = [
  {
    regionName: 'Amarante (25 km)',
    distanceFromCurrentKm: 0,
    avgEurPerKm: 1.46,
    activeCouriersTotal: 48,
    activeRoadHazardsCount: 4,
    activePactsCount: 2,
    weatherSummary: '16°C • Brisa no Vale do Rio Tâmega • Piso Seco EN15/A4',
    topHotspotZone: 'Amarante Centro / São Gonçalo & Freixo de Cima',
    cells: SEED_TACTICAL_CELLS,
  },
  {
    regionName: 'Lisboa Centro',
    distanceFromCurrentKm: 365,
    avgEurPerKm: 1.44,
    activeCouriersTotal: 42,
    activeRoadHazardsCount: 4,
    activePactsCount: 3,
    weatherSummary: '18°C • Piso Húmido na Baixa',
    topHotspotZone: 'Saldanha / Marquês / Av. Novas',
    cells: SEED_TACTICAL_CELLS,
  },
  {
    regionName: 'Grande Lisboa / Sintra / Cascais',
    distanceFromCurrentKm: 18,
    avgEurPerKm: 1.29,
    activeCouriersTotal: 31,
    activeRoadHazardsCount: 2,
    activePactsCount: 2,
    weatherSummary: '17°C • Vento Moderado IC19/A5',
    topHotspotZone: 'Oeiras Parque / Carcavelos / Rio de Mouro',
    cells: [
      {
        id: 'CELL-SINTRA-01',
        zoneName: 'Oeiras Parque / Lagoas Park',
        status: 'Alta Demanda / Poucos Estafetas',
        activeCouriersCount: 9,
        avgWaitOrdersCount: 16,
        recommendedAction: 'Deslocar agora: Pico de almoço/jantar empresarial (+1,50€ bónus)',
      },
      {
        id: 'CELL-SINTRA-02',
        zoneName: 'Cascais Villa / Estoril',
        status: 'Alta Demanda / Poucos Estafetas',
        activeCouriersCount: 8,
        avgWaitOrdersCount: 14,
        recommendedAction: 'Excelente rentabilidade por km na linha de Cascais (1,32 €/km)',
      },
      {
        id: 'CELL-SINTRA-03',
        zoneName: 'Sintra / Cacém / Fórum Sintra',
        status: 'Equilibrado',
        activeCouriersCount: 11,
        avgWaitOrdersCount: 12,
        recommendedAction: 'Fluxo constante de pedidos familiares e supermercado',
      },
      {
        id: 'CELL-SINTRA-04',
        zoneName: 'Amadora / Reboleira / UBBO',
        status: 'Zona Saturada - Evitar',
        activeCouriersCount: 18,
        avgWaitOrdersCount: 7,
        recommendedAction: 'Muitos estafetas concentrados na praça de alimentação',
      },
    ],
  },
  {
    regionName: 'Porto Centro',
    distanceFromCurrentKm: 312,
    avgEurPerKm: 1.39,
    activeCouriersTotal: 36,
    activeRoadHazardsCount: 3,
    activePactsCount: 3,
    weatherSummary: '15°C • Chuva Fraca na Boavista',
    topHotspotZone: 'Boavista / Bom Sucesso / Cedofeita',
    cells: [
      {
        id: 'CELL-PORTO-01',
        zoneName: 'Boavista / Bom Sucesso',
        status: 'Alta Demanda / Poucos Estafetas',
        activeCouriersCount: 10,
        avgWaitOrdersCount: 19,
        recommendedAction: 'Melhor zona do Porto neste momento (1,52 €/km líquidos)',
      },
      {
        id: 'CELL-PORTO-02',
        zoneName: 'Baixa do Porto / Aliados / Clérigos',
        status: 'Equilibrado',
        activeCouriersCount: 12,
        avgWaitOrdersCount: 14,
        recommendedAction: 'Atenção a ruas pedonais e calçada escorregadia',
      },
      {
        id: 'CELL-PORTO-03',
        zoneName: 'Polo Universitário / Paranhos',
        status: 'Alta Demanda / Poucos Estafetas',
        activeCouriersCount: 8,
        avgWaitOrdersCount: 15,
        recommendedAction: 'Alta rotação de entregas curtas (1,34 €/km)',
      },
      {
        id: 'CELL-PORTO-04',
        zoneName: 'Foz do Douro / Fluvial',
        status: 'Equilibrado',
        activeCouriersCount: 6,
        avgWaitOrdersCount: 8,
        recommendedAction: 'Pedidos de ticket médio elevado e gorjetas frequentes',
      },
    ],
  },
  {
    regionName: 'Grande Porto / Gaia / Matosinhos',
    distanceFromCurrentKm: 318,
    avgEurPerKm: 1.28,
    activeCouriersTotal: 29,
    activeRoadHazardsCount: 2,
    activePactsCount: 2,
    weatherSummary: '15°C • Vento Costeiro em Matosinhos',
    topHotspotZone: 'NorteShopping / Arrábida / Av. República Gaia',
    cells: [
      {
        id: 'CELL-GPORTO-01',
        zoneName: 'NorteShopping / Matosinhos Sul',
        status: 'Alta Demanda / Poucos Estafetas',
        activeCouriersCount: 11,
        avgWaitOrdersCount: 17,
        recommendedAction: 'Forte volume de pedidos com estacionamento fácil',
      },
      {
        id: 'CELL-GPORTO-02',
        zoneName: 'Vila Nova de Gaia — Av. da República',
        status: 'Equilibrado',
        activeCouriersCount: 10,
        avgWaitOrdersCount: 12,
        recommendedAction: 'Evitar travessia da Ponte Luís I em hora de ponta',
      },
    ],
  },
  {
    regionName: 'Braga / Guimarães',
    distanceFromCurrentKm: 362,
    avgEurPerKm: 1.25,
    activeCouriersTotal: 19,
    activeRoadHazardsCount: 1,
    activePactsCount: 2,
    weatherSummary: '14°C • Céu Nublado',
    topHotspotZone: 'Nova Arcada / Universidade do Minho',
    cells: [
      {
        id: 'CELL-BRAGA-01',
        zoneName: 'Braga Centro / Gualtar (UMinho)',
        status: 'Alta Demanda / Poucos Estafetas',
        activeCouriersCount: 12,
        avgWaitOrdersCount: 16,
        recommendedAction: 'Alta procura junto ao campus de Gualtar e Av. Liberdade',
      },
      {
        id: 'CELL-BRAGA-02',
        zoneName: 'Guimarães Shopping / Centro Histórico',
        status: 'Equilibrado',
        activeCouriersCount: 7,
        avgWaitOrdersCount: 9,
        recommendedAction: 'Trajetos rápidos sem trânsito pesado',
      },
    ],
  },
  {
    regionName: 'Coimbra',
    distanceFromCurrentKm: 204,
    avgEurPerKm: 1.31,
    activeCouriersTotal: 22,
    activeRoadHazardsCount: 2,
    activePactsCount: 2,
    weatherSummary: '16°C • Piso Seco (Obras Metro Mondego)',
    topHotspotZone: 'Praça da República / Alma Shopping / Solum',
    cells: [
      {
        id: 'CELL-COIMBRA-01',
        zoneName: 'Solum / Alma Shopping / Celas',
        status: 'Alta Demanda / Poucos Estafetas',
        activeCouriersCount: 14,
        avgWaitOrdersCount: 18,
        recommendedAction: 'Alta procura estudantil e hospitalar (1,35 €/km)',
      },
      {
        id: 'CELL-COIMBRA-02',
        zoneName: 'Fórum Coimbra / Santa Clara',
        status: 'Equilibrado',
        activeCouriersCount: 8,
        avgWaitOrdersCount: 10,
        recommendedAction: 'Atenção aos desvios das obras do Metro Mondego na Baixa',
      },
    ],
  },
  {
    regionName: 'Faro / Algarve',
    distanceFromCurrentKm: 278,
    avgEurPerKm: 1.36,
    activeCouriersTotal: 25,
    activeRoadHazardsCount: 1,
    activePactsCount: 1,
    weatherSummary: '22°C • Céu Limpo',
    topHotspotZone: 'Fórum Algarve / Marina Vilamoura / Albufeira',
    cells: [
      {
        id: 'CELL-FARO-01',
        zoneName: 'Faro Centro / Fórum Algarve / Gambelas',
        status: 'Alta Demanda / Poucos Estafetas',
        activeCouriersCount: 13,
        avgWaitOrdersCount: 15,
        recommendedAction: 'Procura elevada no centro e zona universitária de Gambelas',
      },
      {
        id: 'CELL-FARO-02',
        zoneName: 'Vilamoura / Quarteira / Albufeira',
        status: 'Alta Demanda / Poucos Estafetas',
        activeCouriersCount: 12,
        avgWaitOrdersCount: 19,
        recommendedAction: 'Excelente tarifa média (1,42 €/km) e gorjetas turísticas',
      },
    ],
  },
];

// =========================================================================
// STEP 8: MASTER ADMIN BACKOFFICE SEED DATA
// =========================================================================

export const SEED_ADMIN_MANAGED_COURIERS: AdminManagedCourierRecord[] = [
  {
    id: 'USR-PT-101',
    fullName: 'Tiago R.',
    courierTag: 'Mota_Amarante_92',
    phone: '+351 914 820 319',
    cityZone: 'Amarante — São Gonçalo',
    platforms: ['Uber Eats', 'Glovo', 'Bolt Food'],
    reputationPct: 96,
    kycStatus: 'Ativo',
    aiMatchScorePct: 98,
    joinedAt: '2026-04-12',
    lastActiveText: 'Online agora (São Gonçalo — Amarante)',
    kycProofSummary: 'Uber (Mota 125cc) + Glovo ID #88412 + Bolt Food Ativo — Selfie em Tempo Real Validada',
  },
  {
    id: 'USR-PT-102',
    fullName: 'Rui Moto',
    courierTag: 'Estafeta_Amarante_11',
    phone: '+351 938 119 402',
    cityZone: 'Amarante Centro',
    platforms: ['Uber Eats', 'Glovo'],
    reputationPct: 97,
    kycStatus: 'Ativo',
    aiMatchScorePct: 96,
    joinedAt: '2026-10-17',
    lastActiveText: 'Online agora (Largo de São Gonçalo)',
    kycProofSummary: 'Captura Perfil Glovo + Carta Condução PT (96% correspondência biométrica IA)',
  },
  {
    id: 'USR-PT-103',
    fullName: 'Inês V.',
    courierTag: 'Scooter_Madalena_07',
    phone: '+351 962 504 881',
    cityZone: 'Amarante — Madalena',
    platforms: ['Uber Eats', 'Bolt Food'],
    reputationPct: 94,
    kycStatus: 'Ativo',
    aiMatchScorePct: 97,
    joinedAt: '2026-06-03',
    lastActiveText: 'Online há 4 min (Av. General Silveira)',
    kycProofSummary: 'Uber Eats Pro Ouro + Bolt Food — Verificado por IA Anti-Fraude',
  },
  {
    id: 'USR-PT-104',
    fullName: 'Filipe T.',
    courierTag: 'Rider_Freixo_44',
    phone: '+351 927 330 115',
    cityZone: 'Amarante — Freixo de Cima',
    platforms: ['Glovo'],
    reputationPct: 93,
    kycStatus: 'Pendente IA',
    aiMatchScorePct: 91,
    joinedAt: '2026-10-18',
    lastActiveText: 'Submeteu KYC há 5 min',
    kycProofSummary: 'Print App Glovo Couriers + Selfie com Capacete Aberto (91% match IA)',
  },
  {
    id: 'USR-PT-105',
    fullName: 'Bruno Costa',
    courierTag: 'FakeAccount_99',
    phone: '+351 910 009 412',
    cityZone: 'Amarante — Vila Meã',
    platforms: ['Uber Eats'],
    reputationPct: 48,
    kycStatus: 'Suspenso',
    aiMatchScorePct: 42,
    joinedAt: '2026-09-29',
    lastActiveText: 'Bloqueado (Spoofing detetado)',
    kycProofSummary: 'Alerta Anti-Spoofing: Tentativa de usar captura de ecrã reciclada da internet',
  },
];

export const SEED_ADMIN_BROADCASTS: AdminBroadcastMessage[] = [
  {
    id: 'ADM-MSG-01',
    createdAt: 'Hoje • 19:15',
    title: 'Aviso Operacional: Fiscalização e Piso Escorregadio na Ponte de São Gonçalo / N15',
    body: 'Atenção malta em Amarante (25 km): piso húmido na calçada junto à Ponte de São Gonçalo e operação STOP de documentos na rotunda da N15 (Padronelo). Reduzam a velocidade e confirmem seguro ativo.',
    targetType: 'ZONA_ESPECIFICA',
    targetValue: 'Amarante (25 km)',
    category: 'OPERACIONAL_SEGURANCA_OBRIGATORIO',
    deliveredCount: 42,
    isReadByCurrentCourier: false,
  },
  {
    id: 'ADM-MSG-02',
    createdAt: 'Hoje • 14:30',
    title: 'Bónus Especial Seguros & Pneus: Novos Vales Disponíveis',
    body: 'Foram adicionados novos apoios patrocinados para Seguro de Acidentes Pessoais de Estafeta (-25%) e Pneus Michelin City Grip 2 nas oficinas parceiras de Amarante.',
    targetType: 'TODOS_ESTAFETAS',
    targetValue: 'Amarante & Tâmega',
    category: 'PROMOCIONAL_PARCEIROS_OPT_IN',
    deliveredCount: 1120,
    isReadByCurrentCourier: true,
  },
];

export const SEED_ADMIN_SPONSORED_CAMPAIGNS: AdminSponsoredCampaign[] = [
  {
    id: 'CAMP-SEG-01',
    sponsorName: 'Caravela / Tranquilidade Seguros Estafeta Pro',
    category: 'Seguros (Destaque Especial)',
    offerHeadline: '25% Desconto em Seguro de Acidentes Pessoais + RC Mota Comercial (Carta Verde na Hora)',
    discountOrBonusValue: '-25% Anual + Fracionamento Mensal s/ Juros',
    requiredBuddyCoins: 150,
    placement: 'Destaque no Painel',
    isActive: true,
    viewsCount: 3420,
    clicksCount: 618,
    vouchersRedeemedCount: 94,
    sponsorshipRevenueEur: 490,
  },
  {
    id: 'CAMP-PNEU-02',
    sponsorName: 'Oficina MotoBox 125 (Amarante & Tâmega)',
    category: 'Pneus & Travões',
    offerHeadline: '15% Desconto em Pneus Michelin City Grip 2 + Pastilhas de Travão Montadas',
    discountOrBonusValue: '-15% Pneus + Calibragem Grátis',
    requiredBuddyCoins: 140,
    placement: 'Catálogo de Prêmios',
    isActive: true,
    viewsCount: 2180,
    clicksCount: 412,
    vouchersRedeemedCount: 67,
    sponsorshipRevenueEur: 249,
  },
  {
    id: 'CAMP-OLEO-03',
    sponsorName: 'Motul & FastRider Mecânica Rápida',
    category: 'Óleo & Manutenção Mecânica',
    offerHeadline: 'Mudança de Óleo 10W40 Sintético + Revisão de Transmissão/Correia em 20 Minutos',
    discountOrBonusValue: '19,90 € Preço Fixo Estafeta',
    requiredBuddyCoins: 120,
    placement: 'Catálogo de Prêmios',
    isActive: true,
    viewsCount: 1640,
    clicksCount: 289,
    vouchersRedeemedCount: 51,
    sponsorshipRevenueEur: 199,
  },
  {
    id: 'CAMP-COMB-04',
    sponsorName: 'PRIO / Galp Frota Delivery Buddy',
    category: 'Combustível & Carregamento Elétrico',
    offerHeadline: 'Vale Direto 5,00 € em Combustível ou Carregamento Rápido Mobi.E + -9 cênt/L',
    discountOrBonusValue: 'Vale 5,00 € + Desconto Litro',
    requiredBuddyCoins: 100,
    placement: 'Notificação de Turno',
    isActive: true,
    viewsCount: 4890,
    clicksCount: 1105,
    vouchersRedeemedCount: 238,
    sponsorshipRevenueEur: 550,
  },
  {
    id: 'CAMP-ACESS-05',
    sponsorName: 'RiderGear PT — Equipamento & Intercomunicadores',
    category: 'Acessórios (Suportes, Impermeáveis, Mochilas Térmicas, Intercomunicadores)',
    offerHeadline: '20% Desconto em Suporte Anti-Vibração c/ Carregador USB, Fato de Chuva e Mochila 45L',
    discountOrBonusValue: '-20% Direto + Envio 24h',
    requiredBuddyCoins: 110,
    placement: 'Catálogo de Prêmios',
    isActive: true,
    viewsCount: 1920,
    clicksCount: 340,
    vouchersRedeemedCount: 62,
    sponsorshipRevenueEur: 149,
  },
];

// =========================================================================
// STEP 8: INTERACTIVE USER MANUAL & CONTEXTUAL "?" HELP ENTRIES
// =========================================================================

export interface WelcomeTourCardSlide {
  stepNumber: number;
  badge: string;
  title: string;
  subtitle: string;
  bullets: string[];
  voiceExample: string;
}

export const WELCOME_TOUR_SLIDES: WelcomeTourCardSlide[] = [
  {
    stepNumber: 1,
    badge: '1 DE 4 • MODO BOLHA & VOZ',
    title: '1. Modo Bolha & Controlo por Voz',
    subtitle: 'Trabalhe na Uber, Glovo e Bolt com o ecrã limpo e sem tirar as mãos do guiador.',
    bullets: [
      'Toque em "Modo Bolha" no topo para reduzir a app a um botão flutuante igual ao da Uber.',
      'A bolha muda de cor sozinha (Verde = Aceitar, Amarelo = Atenção, Vermelho = Recusar).',
      'Use o microfone para navegar ou enviar mensagens ao suporte e ao cliente sem digitar.',
    ],
    voiceExample: '"Minimizar para bolha" ou "Restaurante atrasado"',
  },
  {
    stepNumber: 2,
    badge: '2 DE 4 • SCANNER DE LUCRO, ROTAS E PESO',
    title: '2. Scanner de Lucro, Desvios e Peso',
    subtitle: 'Saiba em 1 segundo se uma oferta compensa antes de aceitar.',
    bullets: [
      'O cartão gigante no topo mostra logo o Veredito (ACEITAR / ATENÇÃO / RECUSAR), o Lucro Líquido (€/km) e o Peso da encomenda.',
      'Deteta automaticamente zonas pedonais, pilaretes e desvios não pagos pela app.',
      'Se passar de 12 kg (ex: grades de cerveja ou garrafões), gera um pedido de Estafeta Parceiro para dividir a carga.',
    ],
    voiceExample: '"Abrir scanner" ou "Simular oferta"',
  },
  {
    stepNumber: 3,
    badge: '3 DE 4 • CARTEIRA GLOVO & METAS',
    title: '3. Carteira Glovo, Impostos & Metas',
    subtitle: 'Acabe com a confusão dos descontos noturnos de dinheiro vivo e saiba quanto falta para a meta.',
    bullets: [
      'Veja exatamente quanto dinheiro tem de guardar no bolso e quanto a Glovo vai transferir ou descontar à meia-noite.',
      'Desconte automaticamente os 10% de frota, IVA, Segurança Social e reserva de IRS.',
      'Receba alertas animados no ecrã quando atingir 50%, 80%, 90% e 100% da sua meta diária.',
    ],
    voiceExample: '"Abrir finanças" ou "Quanto falta para a meta"',
  },
  {
    stepNumber: 4,
    badge: '4 DE 4 • RÁDIO, SOS & ACORDOS DE ZONA',
    title: '4. Rádio PTT, SOS Mãos-Livres & Mapa de Amarante',
    subtitle: 'Segurança máxima na estrada e união entre estafetas da mesma região.',
    bullets: [
      'Em caso de acidente ou ameaça, o SOS abre o microfone em modo mãos-livres e partilha a localização exata com os colegas.',
      'Explore o mapa de Amarante (raio 25 km) ou consulte qualquer região de Portugal (Lisboa, Porto, Braga, Coimbra, Algarve).',
      'Vote nos Acordos de Zona para travar tarifas baixas e troque BuddyCoins por descontos em Seguros, Pneus e Combustível.',
    ],
    voiceExample: '"Abrir rádio" ou "Emergência SOS"',
  },
];

export const CONTEXTUAL_HELP_BY_TAB: Record<AppTabId, ContextualHelpEntry> = {
  scanner: {
    tabId: 'scanner',
    pageTitle: 'Início / Scanner Inteligente de Ofertas',
    whatItDoes:
      'Analisa instantaneamente qualquer oferta da Uber Eats, Glovo ou Bolt Food, mostrando no topo se deve ACEITAR ou RECUSAR com base no seu lucro real por km, desvios de rota e peso da encomenda.',
    howToUseQuickly:
      'Escolha uma oferta no seletor rápido do topo (ou carregue um print) e veja a cor do cartão principal. Use as abas sem precisar de fazer scroll longo.',
    streetProTip:
      'Ative o Auto-Decline nas Preferências para recusar sozinho ofertas abaixo do seu valor mínimo (ex: 3,50 €) ou de restaurantes na sua Lista Negra.',
  },
  walkietalkie: {
    tabId: 'walkietalkie',
    pageTitle: 'Buddys: Chat, Walkie & Blog',
    whatItDoes:
      'Permite conectar com estafetas na região de Amarante, comparar estatísticas cruzadas com amigos, falar no Walkie e publicar alertas no Blog.',
    howToUseQuickly:
      'Toque num cartão de estafeta para abrir o Pop-up 45%/80% ou minimizar o perfil numa bolinha flutuante com foto.',
    streetProTip:
      'Desafie amigos conectados num período predeterminado (Próximas 3h, Turno de Hoje ou Semanal) para comparar eficiência real.',
  },
  radar: {
    tabId: 'radar',
    pageTitle: 'Mapa de Amarante (60% Ecrã • Raio 25 km)',
    whatItDoes:
      'Mostra de forma limpa o mapa de Amarante (Rio Tâmega, EN15, A4) com marcadores circulares minimalistas e assistente de toque para Waze / Google Maps.',
    howToUseQuickly:
      'Toque num marcador circular em Amarante Centro, Freixo, Vila Meã, Lixa ou Marco de Canaveses para ver o detalhe na área inferior (40%).',
    streetProTip:
      'Use os comandos de voz "Mapa: aproximar zoom", "Mapa: recentralizar rota" ou "Mapa: rota alternativa" para controlar o Waze/Maps sem tirar as mãos do guiador.',
  },
  financas: {
    tabId: 'financas',
    pageTitle: 'Finanças, Carteira Glovo, Metas & Prêmios',
    whatItDoes:
      'Calcula o acerto noturno de dinheiro vivo da Glovo, separa impostos/frota (10%), acompanha o ritmo da sua meta diária e permite resgatar vales de Seguros, Pneus e Combustível.',
    howToUseQuickly:
      'Alterne entre "Global", "Uber Eats", "Glovo" e "Bolt Food" no topo da página para ver quanto dinheiro limpo já ganhou hoje.',
    streetProTip:
      'Use os seus BuddyCoins acumulados ao ajudar colegas e reportar perigos para baixar o custo do Seguro de Acidentes Pessoais e mudas de pneus.',
  },
  menu_mais: {
    tabId: 'menu_mais',
    pageTitle: 'Ajustes: Alertas, Voz, Arquivo de Provas & Acordos',
    whatItDoes:
      'Reúne todas as ferramentas e sub-páginas num menu limpo: Alertas (±45%), Comandos de Voz, Arquivo de Provas, Perigos na Via, Acordos de Zona, Raio do Mapa e Custos.',
    howToUseQuickly:
      'Toque em qualquer linha para abrir a sub-página correspondente em ecrã inteiro (100% da altura).',
    streetProTip:
      'Configure o lado dos balões flutuantes (Direito ou Esquerdo) e ative a Trigger Word para ocultar automaticamente o botão Push-to-Talk.',
  },
  voz_suporte: {
    tabId: 'voz_suporte',
    pageTitle: 'Copiloto de Voz, Macros de Chat & Calibrador %X/%Y',
    whatItDoes:
      'Permite comandar a aplicação pela voz, calibrar coordenadas %X/%Y de toque e aceder a macros rápidas.',
    howToUseQuickly:
      'Toque numa frase rápida de voz ou calibre o ponto exato do ecrã para Glovo e Uber Eats.',
    streetProTip:
      'Evite tocar no ecrã mais de 8 segundos seguidos em andamento — use os comandos de voz.',
  },
  reclamacoes: {
    tabId: 'reclamacoes',
    pageTitle: 'Reclamações, Rotas Proibidas & Provas de Desvio',
    whatItDoes:
      'Regista restaurantes com esperas abusivas e ruas proibidas/pedonais onde o GPS das plataformas calcula menos quilómetros do que o trajeto real.',
    howToUseQuickly:
      'Filtre por "Rotas Ilegais / Desvios" e clique em "Gerar Texto de Reclamação" para colar no chat de suporte da Uber, Glovo ou Bolt.',
    streetProTip:
      'Registar desvios reais ajuda toda a comunidade da sua zona a receber alertas automáticos no Scanner.',
  },
  calculadora: {
    tabId: 'calculadora',
    pageTitle: 'Preferências, Auto-Recusa & Custos do Veículo',
    whatItDoes:
      'Configura o valor mínimo de encomenda (Auto-Accept / Auto-Decline), a Lista Negra de restaurantes e o custo real por km da sua mota, carro ou bicicleta.',
    howToUseQuickly:
      'Defina o seu mínimo em Euros (ex: 3,50 €) e adicione estabelecimentos lentos à Lista Negra para que o Scanner recuse essas ofertas automaticamente.',
    streetProTip:
      'Mantenha o consumo e manutenção atualizados para que o cálculo de Lucro Líquido (€/km) seja 100% fiel à sua mota.',
  },
  admin_backoffice: {
    tabId: 'admin_backoffice',
    pageTitle: 'Painel do Administrador (Backoffice Delivery Buddy)',
    whatItDoes:
      'Central de gestão exclusiva do proprietário da plataforma: aprovação de contas KYC de estafetas, envio de avisos obrigatórios ou promocionais e gestão de patrocínios B2B (Seguros, Pneus, Óleo, Combustível e Acessórios).',
    howToUseQuickly:
      'Use as 3 abas do topo ("Utilizadores & KYC", "Mensagens & Avisos", "Seguros & Patrocínios B2B") para gerir toda a operação e receitas da aplicação em tempo real.',
    streetProTip:
      'Os avisos marcados como "Operacional & Segurança" chegam obrigatoriamente a todos os estafetas ativos, garantindo proteção legal e avisos críticos na via.',
  },
};

// =========================================================================
// ONLINE COURIERS DIRECTORY, CONTACT PERMISSION HANDSHAKE & LIVE ORDER STATUS
// (AMARANTE 25 KM — 7 COURIERS FOR 4.5 CARD SCROLL VIEWPORT & POP-UP)
// =========================================================================

export const SEED_ONLINE_DIRECTORY_COURIERS: OnlineDirectoryCourier[] = [
  {
    id: 'DIR-COURIER-01',
    callsign: 'Tiago R.',
    avatarInitials: 'TR',
    avatarPhotoUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' rx='40' fill='%230f172a'/><circle cx='40' cy='30' r='14' fill='%2338bdf8'/><path d='M16 68c4-14 14-22 24-22s20 8 24 22' fill='%2338bdf8'/></svg>",
    vehicle: 'Mota 125cc',
    distanceKm: 0.5,
    zoneName: 'São Gonçalo',
    cellId: 'CELL-AMR-CENTRO',
    reputationPct: 99,
    orderStatus: 'DISPONIVEL',
    contactPermission: 'APROVADO',
    isOnlineActive: true,
    lastMessageDeliveryState: 'MENSAGEM_RECEBIDA',
    buddyTenureText: 'Buddy há 2 anos e 4 meses',
    crossStats: {
      deliveriesToday: 14,
      avgEurPerKm: 1.54,
      activeHoursToday: 4.8,
      syncScorePct: 98,
    },
    voiceChatStatus: 'INATIVO',
    invitedGroupName: 'Esquadrão Tâmega Amarante',
    activeChallenge: {
      id: 'CHAL-SEED-01',
      period: 'TURNO_HOJE',
      periodLabel: 'Turno de Hoje (8h)',
      targetMetric: 'Entregas Limpas & Eficiência €/km',
      userCurrentScore: 14,
      buddyCurrentScore: 14,
      createdAt: 'Hoje • 18:30',
    },
    directMessages: [
      {
        id: 'DM-01',
        sender: 'COLEGA',
        text: 'Boas! Estou livre junto à Ponte de São Gonçalo se precisares de dividir carga pesada.',
        timestamp: '22:18',
      },
    ],
  },
  {
    id: 'DIR-COURIER-02',
    callsign: 'Carlos M.',
    avatarInitials: 'CM',
    avatarPhotoUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' rx='40' fill='%231e293b'/><circle cx='40' cy='30' r='14' fill='%2310b981'/><path d='M16 68c4-14 14-22 24-22s20 8 24 22' fill='%2310b981'/></svg>",
    vehicle: 'Scooter Elétrica',
    distanceKm: 1.2,
    zoneName: 'Freixo de Cima / Baixo',
    cellId: 'CELL-AMR-FREIXO',
    reputationPct: 97,
    orderStatus: 'DISPONIVEL',
    contactPermission: 'APROVADO',
    isOnlineActive: true,
    lastMessageDeliveryState: 'MENSAGEM_ENVIADA',
    buddyTenureText: 'Buddy há 1 ano e 9 meses',
    crossStats: {
      deliveriesToday: 11,
      avgEurPerKm: 1.42,
      activeHoursToday: 4.2,
      syncScorePct: 94,
    },
    voiceChatStatus: 'INATIVO',
    invitedGroupName: null,
    activeChallenge: null,
    directMessages: [
      {
        id: 'DM-02',
        sender: 'EU',
        text: 'Carlos, tudo limpo na EN15 em Freixo de Cima?',
        timestamp: '22:15',
      },
    ],
  },
  {
    id: 'DIR-COURIER-03',
    callsign: 'Inês V.',
    avatarInitials: 'IV',
    avatarPhotoUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' rx='40' fill='%23312e81'/><circle cx='40' cy='30' r='14' fill='%23a78bfa'/><path d='M16 68c4-14 14-22 24-22s20 8 24 22' fill='%23a78bfa'/></svg>",
    vehicle: 'Scooter Elétrica',
    distanceKm: 2.4,
    zoneName: 'Vila Meã',
    cellId: 'CELL-AMR-VILA-MEA',
    reputationPct: 98,
    orderStatus: 'OCUPADO_COM_PEDIDO',
    currentOrderPlatform: 'Uber Eats',
    contactPermission: 'NENHUM',
    isOnlineActive: true,
    lastMessageDeliveryState: 'NENHUMA',
    buddyTenureText: 'Buddy há 1 ano e 2 meses',
    crossStats: {
      deliveriesToday: 13,
      avgEurPerKm: 1.49,
      activeHoursToday: 4.5,
      syncScorePct: 91,
    },
    directMessages: [],
  },
  {
    id: 'DIR-COURIER-04',
    callsign: 'Rui S.',
    avatarInitials: 'RS',
    avatarPhotoUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' rx='40' fill='%233f3f46'/><circle cx='40' cy='30' r='14' fill='%23fbbf24'/><path d='M16 68c4-14 14-22 24-22s20 8 24 22' fill='%23fbbf24'/></svg>",
    vehicle: 'Mota 125cc',
    distanceKm: 3.8,
    zoneName: 'Lixa / Felgueiras',
    cellId: 'CELL-AMR-LIXA',
    reputationPct: 95,
    orderStatus: 'OCUPADO_COM_PEDIDO',
    currentOrderPlatform: 'Glovo',
    contactPermission: 'PENDENTE',
    isOnlineActive: true,
    lastMessageDeliveryState: 'PENDENTE',
    buddyTenureText: 'Buddy há 8 meses',
    crossStats: {
      deliveriesToday: 9,
      avgEurPerKm: 1.36,
      activeHoursToday: 3.6,
      syncScorePct: 87,
    },
    directMessages: [],
  },
  {
    id: 'DIR-COURIER-05',
    callsign: 'André F.',
    avatarInitials: 'AF',
    avatarPhotoUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' rx='40' fill='%2318181b'/><circle cx='40' cy='30' r='14' fill='%2394a3b8'/><path d='M16 68c4-14 14-22 24-22s20 8 24 22' fill='%2394a3b8'/></svg>",
    vehicle: 'Carro',
    distanceKm: 5.1,
    zoneName: 'Marco de Canaveses',
    cellId: 'CELL-AMR-MARCO',
    reputationPct: 94,
    orderStatus: 'DISPONIVEL',
    contactPermission: 'NENHUM',
    isOnlineActive: true,
    lastMessageDeliveryState: 'NENHUMA',
    buddyTenureText: 'Buddy há 3 anos e 1 mês',
    crossStats: {
      deliveriesToday: 10,
      avgEurPerKm: 1.31,
      activeHoursToday: 4.0,
      syncScorePct: 89,
    },
    directMessages: [],
  },
  {
    id: 'DIR-COURIER-06',
    callsign: 'Miguel P.',
    avatarInitials: 'MP',
    avatarPhotoUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' rx='40' fill='%23064e3b'/><circle cx='40' cy='30' r='14' fill='%2334d399'/><path d='M16 68c4-14 14-22 24-22s20 8 24 22' fill='%2334d399'/></svg>",
    vehicle: 'Mota 125cc',
    distanceKm: 6.4,
    zoneName: 'São Gonçalo',
    cellId: 'CELL-AMR-CENTRO',
    reputationPct: 96,
    orderStatus: 'OCUPADO_COM_PEDIDO',
    currentOrderPlatform: 'Bolt Food',
    contactPermission: 'NENHUM',
    isOnlineActive: true,
    lastMessageDeliveryState: 'NENHUMA',
    buddyTenureText: 'Buddy há 1 ano e 5 meses',
    crossStats: {
      deliveriesToday: 15,
      avgEurPerKm: 1.48,
      activeHoursToday: 5.1,
      syncScorePct: 92,
    },
    directMessages: [],
  },
  {
    id: 'DIR-COURIER-07',
    callsign: 'Sofia L.',
    avatarInitials: 'SL',
    avatarPhotoUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' rx='40' fill='%234c1d95'/><circle cx='40' cy='30' r='14' fill='%23f472b6'/><path d='M16 68c4-14 14-22 24-22s20 8 24 22' fill='%23f472b6'/></svg>",
    vehicle: 'Scooter Elétrica',
    distanceKm: 7.2,
    zoneName: 'Vila Meã',
    cellId: 'CELL-AMR-VILA-MEA',
    reputationPct: 99,
    orderStatus: 'DISPONIVEL',
    contactPermission: 'APROVADO',
    isOnlineActive: true,
    lastMessageDeliveryState: 'MENSAGEM_RECEBIDA',
    buddyTenureText: 'Buddy há 2 anos e 1 mês',
    crossStats: {
      deliveriesToday: 13,
      avgEurPerKm: 1.51,
      activeHoursToday: 4.4,
      syncScorePct: 96,
    },
    directMessages: [
      {
        id: 'DM-07',
        sender: 'COLEGA',
        text: 'Vila Meã está com ótimo fluxo de pedidos na hora de jantar!',
        timestamp: '22:10',
      },
    ],
  },
];

export const SEED_INCOMING_CONTACT_REQUEST: IncomingContactRequest = {
  id: 'INC-REQ-01',
  courierId: 'DIR-COURIER-DIOGO',
  callsign: 'Diogo M.',
  vehicle: 'Mota 125cc',
  distanceKm: 0.8,
  zoneName: 'Amarante Centro / São Gonçalo',
  cellId: 'CELL-AMR-CENTRO',
  reputationPct: 97,
  orderStatus: 'DISPONIVEL',
  status: 'PENDENTE',
};

// =========================================================================
// STEP 12: ZERO-PII LOCATION ROUTE NOTES & SOCIAL "BUDDYS" COMMUNITY BLOG
// =========================================================================

export const LOCATION_NOTE_CATEGORIES: LocationNoteCategory[] = [
  'Animais soltos no local',
  'Morada errada no GPS / Pin deslocado',
  'Morada difícil de encontrar (Sem número / Entrada oculta)',
  'Má conduta recorrente no local',
  'Rota proibida / Pilaretes / Escadaria',
];

export const SEED_LOCATION_ROUTE_NOTES: LocationRouteNote[] = [
  {
    id: 'LOC-NOTE-01',
    streetOrZone: 'Rua 31 de Janeiro — Galeria Comercial (Amarante Centro)',
    orderCodeRef: '#4829',
    category: 'Morada difícil de encontrar (Sem número / Entrada oculta)',
    noteText:
      'Entrada do prédio fica nas traseiras junto à marginal do Rio Tâmega. Sem placa visível na porta principal; elevador avariado.',
    reportedBy: 'Tiago R. (Mota 125cc)',
    timestamp: 'Há 14 min',
    confirmations: 8,
  },
  {
    id: 'LOC-NOTE-02',
    streetOrZone: 'Caminho da Quinta — Freixo de Cima',
    orderCodeRef: '#4712',
    category: 'Animais soltos no local',
    noteText:
      'Portão de pátio partilhado frequentemente aberto com 2 cães de grande porte soltos no acesso pedonal. Tocar campainha cá fora.',
    reportedBy: 'Carlos M. (Scooter Elétrica)',
    timestamp: 'Há 35 min',
    confirmations: 12,
  },
  {
    id: 'LOC-NOTE-03',
    streetOrZone: 'Av. General Silveira — Rotunda São Gonçalo',
    orderCodeRef: '#4690',
    category: 'Morada errada no GPS / Pin deslocado',
    noteText:
      'O Pin do GPS na Glovo e Uber manda parar 250m antes na via rápida. O acesso real é na perpendicular junto à farmácia de São Gonçalo.',
    reportedBy: 'Inês V. (Scooter Elétrica)',
    timestamp: 'Há 1h',
    confirmations: 15,
  },
  {
    id: 'LOC-NOTE-04',
    streetOrZone: 'Ponte de São Gonçalo → Largo Conselheiro António Cândido',
    orderCodeRef: '#4588',
    category: 'Rota proibida / Pilaretes / Escadaria',
    noteText:
      'Pilaretes automáticos ativos 24h no centro histórico de Amarante. Contornar sempre pela Ponte Nova / EN15 (+2.3 km reais).',
    reportedBy: 'Miguel P. (Mota 125cc)',
    timestamp: 'Há 2h',
    confirmations: 19,
  },
  {
    id: 'LOC-NOTE-05',
    streetOrZone: 'Vila Meã — Bloco Residencial Estação',
    orderCodeRef: '#4510',
    category: 'Má conduta recorrente no local',
    noteText:
      'Exigência recorrente de subida ao 4.º andar sem elevador com cargas >15 kg e recusa em atender intercomunicador nos primeiros 10 min.',
    reportedBy: 'Rui S. (Mota 125cc)',
    timestamp: 'Hoje • 19:40',
    confirmations: 9,
  },
];

export const SEED_SOCIAL_BUDDY_POSTS: SocialBuddyPost[] = [
  {
    id: 'POST-BUDDY-01',
    authorId: 'DIR-COURIER-01',
    authorCallsign: 'Tiago R.',
    authorVehicle: 'Mota 125cc',
    zoneName: 'Amarante — São Gonçalo',
    timestamp: 'Há 6 min',
    category: 'DICA_RUA',
    content:
      'Malta, a Pizzaria Tâmega no Centro abriu balcão rápido exclusivo para estafetas na porta lateral! Recolhas a sair em menos de 2 minutos.',
    likesCount: 14,
    likedByUser: true,
  },
  {
    id: 'POST-BUDDY-02',
    authorId: 'DIR-COURIER-02',
    authorCallsign: 'Carlos M.',
    authorVehicle: 'Scooter Elétrica',
    zoneName: 'Amarante — Freixo de Cima',
    timestamp: 'Há 18 min',
    category: 'ALERTA_TRANSITO',
    content:
      'Atenção na descida da EN15 de Freixo de Cima para Amarante: faixa da direita com gasóleo na rotunda e obras de pavimentação.',
    likesCount: 21,
    likedByUser: false,
  },
  {
    id: 'POST-BUDDY-03',
    authorId: 'DIR-COURIER-03',
    authorCallsign: 'Inês V.',
    authorVehicle: 'Scooter Elétrica',
    zoneName: 'Amarante Retail / Vila Meã',
    timestamp: 'Há 32 min',
    category: 'ESTABELECIMENTO',
    content:
      'Burger King — Amarante Retail com sistema bloqueado e +28 min de espera à porta. Usem o comando de voz "Status estabelecimento" antes de aceitar.',
    likesCount: 19,
    likedByUser: false,
  },
];

// =========================================================================
// STEP 13: CUSTOMIZABLE ALERT PREFERENCES, DUAL VOICE ACTIVATION & AUTO-MESSAGES
// =========================================================================

export const DEFAULT_ALERT_POPUP_PREFERENCES: AlertPopupPreferences = {
  position: 'BOTTOM',
  sizeVh: '45VH',
  durationMode: '5S',
};

export const DEFAULT_VOICE_ACTIVATION_CONFIG: VoiceActivationConfig = {
  triggerWordEnabled: true,
  customTriggerWord: 'Buddy',
  pushToTalkEnabled: true,
};

export const SEED_CUSTOM_AUTO_MESSAGES: CustomAutoMessage[] = [
  // 1. Mensagens p/ Clientes
  {
    id: 'AUTO-MSG-CLI-01',
    category: 'CLIENTE',
    title: 'A caminho com o pedido',
    voiceTriggerPhrase: 'Buddy avisar cliente a caminho',
    messageBody: 'Estou a caminho com o seu pedido.',
  },
  {
    id: 'AUTO-MSG-CLI-02',
    category: 'CLIENTE',
    title: 'Cheguei ao local',
    voiceTriggerPhrase: 'Buddy avisar cliente cheguei',
    messageBody: 'Cheguei ao local de entrega.',
  },
  {
    id: 'AUTO-MSG-CLI-03',
    category: 'CLIENTE',
    title: 'Aguardando no restaurante',
    voiceTriggerPhrase: 'Buddy avisar cliente restaurante',
    messageBody: 'Aguardando no restaurante (pedido em preparação).',
  },
  // 2. Mensagens p/ Suporte
  {
    id: 'AUTO-MSG-SUP-01',
    category: 'SUPORTE',
    title: 'Divisão de pedido (Excesso de peso/volume)',
    voiceTriggerPhrase: 'Dividir pedido',
    messageBody:
      'Solicito divisão do pedido devido a excesso de peso/volume.',
  },
  {
    id: 'AUTO-MSG-SUP-02',
    category: 'SUPORTE',
    title: 'Espera excessiva (>15 min)',
    voiceTriggerPhrase: 'Buddy suporte espera excessiva',
    messageBody: 'Restaurante com tempo de espera excessivo (>15 min).',
  },
  {
    id: 'AUTO-MSG-SUP-03',
    category: 'SUPORTE',
    title: 'Morada incorreta / Pilaretes GPS',
    voiceTriggerPhrase: 'Buddy suporte morada bloqueada',
    messageBody: 'Morada incorreta / Ponto GPS bloqueado por pilaretes.',
  },
  // 3. Mensagens p/ Outros Estafetas (Buddys)
  {
    id: 'AUTO-MSG-BUD-01',
    category: 'ESTAFETA_BUDDY',
    title: 'Pedir ajuda p/ dividir carga',
    voiceTriggerPhrase: 'Buddy pedir ajuda carga',
    messageBody: 'Alguém disponível perto para dividir pedido pesado?',
  },
  {
    id: 'AUTO-MSG-BUD-02',
    category: 'ESTAFETA_BUDDY',
    title: 'Alerta de trânsito / fiscalização',
    voiceTriggerPhrase: 'Buddy avisar trânsito',
    messageBody: 'Atenção: trânsito lento / fiscalização nesta via.',
  },
  {
    id: 'AUTO-MSG-BUD-03',
    category: 'ESTAFETA_BUDDY',
    title: 'Disponível na zona',
    voiceTriggerPhrase: 'Buddy estou livre',
    messageBody: 'Estou livre na zona.',
  },
];

// =========================================================================
// STEP 14: EVIDENTIARY REPORT ARCHIVE VAULT ("ARQUIVO DE PROVAS") &
// PLATFORM-SEGMENTED LEDGERS + GOALS (UBER EATS, GLOVO, BOLT FOOD)
// =========================================================================

export const SEED_EVIDENTIARY_VAULT_RECORDS: EvidentiaryVaultRecord[] = [
  // 1. Autoridades / Via Pública (Government Neglect)
  {
    id: 'EVID-AUT-01',
    protocolId: 'PROVA-MUN-2026-0841',
    category: 'AUTORIDADES_VIA_PUBLICA',
    title: 'Buraco recorrente profundo na EN15 (Risco de queda grave)',
    streetOrZoneGps: 'EN15 — Rotunda de São Gonçalo (Amarante) • 41.2688° N, 8.0782° W',
    firstReportedDate: '06/09/2026',
    daysUnresolved: 42,
    confirmationsCount: 34,
    recurrenceHistory:
      '4.ª Reincidência • Remendo provisório de alcatrão frio cedeu após chuva em Set/Out; 3 jantes empenadas.',
    description:
      'Cratera de 12 cm de profundidade em plena trajetória de veículos de 2 rodas junto à tampa de saneamento sem qualquer sinalização luminosa.',
    legalImpactSummary:
      'Omissão de dever de conservação da via pública (Responsabilidade Civil Extracontratual da Autarquia por danos materiais e sinistros rodoviários).',
  },
  {
    id: 'EVID-AUT-02',
    protocolId: 'PROVA-MUN-2026-0892',
    category: 'AUTORIDADES_VIA_PUBLICA',
    title: 'Obras sem iluminação noturna e desvio cego s/ chapa metálica fixa',
    streetOrZoneGps: 'Av. General Silveira / Acesso Ponte Nova (Amarante) • 41.2704° N, 8.0815° W',
    firstReportedDate: '29/09/2026',
    daysUnresolved: 19,
    confirmationsCount: 22,
    recurrenceHistory:
      '2.ª Reincidência • Baias tombadas no asfalto e vala aberta sem balizamento refletor noturno.',
    description:
      'Vala de intervenção na rede com chapa metálica solta e escorregadia em dias de humidade, provocando derrapagem de motociclos.',
    legalImpactSummary:
      'Violação das normas de sinalização temporária de obras na via pública e perigo iminente para motociclistas.',
  },
  // 2. Plataformas (Abuso / Descaso)
  {
    id: 'EVID-PLAT-01',
    protocolId: 'PROVA-PLAT-2026-1104',
    category: 'PLATAFORMAS_ABUSO',
    platformName: 'Glovo',
    orderCodeRef: '#4829',
    title: 'Atribuição ilegal de 27.0 kg a estafeta individual + Corte de tarifa de desvio',
    streetOrZoneGps: 'Continente Modelo — Amarante → Padronelo',
    firstReportedDate: '04/10/2026',
    daysUnresolved: 14,
    confirmationsCount: 29,
    recurrenceHistory:
      'Padrão sistemático (18 ocorrências registadas em Amarante em 30 dias sem compensação de Courier Extra).',
    description:
      'Aplicação atribuiu 1x Grade Cerveja (14.8 kg) + 2x Garrafões Água 6L (12.2 kg) a veículo de 2 rodas (limite ergonómico 12 kg) e recusou ajuste de km em rota bloqueada por pilaretes.',
    legalImpactSummary:
      'Incumprimento das normas de Segurança e Saúde no Trabalho (sobrecarga ergonómica >225%) e enriquecimento sem causa por quilometragem real não paga.',
  },
  {
    id: 'EVID-PLAT-02',
    protocolId: 'PROVA-PLAT-2026-1138',
    category: 'PLATAFORMAS_ABUSO',
    platformName: 'Uber Eats',
    orderCodeRef: '#4588',
    title: 'Cálculo de tarifa por linha reta sob zona pedonal bloqueada por pilaretes',
    streetOrZoneGps: 'Rua 31 de Janeiro → Largo de São Gonçalo (Amarante Centro)',
    firstReportedDate: '20/09/2026',
    daysUnresolved: 28,
    confirmationsCount: 41,
    recurrenceHistory:
      'Reincidência diária • App anuncia 1.4 km mas trajeto legal pela Ponte Nova obriga a 3.7 km (+2.3 km não pagos).',
    description:
      'Algoritmo traça rota pela Ponte Pedonal de São Gonçalo com pilaretes ativos 24h, recusando revisão automática de tarifa no suporte.',
    legalImpactSummary:
      'Indução a contraordenação rodoviária ou prestação de trabalho não remunerado (+164% de distância real obrigatória).',
  },
  // 3. Entregadores (Registados ou Não no App)
  {
    id: 'EVID-ENT-01',
    protocolId: 'PROVA-COND-2026-0419',
    category: 'ENTREGADORES_CONDUTA',
    courierRegistrationStatus: 'EXTERNO_NAO_REGISTADO',
    externalCourierDescriptor:
      'Estafeta Externo (Não Registado) • Scooter preta s/ suporte visível + Mala térmica verde sem número',
    title: 'Subtração / Violação de saco selado no balcão de recolha rápida',
    streetOrZoneGps: 'Amarante Retail Park — Zona de Restauração',
    firstReportedDate: '11/10/2026',
    daysUnresolved: 7,
    confirmationsCount: 11,
    recurrenceHistory:
      '3 alertas na mesma semana em estabelecimentos de Amarante Retail e São Gonçalo.',
    description:
      'Indivíduo externo não registado na rede recolheu saco deixado na estante sem apresentar código no ecrã, prejudicando o estafeta titular.',
    legalImpactSummary:
      'Prova comunitária para isenção de responsabilidade do estafeta titular perante a plataforma e exigência de entrega controlada no balcão.',
  },
  {
    id: 'EVID-ENT-02',
    protocolId: 'PROVA-COND-2026-0445',
    category: 'ENTREGADORES_CONDUTA',
    courierRegistrationStatus: 'REGISTADO_APP',
    externalCourierDescriptor:
      'Usuário Registado (#ID-8841 • Conta sob auditoria de conduta)',
    title: 'Condução perigosa em passeio pedonal e conflito na fila de recolha',
    streetOrZoneGps: 'Largo de São Gonçalo — Entrada Lateral Centro Comercial (Amarante)',
    firstReportedDate: '15/10/2026',
    daysUnresolved: 3,
    confirmationsCount: 8,
    recurrenceHistory:
      '2.º reporte confirmado por colegas da zona de Amarante.',
    description:
      'Entrada em alta velocidade pelo passeio pedonal junto à porta de recolha, gerando risco para peões e bloqueio de acesso aos demais estafetas.',
    legalImpactSummary:
      'Registo disciplinar comunitário para redução de reputação no diretório e proteção coletiva da categoria.',
  },
  // 4. Estabelecimentos
  {
    id: 'EVID-EST-01',
    protocolId: 'PROVA-EST-2026-0712',
    category: 'ESTABELECIMENTOS',
    establishmentName: 'Burger King — Amarante Retail',
    platformName: 'Glovo',
    title: 'Espera crónica >28 min sem taxa de espera e proibição de uso de WC/abrigo',
    streetOrZoneGps: 'Amarante Retail Park • EN15',
    firstReportedDate: '18/09/2026',
    daysUnresolved: 30,
    confirmationsCount: 37,
    recurrenceHistory:
      '24 turnos consecutivos com atraso médio de 28 a 35 minutos no turno de jantar.',
    description:
      'Estabelecimento marca o pedido como "Pronto para recolha" antes de iniciar a confeção, retendo estafetas na rua à chuva sem compensação.',
    legalImpactSummary:
      'Manipulação de tempos de espera e violação das condições mínimas de dignidade laboral em ponto de recolha.',
  },
  // 5. Locais / Clientes (Má Conduta - Zero PII)
  {
    id: 'EVID-LOC-01',
    protocolId: 'PROVA-LOC-2026-0950',
    category: 'LOCAIS_CLIENTES_ZERO_PII',
    orderCodeRef: '#4510',
    title: 'Recusa sistemática em atender intercomunicador + Cães soltos no pátio (Zero-PII)',
    streetOrZoneGps: 'Vila Meã — Bloco Residencial Estação (Amarante)',
    firstReportedDate: '01/10/2026',
    daysUnresolved: 17,
    confirmationsCount: 14,
    recurrenceHistory:
      '6 ocorrências idênticas registadas apenas por Código de Pedido e Bloco/Rua (Zero-PII / RGPD).',
    description:
      'Local com portão destrancado e 2 animais de grande porte soltos no acesso; destinatário exige entrada sem contenção dos animais e demora >12 min a responder.',
    legalImpactSummary:
      'Direito legítimo de recusa de entrada em recinto com risco à integridade física (Entrega segura na portaria exterior sem penalização).',
  },
];

export const DEFAULT_PLATFORM_LEDGERS: PlatformLedgersMap = {
  'Uber Eats': {
    platform: 'Uber Eats',
    dailyGrossEur: 42.5,
    weeklyGrossEur: 265.0,
    monthlyGrossEur: 1080.0,
    specificTaxAndSsPct: 15.0,
    fleetCommissionPct: 10.0,
    tipsAndBonusesEur: 6.5,
    payoutMethodology: 'Repasse Semanal (Terça-feira) / Cashout Instantâneo',
    nextPayoutDateLabel: 'Terça-feira • Transferência SEPA Direta',
    completedDeliveriesToday: 7,
    completedKmToday: 16.4,
    completedKmWeek: 102.0,
    completedKmMonth: 418.0,
    hoursWorkedToday: 2.1,
    dailyNetGoalEur: 85.0,
    weeklyNetGoalEur: 600.0,
    monthlyNetGoalEur: 1800.0,
    dailyNetEarnedEur: 33.8,
    weeklyNetEarnedEur: 204.5,
    monthlyNetEarnedEur: 842.0,
  },
  Glovo: {
    platform: 'Glovo',
    dailyGrossEur: 31.0,
    weeklyGrossEur: 198.0,
    monthlyGrossEur: 810.0,
    specificTaxAndSsPct: 15.0,
    fleetCommissionPct: 0.0,
    tipsAndBonusesEur: 3.5,
    payoutMethodology: 'Acerto Diário Noturno de Carteira + Repasse Quinzenal/Semanal',
    nextPayoutDateLabel: 'Quinta-feira • Reconciliação c/ Caixa Dinheiro',
    completedDeliveriesToday: 5,
    completedKmToday: 11.8,
    completedKmWeek: 74.5,
    completedKmMonth: 305.0,
    hoursWorkedToday: 1.5,
    dailyNetGoalEur: 40.0,
    weeklyNetGoalEur: 260.0,
    monthlyNetGoalEur: 800.0,
    dailyNetEarnedEur: 24.6,
    weeklyNetEarnedEur: 158.0,
    monthlyNetEarnedEur: 645.0,
  },
  'Bolt Food': {
    platform: 'Bolt Food',
    dailyGrossEur: 16.5,
    weeklyGrossEur: 105.0,
    monthlyGrossEur: 430.0,
    specificTaxAndSsPct: 15.0,
    fleetCommissionPct: 6.0,
    tipsAndBonusesEur: 2.0,
    payoutMethodology: 'Ciclo Semanal (Segunda/Terça) + Ajuste de Bónus/Taxas',
    nextPayoutDateLabel: 'Segunda-feira • Ciclo Semanal Automático',
    completedDeliveriesToday: 2,
    completedKmToday: 6.3,
    completedKmWeek: 35.5,
    completedKmMonth: 137.0,
    hoursWorkedToday: 0.7,
    dailyNetGoalEur: 15.0,
    weeklyNetGoalEur: 80.0,
    monthlyNetGoalEur: 330.0,
    dailyNetEarnedEur: 12.6,
    weeklyNetEarnedEur: 77.5,
    monthlyNetEarnedEur: 313.0,
  },
};

// =========================================================================
// STEP 15: EMBEDDED AI AGENT (GOOGLE AI STUDIO / GEMINI 2.5 FLASH) &
// REAL-TIME SKILL & PATTERN LEARNING LOGS DASHBOARD (CONSOLA DO PROPRIETÁRIO)
// =========================================================================

export const DEFAULT_AI_AGENT_MASTER_CONFIG: AiAgentMasterConfig = {
  geminiApiKey: 'AIzaSyD-BuddyPro25-AmaranteLiveKey994',
  selectedGeminiModel: 'GEMINI_PRO_LATEST',
  customExperimentalModelId: 'gemini-2.5-pro-preview',
  activeResolvedModelName: 'gemini-pro-latest',
  connectionStatus: 'ATIVO',
  lastTestedAt: 'Hoje • 22:24 (gemini-pro-latest • 142ms)',
  lastResponseStatusText: '200 OK • Motor gemini-pro-latest Ativo',
  lastLatencyMs: 142,
  continuousLearningEnabled: true,
  dailyQuotaTier: 'FREE_TIER_1500_DIA',
  dailyApiCallsUsed: 184,
  dailyApiCallsMax: 1500,
  networkSyncSpeedMode: 'FASE_1_TEMPO_REAL_INSTANTANEO',
  supabaseUrl: '',
  supabaseAnonKey: '',
  supabaseRealtimeConnected: true,
  supabaseLastConnectedAt: '🟢 Ligado ao Supabase (Ativo)',
  productionModeRealOnly: true,
};

export const SEED_AI_SKILL_LEARNING_LOGS: AiSkillLearningLogEntry[] = [
  // Category 1: Learned Screen & Button Tasks (SKILLS_TOQUE_UI)
  {
    id: 'AI-SKILL-UI-101',
    timestamp: 'Há 2 min • 22:23:14',
    category: 'SKILLS_TOQUE_UI',
    platformOrApp: 'Glovo',
    skillTitle: 'Skill Aprendida: Dividir Pedido Pesado (>12kg) — Glovo v14.2',
    actionSequenceSummary:
      'Toque %X:88 %Y:14 (Ícone Suporte) → Toque %X:50 %Y:64 ("Excesso de Peso / Volume") → Colar Automático ("Solicito Courier Extra para 27.0 kg em Amarante") → Enviar (%X:92 %Y:89).',
    confidenceScorePct: 99.4,
    status: 'PUBLICADA_OTA',
    learnedFromCourierTag: 'Tiago R. (Mota 125cc)',
    zoneContext: 'Continente Modelo — Amarante',
    deviceModel: 'Samsung Galaxy A54 / S23 • Tela 20:9 (390x844)',
    screenAspectRatio: '20:9',
    learningOrigin: 'VOZ_ENSINADA',
  },
  {
    id: 'AI-SKILL-UI-102',
    timestamp: 'Há 7 min • 22:18:05',
    category: 'SKILLS_TOQUE_UI',
    platformOrApp: 'Uber Eats',
    skillTitle:
      'Skill Aprendida: Recusa Rápida + Captura OCR de Tarifa Líquida — Uber Eats v6.210',
    actionSequenceSummary:
      'Leitura OCR Instantânea (<120ms: Bruto, Distância, Origem/Destino) → Deteção de Pilaretes Ponte São Gonçalo → Toque %X:86 %Y:18 (Botão X Recusar Oferta).',
    confidenceScorePct: 99.1,
    status: 'PRONTA_APROVACAO',
    learnedFromCourierTag: 'Carlos M. (Scooter Elétrica)',
    zoneContext: 'Amarante Centro / São Gonçalo',
    deviceModel: 'Xiaomi Redmi Note 13 / Poco X6 • Tela 20:9 (393x873)',
    screenAspectRatio: '20:9',
    learningOrigin: 'PASSIVA_AUTOMATICA',
  },
  {
    id: 'AI-SKILL-UI-103',
    timestamp: 'Há 15 min • 22:10:42',
    category: 'SKILLS_TOQUE_UI',
    platformOrApp: 'Waze',
    skillTitle:
      'Skill Aprendida: Reportar Perigo na Via & Recalcular Ponte Nova — Waze v4.108',
    actionSequenceSummary:
      'Toque %X:89 %Y:78 (Botão Laranja Alerta) → Toque %X:52 %Y:48 ("Perigo na Via / Obras EN15") → Confirmar Desvio p/ Ponte Nova (%X:50 %Y:84).',
    confidenceScorePct: 98.7,
    status: 'PUBLICADA_OTA',
    learnedFromCourierTag: 'Inês V. (Scooter Elétrica)',
    zoneContext: 'EN15 • Freixo de Cima → Amarante',
    deviceModel: 'iPhone 14 / 15 Pro • Tela 19.5:9 (390x844)',
    screenAspectRatio: '19.5:9',
    learningOrigin: 'VOZ_ENSINADA',
  },
  // Category 2: Operational & Route Intelligence (INTELIGENCIA_RUA_AMARANTE)
  {
    id: 'AI-SKILL-RUA-201',
    timestamp: 'Há 11 min • 22:14:30',
    category: 'INTELIGENCIA_RUA_AMARANTE',
    platformOrApp: 'Glovo',
    skillTitle:
      'Padrão Detetado: Continente Modelo Amarante (+14 min espera às Sextas 19h–21h)',
    actionSequenceSummary:
      'Análise de 38 recolhas em Amarante: tempo médio real no balcão sobe de 6 min para 20 min às sextas-feiras entre as 19h e as 21h. Penalização automática de -2,40 €/h aplicada no Scanner.',
    confidenceScorePct: 97.8,
    status: 'PUBLICADA_OTA',
    learnedFromCourierTag: 'Rede Coletiva Amarante (14 Estafetas)',
    zoneContext: 'Continente Modelo — Amarante',
    deviceModel: 'Samsung Galaxy A54 / S23 • Tela 20:9 (390x844)',
    screenAspectRatio: '20:9',
    learningOrigin: 'PASSIVA_AUTOMATICA',
  },
  {
    id: 'AI-SKILL-RUA-202',
    timestamp: 'Há 19 min • 22:06:12',
    category: 'INTELIGENCIA_RUA_AMARANTE',
    platformOrApp: 'Uber Eats',
    skillTitle:
      'Desvio Real Aprendido: Travessia São Gonçalo → Freixo (+1,8 km reais face ao GPS)',
    actionSequenceSummary:
      'Correlação de telemetria GPS (3s): pilaretes ativos na Ponte de São Gonçalo obrigam a contornar pela Ponte Nova / EN15 (+1,8 km a +2,3 km não contabilizados pelo algoritmo da app).',
    confidenceScorePct: 99.6,
    status: 'PRONTA_APROVACAO',
    learnedFromCourierTag: 'Miguel P. & Tiago R.',
    zoneContext: 'São Gonçalo → Freixo de Cima',
    deviceModel: 'Motorola Moto G84 / Edge • Tela 20:9 (412x915)',
    screenAspectRatio: '20:9',
    learningOrigin: 'PASSIVA_AUTOMATICA',
  },
  // Category 3: Courier Behavioral Preferences (PADROES_UTILIZADORES)
  {
    id: 'AI-SKILL-USR-301',
    timestamp: 'Há 4 min • 22:21:09',
    category: 'PADROES_UTILIZADORES',
    platformOrApp: 'Bolt Food',
    skillTitle:
      'Perfil de Decisão: Utilizador Tiago R. recusa 92% de ofertas < 5,20 € à chuva ou p/ Lixa',
    actionSequenceSummary:
      'Modelo preditivo individual ajustado: quando meteorologia = Chuva ou destino = Lixa/Felgueiras (>5 km), limiar mínimo recomendado sobe automaticamente para 5,20 € (1,45 €/km líquidos).',
    confidenceScorePct: 96.5,
    status: 'PUBLICADA_OTA',
    learnedFromCourierTag: 'Tiago R. (Mota 125cc)',
    zoneContext: 'Amarante → Lixa / Felgueiras',
    deviceModel: 'Samsung Galaxy A54 / S23 • Tela 20:9 (390x844)',
    screenAspectRatio: '20:9',
    learningOrigin: 'PASSIVA_AUTOMATICA',
  },
  {
    id: 'AI-SKILL-USR-302',
    timestamp: 'Há 26 min • 21:59:18',
    category: 'PADROES_UTILIZADORES',
    platformOrApp: 'Uber Eats',
    skillTitle:
      'Preferência de Voz & Turno: Carlos M. prioriza entregas curtas (<3,5 km) em Freixo e Vila Meã',
    actionSequenceSummary:
      'Padrão comportamental: 88% de aceitação em rotas rápidas EN15 (Freixo/Vila Meã) com acionamento frequente da macro de voz "Buddy avisar cliente a caminho" aos 400m do destino.',
    confidenceScorePct: 95.2,
    status: 'PRONTA_APROVACAO',
    learnedFromCourierTag: 'Carlos M. (Scooter Elétrica)',
    zoneContext: 'Freixo de Cima / Vila Meã',
    deviceModel: 'Xiaomi Redmi Note 13 / Poco X6 • Tela 20:9 (393x873)',
    screenAspectRatio: '20:9',
    learningOrigin: 'PASSIVA_AUTOMATICA',
  },
];
