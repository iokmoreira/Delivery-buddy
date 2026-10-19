export type PlatformName = 'Uber Eats' | 'Glovo' | 'Bolt Food';

export type AppTabId =
  | 'scanner'
  | 'walkietalkie'
  | 'reclamacoes'
  | 'calculadora'
  | 'radar'
  | 'financas'
  | 'voz_suporte'
  | 'menu_mais'
  | 'admin_backoffice';

export type AppViewMode = 'MODO_ESTAFETA' | 'PAINEL_ADMIN';

export type ScannerSubTabId =
  | 'RESUMO_ROTA'
  | 'PESO_DIVIDIDO'
  | 'EDITAR_MANUAL';

export type VehicleType =
  | 'Mota 125cc (Gasolina)'
  | 'Scooter Elétrica'
  | 'Automóvel Ligeiro'
  | 'Bicicleta Elétrica';

export interface VehicleCostProfile {
  vehicleType: VehicleType;
  fuelOrEnergyPerKm: number; // €/km
  maintenanceAndTiresPerKm: number; // €/km
  insuranceAndTaxPerDay: number; // €/dia
  minTargetNetPerKm: number; // €/km mínimo aceitável (ex: 1.00 €/km)
  minTargetHourlyEur: number; // €/hora mínimo aceitável (ex: 11.00 €/h)
  platformKmReferenceRate: number; // Tarifa média por km p/ cálculo de desvio roubado (ex: 0.65 €/km)
}

export type ComplaintCategory =
  | 'RESTAURANTE_CRITICO'
  | 'CLIENTE_MORADA'
  | 'TARIFA_SUPORTE'
  | 'ROTA_ILEGAL_DESVIO';

export type RouteTrapTag =
  | 'Zona Pedonal / Pilaretes (Bloqueado)'
  | 'Sentido Proibido / Trajeto Ilegal'
  | 'Escadaria / Passagem Pedonal'
  | 'Via Cortada / Obras Ignoradas'
  | 'Faixa Exclusiva BUS / Multa';

export interface ComplaintRecord {
  id: string;
  createdAt: string;
  category: ComplaintCategory;
  platform: PlatformName;
  cityZone: string;
  title: string;
  description: string;
  confirmationsCount: number;

  // Restaurant-specific fields
  restaurantName?: string;
  avgWaitTimeMinutes?: number;

  // Route Trap ("Rotas Proibidas & Desvios Não Pagos") fields (Step 2)
  segmentOriginDest?: string;
  appAnnouncedKm?: number;
  realLegalKm?: number;
  unpaidDetourKm?: number; // +X.X km
  stolenTariffEur?: number; // -X.XX € roubados na tarifa
  routeTrapTags?: RouteTrapTag[];
}

export interface ScannedOffer {
  id: string;
  presetNumber?: number;
  presetBadge?: string;
  platform: PlatformName;
  grossAmountEur: number;
  appAnnouncedKm: number;
  estimatedMinutes: number;
  originName: string;
  destinationName: string;
  segmentText: string;
  cityZone: string;
  ocrRawSnippet: string;

  // Step 2 / Step 3 Split-Order Detection fields (Zero-PII: Order Code + Street/Zone only)
  orderId?: string;
  isSplitOrderCandidate?: boolean;
  splitOrderVolumeWarning?: string;
  itemsCountLabel?: string;

  // Matched Route Trap or Critical Restaurant links
  matchedRouteTrapId?: string;
  matchedRestaurantComplaintId?: string;

  // Optional uploaded screenshot data URL
  uploadedScreenshotUrl?: string;
}

export interface PreFilledRouteTrapDraft {
  platform: PlatformName;
  cityZone: string;
  segmentOriginDest: string;
  appAnnouncedKm: number;
  realLegalKm: number;
  routeTrapTags: RouteTrapTag[];
  description: string;
}

export interface ShiftTripLog {
  id: string;
  timestamp: string;
  platform: PlatformName;
  segment: string;
  grossEur: number;
  realKm: number;
  netProfitEur: number;
  netEurPerKm: number;
  verdict: 'ACEITE' | 'RECUSADA';
}

// ============================================================================
// STEP 3 MODELS: WEIGHT AUDITOR, SPLIT-ORDER MATCHMAKING, WALKIE-TALKIE & SOS
// ============================================================================

export interface HeavyItemReference {
  id: string;
  name: string;
  unitWeightKg: number;
  includesGlassPackaging?: boolean;
  singleItemOverloadAlert?: boolean;
}

export interface OrderAuditedItem {
  itemId: string;
  quantity: number;
}

export type CargoChecklistItemId =
  | 'CARGO_GRADE_CERVEJA_14_8'
  | 'CARGO_GARRAFOES_AGUA_12_2'
  | 'CARGO_AGUARDAR_COLEGA_MORADA';

export interface CargoSplitChecklistState {
  CARGO_GRADE_CERVEJA_14_8: boolean;
  CARGO_GARRAFOES_AGUA_12_2: boolean;
  CARGO_AGUARDAR_COLEGA_MORADA: boolean;
}

export type WalkieChannelId = 'PARCEIRO_PEDIDO_DIVIDIDO' | 'RADIO_ZONA_LOCAL';

export type EmergencySosType =
  | 'Acidente na Via'
  | 'Assédio / Ameaça em Curso'
  | 'Conflito c/ Cliente'
  | 'Avaria Grave';

export interface WalkieMessage {
  id: string;
  channel: WalkieChannelId;
  senderId: string;
  senderName: string;
  senderVehicle: string;
  senderTrustScore: number; // e.g., 98
  timestamp: string;
  text: string;
  isVoicePtt?: boolean;
  voiceDurationSec?: number;
  communityFlagsCount: number; // Auto-mutes sender at 3 flags
  isSystemCargoSync?: boolean;
  isSosBroadcast?: boolean;
  sosEmergencyType?: EmergencySosType;
  exactGpsCoords?: string;
  exactStreetAddress?: string;
  isDirectLocationPin?: boolean;
  targetRecipientName?: string;
}

// ============================================================================
// STEP 4 MODELS: DELIVERY BUDDY PREFERENCES, 2M30S TACTICAL MAP & OPEN-MIC SOS
// ============================================================================

export type RoadHazardType =
  | 'Acidente na Via'
  | 'Buraco Perigoso na Pista'
  | 'Obras na Via / Desvio'
  | 'Animais na Pista'
  | 'Piso Escorregadio / Óleo'
  | 'Anomalia Geral';

export interface RoadHazardPin {
  id: string;
  hazardType: RoadHazardType;
  streetLocation: string;
  cityZone: string;
  reportedAt: string;
  reporterName: string;
  confirmations: number;
  resolved: boolean;
  gridX: number; // 10 - 90%
  gridY: number; // 15 - 85%
}

export type TacticalCellDemandStatus =
  | 'Alta Demanda / Poucos Estafetas'
  | 'Equilibrado'
  | 'Zona Saturada - Evitar';

export interface TacticalMapCell {
  id: string;
  zoneName: string;
  status: TacticalCellDemandStatus;
  activeCouriersCount: number;
  busyWithOrderCount?: number;
  availableIdleCount?: number;
  avgWaitOrdersCount: number;
  recommendedAction: string;
}

export type LocationPrivacyMode =
  | 'APROXIMADA_ZONA_2M30S'
  | 'EXATA_EQUIPA_AMIGOS'
  | 'OCULTA_APENAS_ALERTAS';

export type OfferFilterLogicMode =
  | 'EXIGIR_AMBOS'
  | 'APENAS_VALOR_MINIMO'
  | 'APENAS_RENTABILIDADE_KM';

export interface MasterUserPreferences {
  // 1. Privacidade & Localização
  anonymousMode: boolean; // Modo Anónimo Global (On/Off)
  locationPrivacyMode: LocationPrivacyMode;
  contributeAnonymousStats: boolean;

  // 2. Comunicação & Segurança
  zoneWalkieActive: boolean;
  autoOpenMicOnSos: boolean;
  autoTtsOnNewOffer: boolean;

  // 3. Regras de Decisão, Auto-Accept & Auto-Decline ("Critérios de Corrida")
  minGrossOrderValueEur: number; // Valor Mínimo Absoluto por Pedido € (Default: 4.00 €)
  minNetProfitPerKmEur: number; // Mínimo Líquido €/km (Default: 1.00 €/km)
  filterLogicMode: OfferFilterLogicMode;
  autoAcceptEnabled: boolean; // Aceitação Automática de Pedidos - Simulação Accessibility
  autoDeclineEnabled: boolean; // Step 5: Recusa Automática de Pedidos - Simulação Accessibility
}

export interface ActiveSosBeaconState {
  active: boolean;
  emergencyType: EmergencySosType;
  openMicLocked: boolean;
  exactGpsCoords: string;
  exactStreetAddress: string;
  triggeredAt: string;
  liveTranscriptLines: string[];
}

// ============================================================================
// STEP 5 MODELS: AUTH GATE, AI MULTI-APP VERIFICATION, PAUSE MODE & BLACKLIST
// ============================================================================

export type CourierContractModel =
  | 'Recibos Verdes / Independente'
  | 'Frota Parceira';

export type VerificationMethodType =
  | 'IA_SCREENSHOT_FACIAL'
  | 'CODIGO_PADRINHO';

export interface CourierVerifiedAccount {
  courierName: string;
  emailOrPhone: string;
  connectedPlatforms: PlatformName[];
  contractModel: CourierContractModel;
  verificationMethod: VerificationMethodType;
  verifiedAt: string;
  keepLoggedInShift: boolean;
  unifiedMapPinId: string;
}

// ============================================================================
// STEP 6 MODELS: GLOVO NIGHTLY WALLET RECONCILER, FLEET (10%) & TAX TRACKER,
// PERSONAL GOALS PACING ENGINE & BUDDYREWARDS SYSTEM
// ============================================================================

export type FinanceSubTabId =
  | 'CARTEIRA_GLOVO_IMPOSTOS'
  | 'METAS_PESSOAIS_RITMO'
  | 'RECOMPENSAS_PATENTES';

export interface GlovoDailyWalletState {
  initialAppWalletEur: number; // Saldo Inicial da Carteira na App (€)
  dailyGrossGlovoEur: number; // Ganhos Brutos do Dia na Glovo (€)
  cashReceivedHandsEur: number; // Dinheiro Recebido na Mão (Clientes) (€)
  cashPaidAtRestaurantsEur: number; // Dinheiro Pago pelo Estafeta nos Restaurantes (€)
  nightlyTransferMadeEur: number; // Repasse / Transferência Noturna Efetuada (€)
  nextMorningActualGlovoBalanceEur: number; // Saldo real apresentado pela Glovo na manhã seguinte (€)
  auditClosedToday: boolean;
}

export type TaxWorkRegimeMode = 'FROTA_10_UBER' | 'RECIBOS_VERDES';

export type CaeCirsPresetOption =
  | 'CAE 53200 - Outras atividades postais e de courier'
  | 'CIRS 1519 - Outros prestadores de serviços'
  | 'Outro CAE Personalizado';

export type IvaRegimeType = 'ISENTO_ART_53' | 'TAXA_23';

export interface RookieInvoiceChecklistState {
  emitirReciboVerde5DiaUtil: boolean;
  validarNifPlataformasIntracomunitario: boolean;
  confirmarDeclaracaoTrimestralSs: boolean;
}

export interface TaxAndFleetConfigState {
  workMode: TaxWorkRegimeMode;
  uberGrossEur: number;
  glovoGrossEur: number;
  boltGrossEur: number;
  totalKmDriven: number;
  firstYearSsExemption: boolean;
  vatIrsReserveRatePct: number;
  invoiceChecklist: RookieInvoiceChecklistState;

  // Step 7: Customizable Fiscal, CAE & Fleet Framework
  caeCirsPreset: CaeCirsPresetOption;
  customCaeInput: string;
  customFleetCommissionPct: number; // 0% to 30% (e.g., 0, 8, 10, 12)
  socialSecurityRatePct: number; // e.g., 21.4%
  ivaRegime: IvaRegimeType; // Isento Art. 53º vs Taxa 23%
  irsWithholdingPct: number; // Retenção IRS (%)
}

export interface PersonalGoalsState {
  dailyNetGoalEur: number; // Meta Líquida Diária (€) (ex: 85.00 €)
  weeklyNetGoalEur: number; // Meta Líquida Semanal (€) (ex: 500.00 €)
  monthlyNetGoalEur: number; // Meta Líquida Mensal (€) (ex: 2,000.00 €)
  plannedShiftHours: number; // Horas Planeadas por Turno (ex: 8h)
  currentDailyNetEarnedEur: number;
  currentWeeklyNetEarnedEur: number;
  currentMonthlyNetEarnedEur: number;
  hoursWorkedToday: number;
  completedDeliveriesToday: number;
  completedKmToday?: number;
  completedKmWeek?: number;
  completedKmMonth?: number;
}

export type CourierRankTitle =
  | 'Nível 1: Estafeta Recruta'
  | 'Nível 2: Piloto Tático'
  | 'Nível 3: Veterano de Rua'
  | 'Nível 4: Lenda do Asfalto';

export type RewardTaskKey =
  | 'BATER_META_DIARIA_50'
  | 'ADERIR_PACTO_ZONA_40'
  | 'SINCRONIZAR_PEDIDO_DIVIDIDO_25'
  | 'REGISTAR_ROTA_PROIBIDA_20'
  | 'ALERTAR_ANOMALIA_MAPA_15'
  | 'BONUS_ENTREGA_HANDS_FREE_15'
  | 'FECHAR_AUDITORIA_GLOVO_10';

export interface RewardActionLogEntry {
  id: string;
  timestamp: string;
  taskKey: RewardTaskKey;
  title: string;
  pointsAwarded: number;
  xpAwarded: number;
}

export interface RewardMarketplaceItem {
  id: string;
  title: string;
  subtitle: string;
  rewardType: 'DIRETO' | 'INDIRETO';
  costBuddyCoins: number;
  minCommunityReputationPct: number; // Step 7: e.g., >= 85%
  partnerBadge: string;
  voucherCodePrefix: string;
  partnerBusinessName?: string;
}

export interface BuddyRewardsState {
  buddyCoins: number;
  xpPoints: number;
  actionHistory: RewardActionLogEntry[];
  claimedRewardIds: string[];
  claimedVoucherCodes: Record<string, string>;
}

// ============================================================================
// STEP 7 MODELS: FLOATING BUBBLE MODE, VOICE COPILOT & SUPPORT MACROS,
// COLLECTIVE ZONE PACTS, SAFETY TELEMETRY, & B2B PARTNER PORTAL
// ============================================================================

export type BubbleMilestoneEventType =
  | 'META_ATINGIDA'
  | 'PACTO_ZONA_ATIVO'
  | 'PEDIDO_DIVIDIDO_DETETADO'
  | 'ALERTA_VELOCIDADE_TELEMOVEL'
  | 'SOS_EMERGENCIA';

export interface BubbleAlertAnimationState {
  id: string;
  eventType: BubbleMilestoneEventType;
  title: string;
  subtitle: string;
  badgeText: string;
  accentColor: 'zinc' | 'white';
  voiceReadoutText: string;
  triggeredAt: string;
}

export interface ZonePactRule {
  id: string;
  title: string;
  zoneName: string;
  minCollectiveOrderEur: number; // ex: >= 5.00 €
  minCollectivePerKmEur: number; // ex: >= 1.20 €/km
  durationHoursLabel: string; // ex: Das 19:00 às 22:00 (3h)
  boycottedEstablishment?: string; // Estabelecimento Boicotado na Zona
  adheredCouriersCount: number; // ex: 34 estafetas aderiram na zona
  joinedByUser: boolean;
  createdBy: string;
}

export interface RiderSafetyTelemetryState {
  speedLimitAlertEnabled: boolean;
  urbanSpeedCapKmh: number; // ex: 50 km/h
  highwaySpeedCapKmh: number; // ex: 90 km/h
  activeRoadMode: 'URBANO' | 'VIA_RAPIDA';
  currentSimulatedSpeedKmh: number;
  phoneMisuseAlertEnabled: boolean;
  maxTouchDurationSec: number; // ex: 8 segundos
  currentTouchDurationSec: number;
  isPhoneMisuseTriggered: boolean;
  lastSafetyWarningMessage: string | null;
}

export type B2BPartnerCategory =
  | 'Posto de Combustível'
  | 'Oficina de Motas / Pneus'
  | 'Equipamento & Impermeáveis'
  | 'Contabilidade & Seguros';

export interface B2BPartnerSponsorshipRecord {
  id: string;
  businessName: string;
  category: B2BPartnerCategory;
  cityZone: string;
  discountOfferTitle: string;
  monthlySponsorshipEur: number;
  costBuddyCoins: number;
  minReputationPct: number;
  voucherPrefix: string;
  activeCouriersReached: number;
}

// ============================================================================
// STEP 8 MODELS: MASTER ADMIN BACKOFFICE, DYNAMIC MAP RADIUS & MULTI-REGION
// EXPLORER, AND INTERACTIVE ONBOARDING MANUAL & CONTEXTUAL HELP
// ============================================================================

export type MapRadiusOptionKm = 2 | 5 | 15 | 25 | 30 | 50 | 100;

export type PortugalRegionName =
  | 'Amarante (25 km)'
  | 'Amarante Centro'
  | 'Amarante — São Gonçalo'
  | 'Amarante — Madalena'
  | 'Amarante — Freixo de Cima'
  | 'Amarante — Vila Meã'
  | 'Lisboa Centro'
  | 'Grande Lisboa / Sintra / Cascais'
  | 'Porto Centro'
  | 'Grande Porto / Gaia / Matosinhos'
  | 'Braga / Guimarães'
  | 'Coimbra'
  | 'Faro / Algarve';

export interface RegionalExplorerDataset {
  regionName: PortugalRegionName;
  distanceFromCurrentKm: number;
  avgEurPerKm: number;
  activeCouriersTotal: number;
  activeRoadHazardsCount: number;
  activePactsCount: number;
  weatherSummary: string;
  topHotspotZone: string;
  cells: TacticalMapCell[];
}

export type AdminCourierKycStatus = 'Ativo' | 'Pendente IA' | 'Suspenso';

export interface AdminManagedCourierRecord {
  id: string;
  fullName: string;
  courierTag: string;
  phone: string;
  cityZone: PortugalRegionName | string;
  platforms: PlatformName[];
  reputationPct: number;
  kycStatus: AdminCourierKycStatus;
  aiMatchScorePct: number;
  joinedAt: string;
  lastActiveText: string;
  kycProofSummary: string;
  vehicle?: string;
  activeAmaranteZone?: string;
  updatedAtIso?: string;
  isSelfRegistered?: boolean;
}

export type AdminBroadcastTargetType =
  | 'TODOS_ESTAFETAS'
  | 'ZONA_ESPECIFICA'
  | 'ESTAFETA_INDIVIDUAL';

export interface AdminBroadcastMessage {
  id: string;
  createdAt: string;
  title: string;
  body: string;
  targetType: AdminBroadcastTargetType;
  targetValue: string;
  category:
    | 'OPERACIONAL_SEGURANCA_OBRIGATORIO'
    | 'PROMOCIONAL_PARCEIROS_OPT_IN';
  deliveredCount: number;
  isReadByCurrentCourier: boolean;
}

export type AdminSponsorCategory =
  | 'Seguros (Destaque Especial)'
  | 'Pneus & Travões'
  | 'Óleo & Manutenção Mecânica'
  | 'Combustível & Carregamento Elétrico'
  | 'Acessórios (Suportes, Impermeáveis, Mochilas Térmicas, Intercomunicadores)';

export type AdminBannerPlacement =
  | 'Destaque no Painel'
  | 'Catálogo de Prêmios'
  | 'Notificação de Turno';

export interface AdminSponsoredCampaign {
  id: string;
  sponsorName: string;
  category: AdminSponsorCategory;
  offerHeadline: string;
  discountOrBonusValue: string;
  requiredBuddyCoins: number;
  placement: AdminBannerPlacement;
  isActive: boolean;
  viewsCount: number;
  clicksCount: number;
  vouchersRedeemedCount: number;
  sponsorshipRevenueEur: number;
}

export interface ContextualHelpEntry {
  tabId: AppTabId;
  pageTitle: string;
  whatItDoes: string;
  howToUseQuickly: string;
  streetProTip: string;
}

// ============================================================================
// ONLINE COURIERS DIRECTORY, CONTACT PERMISSION HANDSHAKE & LIVE ORDER STATUS
// ============================================================================

export type CourierOrderAvailabilityStatus =
  | 'DISPONIVEL'
  | 'OCUPADO_COM_PEDIDO'
  | 'OCUPADO_EM_ENTREGA';

export type ContactPermissionStatus = 'NENHUM' | 'PENDENTE' | 'APROVADO';

export type MapCourierFilterMode = 'TODOS' | 'DISPONIVEIS' | 'COM_PEDIDO';

export interface DirectCourierMessage {
  id: string;
  sender: 'EU' | 'COLEGA';
  text: string;
  timestamp: string;
}

export type CourierMessageDeliveryState =
  | 'MENSAGEM_ENVIADA'
  | 'MENSAGEM_RECEBIDA'
  | 'PENDENTE'
  | 'NENHUMA';

export type BuddyChallengePeriod =
  | 'PROXIMAS_3H'
  | 'TURNO_HOJE'
  | 'SEMANAL';

export interface BuddyChallengeRecord {
  id: string;
  period: BuddyChallengePeriod;
  periodLabel: string;
  targetMetric: string;
  userCurrentScore: number;
  buddyCurrentScore: number;
  createdAt: string;
}

export type FloatingBubblesSide = 'RIGHT' | 'LEFT';
export type BuddyPopupSizeMode = '45VH' | '80VH';

export type ExternalNavMapAssistAction =
  | 'ZOOM_IN'
  | 'ZOOM_OUT'
  | 'RECENTER_ROUTE'
  | 'REPORT_HAZARD'
  | 'ALTERNATIVE_ROUTE';

export interface ExternalMapAssistExecution {
  action: ExternalNavMapAssistAction;
  label: string;
  simulatedTouchCoords: string;
  timestamp: string;
}

export interface OnlineDirectoryCourier {
  id: string;
  callsign: string;
  vehicle:
    | 'Mota'
    | 'Mota 125cc'
    | 'Scooter Elétrica'
    | 'Carro'
    | 'Bicicleta Elétrica';
  distanceKm: number;
  zoneName: string;
  cellId: string;
  reputationPct: number;
  orderStatus: CourierOrderAvailabilityStatus;
  currentOrderPlatform?: PlatformName;
  contactPermission: ContactPermissionStatus;
  directMessages: DirectCourierMessage[];
  isOnlineActive?: boolean;
  lastMessageDeliveryState?: CourierMessageDeliveryState;
  avatarInitials?: string;
  avatarPhotoUrl?: string;
  buddyTenureText?: string; // e.g., "Buddy há 2 anos e 3 meses"
  crossStats?: {
    deliveriesToday: number;
    avgEurPerKm: number;
    activeHoursToday: number;
    syncScorePct: number;
  };
  voiceChatStatus?: 'INATIVO' | 'SOLICITADO' | 'ATIVO';
  invitedGroupName?: string | null;
  activeChallenge?: BuddyChallengeRecord | null;
  isSelfProfile?: boolean;
  lat?: number;
  lng?: number;
  updatedAtIso?: string;
  activePlatforms?: PlatformName[];
}

export interface IncomingContactRequest {
  id: string;
  courierId: string;
  callsign: string;
  vehicle: 'Mota' | 'Mota 125cc' | 'Scooter Elétrica' | 'Carro';
  distanceKm: number;
  zoneName: string;
  cellId: string;
  reputationPct: number;
  orderStatus: CourierOrderAvailabilityStatus;
  status: 'PENDENTE' | 'ACEITE' | 'RECUSADO';
}

// ============================================================================
// HANDS-FREE VOICE-CONTROLLED DELIVERY LIFECYCLE STATE MACHINE
// ============================================================================

export type DeliveryLifecycleStage =
  | 'AGUARDAR_RECOLHA' // Stage 1: Aguardar Recolha (Na Loja)
  | 'EM_TRANSITO' // Stage 2: Em Trânsito (Recolhido -> Cliente)
  | 'CONCLUIDA'; // Stage 3: Finalizar Entrega (Concluída)

export interface ActiveDeliveryLifecycleState {
  orderId: string;
  platform: PlatformName;
  originName: string;
  destinationName: string;
  grossEur: number;
  netProfitEur: number;
  realKm: number;
  estimatedMinutes: number;
  stage: DeliveryLifecycleStage;
  waitSecondsAtStore: number;
  transitProgressPct: number;
  customerDropoffNotes: string;
  lastMacroExecuted: string | null;
  lastVoiceTtsConfirmation: string | null;
  completedAtTimestamp?: string;
}

// ============================================================================
// PLATFORM-AWARE "DIVIDIR PEDIDO" SUPPORT MACRO & TOUCH COORDINATE MAPPER
// ============================================================================

export type TouchMacroActionKey =
  | 'ACEITAR_PEDIDO'
  | 'RECUSAR_PEDIDO'
  | 'INICIAR_ENTREGA'
  | 'FINALIZAR_ENTREGA'
  | 'SUPORTE_DIVIDIR_PEDIDO'
  | 'SUPORTE_RESTAURANTE_ROTA';

export interface TouchCoordinatePoint {
  id: string;
  actionKey: TouchMacroActionKey;
  label: string;
  gestureType: 'TAP' | 'SWIPE';
  xPct: number;
  yPct: number;
  endXPct?: number;
  endYPct?: number;
  delayMs: number;
}

export interface PlatformTouchCoordinateMap {
  Glovo: TouchCoordinatePoint[];
  'Uber Eats': TouchCoordinatePoint[];
}

export interface SupportSplitMacroStep {
  stepNumber: number;
  label: string;
  xPct: number;
  yPct: number;
}

export interface ActiveSupportSplitMacroState {
  isRunning: boolean;
  isCompleted: boolean;
  platform: PlatformName;
  orderId: string;
  totalWeightKg: number;
  currentStepIndex: number; // 0..3
  steps: SupportSplitMacroStep[];
  autoPastedMessage: string;
  triggeredAtTimestamp: string | null;
}

// ============================================================================
// STEP 12: INVISIBLE-FIRST AUXILIARY TOOL, 3-TIER ISOLATION MODEL,
// EPHEMERAL VOICE POP-UP ENGINE, ZERO-PII LOCATION NOTES & SOCIAL BUDDYS BLOG
// ============================================================================

export type CourierWorkspaceSection = 'AREA_PRIVADA' | 'AREA_PUBLICA_SOCIAL';

export type LocationNoteCategory =
  | 'Animais soltos no local'
  | 'Morada errada no GPS / Pin deslocado'
  | 'Morada difícil de encontrar (Sem número / Entrada oculta)'
  | 'Má conduta recorrente no local'
  | 'Rota proibida / Pilaretes / Escadaria';

export interface LocationRouteNote {
  id: string;
  streetOrZone: string;
  orderCodeRef?: string; // Zero-PII: only Order Code (#4829), never customer name!
  category: LocationNoteCategory;
  noteText: string;
  reportedBy: string;
  timestamp: string;
  confirmations: number;
}

export interface SocialBuddyPost {
  id: string;
  authorId: string;
  authorCallsign: string;
  authorVehicle: string;
  zoneName: string;
  timestamp: string;
  category:
    | 'DICA_RUA'
    | 'ALERTA_TRANSITO'
    | 'ESTABELECIMENTO'
    | 'COMUNIDADE';
  content: string;
  likesCount: number;
  likedByUser?: boolean;
}

export type EphemeralVoiceCardCategory =
  | 'TRANSITO'
  | 'DEMANDA_ZONA'
  | 'MINHAS_ESTATISTICAS'
  | 'CLIMA'
  | 'ENTREGA_ATUAL_ULTIMA'
  | 'STATUS_PEDIDO'
  | 'STATUS_ESTABELECIMENTO'
  | 'ESTADO_ROTA'
  | 'MENSAGEM_AMIZADE'
  | 'SUPORTE_PLATAFORMA'
  | 'SOS_CONFIRMACAO'
  | 'GRAVACAO_SKILL_IA'
  | 'MERCADO_PROJECOES';

export interface EphemeralVoiceOverlayState {
  isOpen: boolean;
  cardCategory: EphemeralVoiceCardCategory;
  commandSpoken: string;
  title: string;
  subtitle: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryDetails: string[];
  spokenTextPtBr: string;
  countdownSecondsLeft: number; // Counts down 4 -> 0 after TTS finishes, then auto-minimizes
  wasTriggeredFromMinimized: boolean;
}

export interface SosPendingConfirmationState {
  isPending: boolean;
  secondsRemaining: number; // 5-second window to say "Confirmar SOS" or tap again
}

// ============================================================================
// STEP 13: SOFT CLEAN UI (DAYLIGHT / NIGHT THEME), ±45% ALERT POP-UP SETTINGS,
// DUAL VOICE ACTIVATION (PTT + TRIGGER WORD) & CUSTOM AUTO-MESSAGES
// ============================================================================

export type AppThemeMode = 'DAYLIGHT' | 'NIGHT';

export type AlertPopupPosition = 'BOTTOM' | 'CENTER' | 'TOP';
export type AlertPopupSizeVh = '35VH' | '45VH' | '55VH';
export type AlertPopupDurationMode = '3S' | '5S' | '10S' | 'MANUAL';

export interface AlertPopupPreferences {
  position: AlertPopupPosition;
  sizeVh: AlertPopupSizeVh;
  durationMode: AlertPopupDurationMode;
}

export interface VoiceActivationConfig {
  triggerWordEnabled: boolean;
  customTriggerWord: string; // Default: "Buddy"
  pushToTalkEnabled: boolean;
}

export type AutoMessageCategory = 'CLIENTE' | 'SUPORTE' | 'ESTAFETA_BUDDY';

export interface CustomAutoMessage {
  id: string;
  category: AutoMessageCategory;
  title: string;
  voiceTriggerPhrase: string;
  messageBody: string;
}

// ============================================================================
// STEP 14: EVIDENTIARY REPORT ARCHIVE VAULT ("ARQUIVO DE PROVAS") &
// PLATFORM-SEGMENTED / CROSS-REFERENCED FINANCES & STATISTICS
// ============================================================================

export type EvidentiaryVaultCategory =
  | 'AUTORIDADES_VIA_PUBLICA'
  | 'PLATAFORMAS_ABUSO'
  | 'ENTREGADORES_CONDUTA'
  | 'ESTABELECIMENTOS'
  | 'LOCAIS_CLIENTES_ZERO_PII';

export type CourierRegistrationTag =
  | 'EXTERNO_NAO_REGISTADO'
  | 'REGISTADO_APP';

export interface EvidentiaryVaultRecord {
  id: string;
  protocolId: string;
  category: EvidentiaryVaultCategory;
  title: string;
  streetOrZoneGps: string;
  firstReportedDate: string;
  daysUnresolved: number;
  confirmationsCount: number;
  recurrenceHistory: string;
  description: string;
  legalImpactSummary: string;
  platformName?: PlatformName;
  orderCodeRef?: string; // Zero-PII: only order code (#4829), never customer name
  courierRegistrationStatus?: CourierRegistrationTag;
  externalCourierDescriptor?: string; // Vehicle/backpack description when not registered in app
  establishmentName?: string;
}

export type PlatformFilterScope = 'GLOBAL_CRUZADO' | PlatformName;

export interface PlatformFinancialLedger {
  platform: PlatformName;
  dailyGrossEur: number;
  weeklyGrossEur: number;
  monthlyGrossEur: number;
  specificTaxAndSsPct: number;
  fleetCommissionPct: number;
  tipsAndBonusesEur: number;
  payoutMethodology: string;
  nextPayoutDateLabel: string;
  completedDeliveriesToday: number;
  completedKmToday: number;
  completedKmWeek: number;
  completedKmMonth: number;
  hoursWorkedToday: number;
  dailyNetGoalEur: number;
  weeklyNetGoalEur: number;
  monthlyNetGoalEur: number;
  dailyNetEarnedEur: number;
  weeklyNetEarnedEur: number;
  monthlyNetEarnedEur: number;
}

export type PlatformLedgersMap = Record<PlatformName, PlatformFinancialLedger>;

// ============================================================================
// STEP 16: REAL-TIME LIVE VOICE TRANSCRIPTION POP-UP ENGINE
// ("POP-UP DE TRANSCRIÇÃO DE VOZ AO VIVO" — 45% SCREEN)
// ============================================================================

export type LiveVoiceDetectedMode = 'COMANDO_BUDDY' | 'MENSAGEM_DITADA';

export type LiveVoiceDictationTargetType =
  | 'BUDDY_DIRETO'
  | 'WALKIE_CANAL'
  | 'CLIENTE'
  | 'SUPORTE';

export type LiveVoiceTranscriptionPhase =
  | 'LISTENING_STREAMING' // "A Ouvir a tua voz (pt-BR)..." (interimResults / 60ms word stream)
  | 'TRANSCRIPT_READY_COUNTDOWN' // "Transcrição Concluída" + 2s auto-send countdown for dictated messages
  | 'MESSAGE_SENT_CONFIRMATION' // Brief visual confirmation that dictated message was dispatched
  | 'COMMAND_ANSWER_CARD'; // Smooth transition inside the same 45% pop-up to spoken + visual answer card

export interface LiveVoiceDictationConfig {
  targetType: LiveVoiceDictationTargetType;
  recipientId: string;
  recipientName: string;
  initialPhrase?: string;
}

export interface LiveVoiceTranscriptionState {
  isOpen: boolean;
  mode: LiveVoiceDetectedMode;
  phase: LiveVoiceTranscriptionPhase;
  transcriptText: string;
  fullTargetText: string;
  isEditingText: boolean;
  dictationTarget?: LiveVoiceDictationConfig | null;
  sendCountdownSeconds: number; // 2 -> 1 -> 0 for dictated messages
  sendCountdownProgressPct: number; // 100 -> 0
  triggeredVia: 'PTT' | 'TRIGGER_WORD' | 'DICTATION_MIC' | 'VOICE_COMMAND';
}

// ============================================================================
// STEP 17: EMBEDDED AI AGENT (GOOGLE AI STUDIO / GEMINI 2.5 FLASH),
// PHASE 1 INSTANT REAL-TIME SYNC & SKILL LEARNING LOGS (OWNER CONSOLE)
// ============================================================================

export type AiNetworkSyncSpeedMode =
  | 'FASE_1_TEMPO_REAL_INSTANTANEO' // Fase 1: Tempo Real Instantâneo (<200ms Eventos / 3s GPS) — Default
  | 'BALANCEADO_15S' // Balanceado (15s)
  | 'ECONOMICO_2M30S'; // Económico (2m30s)

export type AiDailyQuotaTier =
  | 'FREE_TIER_1500_DIA'
  | 'PAY_AS_YOU_GO_ILIMITADO';

export type AiSkillLogCategory =
  | 'TODAS'
  | 'SKILLS_TOQUE_UI' // Category 1: Botões & Telas (UI)
  | 'INTELIGENCIA_RUA_AMARANTE' // Category 2: Padrões de Lojas & Rotas (Amarante)
  | 'PADROES_UTILIZADORES'; // Category 3: Preferências de Usuários

export type AiSkillLogStatus =
  | 'PRONTA_APROVACAO'
  | 'PUBLICADA_OTA'
  | 'DESCARTADA';

export type GeminiStudioModelSelection =
  | 'GEMINI_PRO_LATEST'
  | 'MODO_HIBRIDO_INTELIGENTE'
  | 'GEMINI_FLASH_LATEST'
  | 'EXPERIMENTAL_CUSTOM_ID';

export interface AiAgentMasterConfig {
  geminiApiKey: string;
  selectedGeminiModel: GeminiStudioModelSelection;
  customExperimentalModelId: string;
  activeResolvedModelName: string;
  connectionStatus: 'ATIVO' | 'OFFLINE_SIMULADO';
  lastTestedAt: string;
  lastResponseStatusText: string;
  lastLatencyMs: number;
  continuousLearningEnabled: boolean;
  dailyQuotaTier: AiDailyQuotaTier;
  dailyApiCallsUsed: number;
  dailyApiCallsMax: number;
  networkSyncSpeedMode: AiNetworkSyncSpeedMode;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseRealtimeConnected: boolean;
  supabaseLastConnectedAt: string;
  productionModeRealOnly: boolean;
}

export type ScreenAspectRatioTag =
  | '20:9'
  | '19.5:9'
  | '19:9'
  | '18:9'
  | '16:9'
  | '21:9';

export interface DeviceScreenProfile {
  detectedUserAgent: string;
  deviceModel: string; // e.g., "Samsung Galaxy A54 / S23 • Tela 20:9 (390x844)"
  screenAspectRatio: ScreenAspectRatioTag; // e.g., "20:9"
  screenWidthPx: number;
  screenHeightPx: number;
  devicePixelRatio: number;
  isCustomRefined?: boolean;
  autoDetected?: boolean;
  lastUpdatedAt?: string;
}

export type AiSkillLearningOrigin =
  | 'PASSIVA_AUTOMATICA'
  | 'VOZ_ENSINADA'
  | 'ENSINO_VOZ_GUIADO'
  | 'SIMULADA_ADMIN';

export interface AiSkillLearningLogEntry {
  id: string;
  timestamp: string;
  category: Exclude<AiSkillLogCategory, 'TODAS'>;
  platformOrApp:
    | 'Uber Eats'
    | 'Glovo'
    | 'Bolt Food'
    | 'Waze'
    | 'Google Maps'
    | 'Multi-Plataforma';
  skillTitle: string;
  actionSequenceSummary: string;
  confidenceScorePct: number;
  status: AiSkillLogStatus;
  learnedFromCourierTag: string;
  zoneContext: string;
  deviceModel?: string;
  screenAspectRatio?: ScreenAspectRatioTag | string;
  learningOrigin?: AiSkillLearningOrigin;
}

export interface ActiveSkillTeachingSession {
  isRecording: boolean;
  taskTitle: string;
  platformOrApp: AiSkillLearningLogEntry['platformOrApp'];
  recordedSteps: string[];
  deviceModel: string;
  screenAspectRatio: ScreenAspectRatioTag;
  startedAt: string;
}

// ============================================================================
// STEP 18: GLOBAL HOURLY MARKET TELEMETRY & PROJECTION ENGINE
// ("MÉDIAS POR HORA & PROJEÇÕES" — AMARANTE 25KM)
// ============================================================================

export interface MarketHourlySnapshot {
  id: string;
  timestamp: string;
  hourOfDay: number; // 0..23
  dayOfWeek: number; // 0..6
  onlineCouriers: number;
  freeCouriers: number;
  busyCouriers: number;
  ordersPerHour: number;
  avgDeliveryEuro: number;
  avgEuroPerKm: number;
  platformBreakdownEurPerKm: Record<PlatformName, number>;
}

export interface MarketNext3HoursProjection {
  hourLabel: string; // e.g., "16h–17h"
  demandLevel: 'PICO_ALTA' | 'ALTA' | 'MODERADA' | 'BAIXA';
  demandLabel:
    | 'Alta Demanda'
    | 'Moderada'
    | 'Estável'
    | 'A aguardar 1ª leitura real';
  saturationPct: number;
  expectedOnlineCouriers: number;
  projectedOrdersPerHour: number;
  projectedEurPerKm: number;
  confidenceNote: string;
}

export interface GlobalMarketTelemetrySummary {
  currentHourWindowLabel: string; // e.g., "15h–16h"
  // 1. Média de Estafetas Online / Hora
  onlineCouriersNow: number;
  freeCouriersNow: number;
  busyCouriersNow: number;
  historicalAvgCouriersForCurrentHour: number;
  hourlyAvgOnlineCouriers: number;
  // 2. Média de Pedidos / Hora
  avgOrdersPerHourPerCourier: number;
  // 3. Média Valor Entrega / Hora
  avgGrossDeliveryEur: number;
  avgNetDeliveryEur: number;
  avgGrossPerDeliveryEur: number;
  avgNetPerDeliveryEur: number;
  avgHourlyPaceEur: number;
  // 4. Quanto Está a Pagar por KM (€/km Atual)
  liveEurPerKm: {
    global: number;
    uberEats: number;
    glovo: number;
    boltFood: number;
  };
  liveEurPerKmByScope: Record<PlatformFilterScope, number>;
  // 5. Projeção Próximas 3 Horas & Turno
  next3HoursProjections: MarketNext3HoursProjection[];
  shiftRecommendationText: string;
  totalSnapshotsRecorded: number;
  snapshotsRecordedCount: number;
  isProductionCleanBaseline: boolean;
}

// ============================================================================
// STEP 19: REAL COURIER REGISTRATION, LIVE GPS PRESENCE & SUPABASE `couriers`
// ============================================================================

export type CourierRegistrationVehicle =
  | 'Mota 125cc'
  | 'Scooter Elétrica'
  | 'Carro'
  | 'Bicicleta Elétrica';

export type AmaranteBaseZoneOption =
  | 'Amarante Centro / São Gonçalo'
  | 'Freixo de Cima / Baixo'
  | 'Vila Meã'
  | 'Lixa / Felgueiras'
  | 'Marco de Canaveses';

export interface RealCourierMapProfile {
  id: string; // Persisted UUID in localStorage (courier_id)
  name: string; // e.g., "Caio M."
  vehicle: CourierRegistrationVehicle;
  zone: AmaranteBaseZoneOption;
  status: 'Disponível' | 'Ocupado';
  has_order: boolean;
  lat: number;
  lng: number;
  reputation: number;
  buddy_since: string; // "Fundador • Out 2026"
  updated_at: string;
  isRegistered: boolean;
  gpsSource: 'LIVE_GPS' | 'AMARANTE_FALLBACK';
  avatar_url?: string;
  active_platforms?: PlatformName[];
  lastSyncedSupabaseAt?: string;
  supabaseSyncStatusText?: string;
}

export interface SupabaseCourierRow {
  id: string;
  name: string;
  vehicle: string;
  status: string;
  has_order: boolean;
  lat: number;
  lng: number;
  zone: string;
  reputation: number;
  buddy_since: string;
  updated_at: string;
  avatar_url?: string;
  active_platforms?: PlatformName[];
}

