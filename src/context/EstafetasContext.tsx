import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  ActiveDeliveryLifecycleState,
  ActiveSosBeaconState,
  ActiveSupportSplitMacroState,
  AdminBroadcastMessage,
  AdminBroadcastTargetType,
  AdminCourierKycStatus,
  AdminManagedCourierRecord,
  AdminSponsoredCampaign,
  AlertPopupPreferences,
  AppTabId,
  AppThemeMode,
  AppViewMode,
  B2BPartnerSponsorshipRecord,
  BubbleAlertAnimationState,
  BubbleMilestoneEventType,
  BuddyRewardsState,
  CargoChecklistItemId,
  CargoSplitChecklistState,
  ComplaintCategory,
  ComplaintRecord,
  CourierOrderAvailabilityStatus,
  CourierVerifiedAccount,
  CourierWorkspaceSection,
  CustomAutoMessage,
  EmergencySosType,
  EphemeralVoiceCardCategory,
  EphemeralVoiceOverlayState,
  FinanceSubTabId,
  GlovoDailyWalletState,
  IncomingContactRequest,
  LocationNoteCategory,
  LocationRouteNote,
  MapCourierFilterMode,
  MapRadiusOptionKm,
  MasterUserPreferences,
  OnlineDirectoryCourier,
  OrderAuditedItem,
  PersonalGoalsState,
  PlatformName,
  PlatformTouchCoordinateMap,
  PortugalRegionName,
  PreFilledRouteTrapDraft,
  RegionalExplorerDataset,
  RewardMarketplaceItem,
  RewardTaskKey,
  RiderSafetyTelemetryState,
  RoadHazardPin,
  RoadHazardType,
  RookieInvoiceChecklistState,
  ScannedOffer,
  ScannerSubTabId,
  ShiftTripLog,
  SocialBuddyPost,
  SosPendingConfirmationState,
  SupportSplitMacroStep,
  TacticalMapCell,
  TaxAndFleetConfigState,
  TouchCoordinatePoint,
  TouchMacroActionKey,
  VehicleCostProfile,
  VoiceActivationConfig,
  WalkieChannelId,
  WalkieMessage,
  ZonePactRule,
  EvidentiaryVaultRecord,
  PlatformFilterScope,
  PlatformFinancialLedger,
  PlatformLedgersMap,
  BuddyChallengePeriod,
  BuddyPopupSizeMode,
  ExternalMapAssistExecution,
  ExternalNavMapAssistAction,
  FloatingBubblesSide,
  LiveVoiceDictationConfig,
  LiveVoiceTranscriptionState,
  AiAgentMasterConfig,
  AiSkillLearningLogEntry,
  AiSkillLogCategory,
  GeminiStudioModelSelection,
  DeviceScreenProfile,
  ActiveSkillTeachingSession,
  MarketHourlySnapshot,
  MarketNext3HoursProjection,
  GlobalMarketTelemetrySummary,
  AmaranteBaseZoneOption,
  CourierRegistrationVehicle,
  RealCourierMapProfile,
  SupabaseCourierRow,
} from '../types/models';
import {
  ACTIVE_PLATFORMS_STORAGE_KEY,
  AMARANTE_DEFAULT_COORDS,
  AMARANTE_ZONE_COORDS_MAP,
  calculateHaversineDistanceKm,
  calculateScreenAspectRatioTag,
  cleanupGhostDuplicateCouriersInSupabaseRest,
  connectSupabaseRealtimeSocket,
  COURIER_AVATAR_URL_STORAGE_KEY,
  deleteCourierFromSupabaseRest,
  detectDeviceScreenProfile,
  DEVICE_SCREEN_PROFILE_STORAGE_KEY,
  fetchAiSkillLogsFromSupabaseRest,
  fetchCouriersFromSupabaseRest,
  fetchDirectMessagesFromSupabaseRest,
  findExistingCourierByNameInSupabaseRest,
  GEMINI_API_KEY_STORAGE_KEY,
  GEMINI_CUSTOM_MODEL_STORAGE_KEY,
  GEMINI_MODEL_STORAGE_KEY,
  getOrCreatePersistentCourierUuid,
  insertAiSkillLogToSupabaseRest,
  insertDirectMessageToSupabaseRest,
  LEGACY_COURIER_PROFILE_STORAGE_KEY,
  MARKET_HOURLY_SNAPSHOTS_STORAGE_KEY,
  PRODUCTION_MODE_STORAGE_KEY,
  REAL_API_CALLS_COUNT_STORAGE_KEY,
  REAL_COMPLETED_DELIVERIES_STORAGE_KEY,
  REAL_COURIER_MAP_PROFILE_STORAGE_KEY,
  resetAndGenerateNewCourierUuid,
  resolveActiveGeminiModelId,
  sanitizeSupabaseKeyInput,
  sanitizeSupabaseUrlInput,
  SUPABASE_ANON_KEY_STORAGE_KEY,
  SUPABASE_LIVE_COURIERS_CACHE_KEY,
  SUPABASE_URL_STORAGE_KEY,
  synthesizeAiSkillWithGemini,
  upsertCourierToSupabaseRest,
  validateGeminiStudioConnection,
} from '../services/geminiAgent';
import {
  CloudSharedStateSnapshot,
  FOUNDER_ADMIN_COURIER_ID,
  generateUniqueCourierIdForName,
  getActiveCloudCourierRows,
  isCourierAdminByName,
  loadCloudSharedState,
  normalizeAccountKey,
  publishAccountRegistrationToCloud,
  publishAdminApprovalDecisionToCloud,
  publishCourierPresenceToCloud,
  publishRoadHazardToCloud,
  publishWalkieMessageToCloud,
  registerLocalCloudIdentityProvider,
  resolveApprovalStatusForCourier,
  startRealtimeCloudSyncStream,
  subscribeToCloudSharedState,
} from '../services/cloudSync';
import {
  buildSurgicalHeavyOrderStreetTts,
  buildSurgicalMarketQueryStreetTts,
  buildSurgicalOfferStreetTts,
  cancelBuddySpeechNow,
  getSavedBuddyVoiceRate,
  playBuddyConfirmationChime,
  playBuddyOpenChime,
  saveBuddyVoiceRate,
  selectBestGeminiLikePtVoice,
  speakWithBuddyVoiceEngine,
} from '../services/voiceEngine';
import {
  BubbleRestingPreset,
  BuddyMascotImagesSet,
  BuddyMascotState,
  clearCustomMascotImagesFromStorage,
  getOrCreateMascotSyncId,
  loadSavedBubbleRestingPreset,
  loadSavedMascotImages,
  pollMascotImagesFromCloudBridge,
  saveBubbleRestingPreset,
  saveMascotImagesToStorage,
  sliceThreePoseMascotSheetFile,
  sliceThreePoseMascotSheetFromDataUrl,
  syncBubbleRestingPresetToNativeBridge,
  syncMascotImagesToNativeBridge,
  syncMascotStateToNativeBridge,
} from '../utils/buddyMascotEngine';
import {
  DEFAULT_AI_AGENT_MASTER_CONFIG,
  DEFAULT_ALERT_POPUP_PREFERENCES,
  DEFAULT_AUDITED_ITEMS,
  DEFAULT_BUDDY_REWARDS,
  DEFAULT_DEMO_VERIFIED_ACCOUNT,
  DEFAULT_GLOVO_WALLET_STATE,
  DEFAULT_MASTER_PREFERENCES,
  DEFAULT_PERSONAL_GOALS,
  DEFAULT_PLATFORM_LEDGERS,
  DEFAULT_SAFETY_TELEMETRY,
  DEFAULT_TAX_AND_FLEET_CONFIG,
  DEFAULT_VEHICLE_PROFILE,
  DEFAULT_VOICE_ACTIVATION_CONFIG,
  HEAVY_ITEMS_DB,
  PROFANITY_BLOCKLIST_PT,
  REWARD_MARKETPLACE_ITEMS,
  SCANNER_OFFER_PRESETS,
  SEED_ADMIN_BROADCASTS,
  SEED_ADMIN_MANAGED_COURIERS,
  SEED_ADMIN_SPONSORED_CAMPAIGNS,
  SEED_AI_SKILL_LEARNING_LOGS,
  SEED_B2B_PARTNERS,
  SEED_COMPLAINTS,
  SEED_CUSTOM_AUTO_MESSAGES,
  SEED_EVIDENTIARY_VAULT_RECORDS,
  SEED_INCOMING_CONTACT_REQUEST,
  SEED_LOCATION_ROUTE_NOTES,
  SEED_ONLINE_DIRECTORY_COURIERS,
  SEED_PERSONAL_BLACKLIST,
  SEED_REGIONAL_EXPLORER_DATA,
  SEED_ROAD_HAZARD_PINS,
  SEED_SHIFT_TRIPS,
  SEED_SOCIAL_BUDDY_POSTS,
  SEED_TACTICAL_CELLS,
  SEED_WALKIE_MESSAGES,
  SEED_ZONE_PACTS,
} from '../data/seedData';
import {
  buildEndOfDeliveryRealitySummary,
  saveCustomTaughtCrosswalk,
} from '../utils/amaranteCopilotTelemetry';

const STORAGE_KEY = 'delivery_buddy_v19_gemini_pro_supabase';

interface PersistedEstafetasState {
  vehicleProfile: VehicleCostProfile;
  complaints: ComplaintRecord[];
  shiftTrips: ShiftTripLog[];
  ttsVoiceEnabled: boolean;

  // Step 3 Persisted State
  backpackWeightLimitKg: number;
  auditedOrderItems: OrderAuditedItem[];
  simulateSecondCourierPaired: boolean;
  cargoSplitChecklist: CargoSplitChecklistState;
  optInMapAndZoneChat: boolean;
  walkieMessages: WalkieMessage[];
  mutedSenderIds: string[];
  userTrustScore: number;
  activeSosBeacon: ActiveSosBeaconState | null;

  // Step 4 Persisted State
  userPrefs: MasterUserPreferences;
  roadHazards: RoadHazardPin[];
  savedSosProofs: string[];

  // Step 5 Persisted State: Auth Session, Pause Mode & Personal Blacklist
  isAuthenticated: boolean;
  verifiedAccount: CourierVerifiedAccount;
  isAppPaused: boolean;
  personalBlacklist: string[];

  // Step 6 Persisted State: Glovo Wallet, Tax/Fleet Config, Personal Goals & BuddyRewards
  glovoWallet: GlovoDailyWalletState;
  taxAndFleetConfig: TaxAndFleetConfigState;
  personalGoals: PersonalGoalsState;
  buddyRewards: BuddyRewardsState;

  // Step 7 Persisted State: Bubble Mode, Zone Pacts, Safety Telemetry, Reputation & B2B Partners
  isBubbleMinimized: boolean;
  zonePacts: ZonePactRule[];
  communityReputationPct: number;
  safetyTelemetry: RiderSafetyTelemetryState;
  b2bPartners: B2BPartnerSponsorshipRecord[];
  customMarketplaceItems: RewardMarketplaceItem[];

  // Step 8 Persisted State: Map Radius, Multi-Region, Admin Backoffice & Welcome Tour
  mapRadiusKm: MapRadiusOptionKm;
  selectedRegionName: PortugalRegionName;
  adminManagedCouriers: AdminManagedCourierRecord[];
  adminBroadcasts: AdminBroadcastMessage[];
  mandatoryTermsEnforcementEnabled: boolean;
  courierPromotionalOptIn: boolean;
  adminSponsoredCampaigns: AdminSponsoredCampaign[];
  hasSeenWelcomeTour: boolean;

  // Step 9: User Order Availability Status, Share Order Status Privacy, Online Couriers Directory & Handshake
  userOrderAvailabilityStatus: CourierOrderAvailabilityStatus;
  shareOrderStatusPublicly: boolean;
  onlineDirectoryCouriers: OnlineDirectoryCourier[];
  incomingContactRequest: IncomingContactRequest | null;
  mapCourierFilterMode: MapCourierFilterMode;

  // Step 10: Active Delivery Lifecycle State Machine
  activeDeliveryLifecycle: ActiveDeliveryLifecycleState;

  // Step 11: Touch Coordinate Mapper (Glovo & Uber) & Support Split-Order Macro
  touchCoordinatesMap: PlatformTouchCoordinateMap;

  // Step 12: Zero-PII Location Route Notes & Social Buddys Blog
  locationRouteNotes: LocationRouteNote[];
  socialBuddyPosts: SocialBuddyPost[];

  // Step 13: Theme Mode, Alert Pop-up Preferences, Dual Voice Activation & Custom Auto-Messages
  themeMode: AppThemeMode;
  alertPopupPrefs: AlertPopupPreferences;
  voiceActivationConfig: VoiceActivationConfig;
  customAutoMessages: CustomAutoMessage[];

  // Step 14: Evidentiary Report Archive Vault & Platform-Segmented Ledgers
  evidentiaryVaultRecords: EvidentiaryVaultRecord[];
  platformLedgers: PlatformLedgersMap;
  activePlatformScope: PlatformFilterScope;

  // Step 15: Persistent Floating Bubbles Side & Minimized Buddy Avatar Bubble
  floatingBubblesSide: FloatingBubblesSide;
  minimizedBuddyBubbleCourierId: string | null;

  // Step 17: Embedded AI Agent (Gemini 2.5 Flash) & Skill Learning Logs
  aiAgentConfig: AiAgentMasterConfig;
  aiSkillLogs: AiSkillLearningLogEntry[];
}

export interface OfferPreferenceVerdict {
  passesMinGross: boolean;
  passesMinPerKm: boolean;
  passesFilterLogic: boolean;
  matchedBlacklistEntry: string | null;
  matchedZonePactTitle: string | null;
  effectiveMinGrossEur: number;
  effectiveMinPerKmEur: number;
  isAutoAccepted: boolean;
  isAutoDeclined: boolean;
  primaryRejectionReason: string | null;
}

interface EstafetasContextValue {
  activeTab: AppTabId;
  setActiveTab: (tab: AppTabId) => void;

  // Vehicle & Cost Engine
  vehicleProfile: VehicleCostProfile;
  updateVehicleProfile: (patch: Partial<VehicleCostProfile>) => void;
  totalCostPerKm: number;

  // Complaints & Forbidden Routes Engine
  complaints: ComplaintRecord[];
  routeTrapComplaints: ComplaintRecord[];
  criticalRestaurantComplaints: ComplaintRecord[];
  activeComplaintCategory: ComplaintCategory | 'TODAS';
  setActiveComplaintCategory: (cat: ComplaintCategory | 'TODAS') => void;
  addComplaintRecord: (
    input: Omit<ComplaintRecord, 'id' | 'createdAt' | 'confirmationsCount'>
  ) => ComplaintRecord;
  confirmComplaintRecord: (id: string) => void;
  generateDisputeEvidenceText: (trap: ComplaintRecord) => string;

  // Smart Screenshot Scanner & Route Audit HUD
  activeScannedOffer: ScannedOffer;
  setActiveScannedOffer: React.Dispatch<React.SetStateAction<ScannedOffer>>;
  selectOfferPreset: (preset: ScannedOffer, autoSpeak?: boolean) => void;
  ttsVoiceEnabled: boolean;
  toggleTtsVoice: () => void;
  speakTextPt: (text: string) => void;
  cancelSpeechNow: () => void;
  isSpeakingTts: boolean;
  lastSpokenTranscript: string;

  // 1-Tap Pre-fill from Scanner HUD -> Route Trap Modal
  preFilledRouteTrapDraft: PreFilledRouteTrapDraft | null;
  setPreFilledRouteTrapDraft: (draft: PreFilledRouteTrapDraft | null) => void;
  openRouteTrapModalFromOffer: (
    offer: ScannedOffer,
    detectedDetourKm: number
  ) => void;

  // Shift Log & Reset
  shiftTrips: ShiftTripLog[];
  recordOfferDecision: (
    offer: ScannedOffer,
    realKm: number,
    netProfitEur: number,
    netEurPerKm: number,
    verdict: 'ACEITE' | 'RECUSADA'
  ) => void;
  resetAllToSeed: () => void;

  // Step 3: Weight Auditor, Split-Order Matchmaking, Walkie-Talkie
  backpackWeightLimitKg: number;
  setBackpackWeightLimitKg: (limitKg: number) => void;
  auditedOrderItems: OrderAuditedItem[];
  updateAuditedItemQuantity: (itemId: string, delta: number) => void;
  setAuditedOrderItemsPreset: (
    presetType:
      | 'NORMAL_2_4KG'
      | 'OVERWEIGHT_27KG'
      | 'SINGLE_CRATE_14_8KG'
      | 'LIGHT_ORDER_6_1KG'
  ) => void;
  totalAuditedWeightKg: number;
  generateOverweightDisputeProofAndLog: (
    offer: ScannedOffer,
    totalKg: number,
    limitKg: number,
    itemsSummary: string
  ) => { text: string; createdComplaint: ComplaintRecord };

  simulateSecondCourierPaired: boolean;
  toggleSimulateSecondCourier: () => void;
  cargoSplitChecklist: CargoSplitChecklistState;
  toggleCargoChecklistItem: (key: CargoChecklistItemId) => void;

  optInMapAndZoneChat: boolean;
  toggleOptInMapAndZoneChat: () => void;
  activeWalkieChannel: WalkieChannelId;
  setActiveWalkieChannel: (channel: WalkieChannelId) => void;
  walkieMessages: WalkieMessage[];
  mutedSenderIds: string[];
  userTrustScore: number;
  lastSentTimestampMs: number;
  sendWalkieMessage: (
    text: string,
    options?: {
      isVoicePtt?: boolean;
      voiceDurationSec?: number;
      channelOverride?: WalkieChannelId;
    }
  ) => {
    ok: boolean;
    reason?: string;
    blockedWord?: string;
    cooldownRemainingSec?: number;
  };
  flagOrMuteWalkieMessage: (messageId: string) => {
    newFlagsCount: number;
    autoMutedSenderName?: string;
  };

  // Step 3 + Step 4 Upgraded Open-Mic SOS & Exact Location Sharing
  activeSosBeacon: ActiveSosBeaconState | null;
  triggerSosEmergencyBeacon: (emergencyType: EmergencySosType) => void;
  appendSosTranscriptLine: (line: string) => void;
  endSosAndSaveProof: (elapsedSeconds: number) => string;
  savedSosProofs: string[];
  clearSosEmergencyBeacon: () => void;
  shareExactLocationWithCourier: (
    recipientName: string,
    channel: WalkieChannelId
  ) => void;

  // Step 4: Preferences, 2m30s Map & Auto-Accept
  userPrefs: MasterUserPreferences;
  updateUserPreferences: (patch: Partial<MasterUserPreferences>) => void;
  toggleAnonymousMode: () => void;
  heartbeatSecondsLeft: number;
  forceSyncHeartbeatNow: () => void;
  tacticalCells: TacticalMapCell[];
  roadHazards: RoadHazardPin[];
  addRoadHazardPin: (
    hazardType: RoadHazardType,
    streetLocation: string,
    cityZone?: string
  ) => RoadHazardPin;
  confirmRoadHazardPin: (id: string) => void;
  resolveRoadHazardPin: (id: string) => void;
  evaluateOfferAgainstPreferences: (
    grossEur: number,
    netPerKmEur: number,
    hasCriticalTrap?: boolean,
    establishmentName?: string
  ) => OfferPreferenceVerdict;

  // =========================================================================
  // STEP 5: BRANDED LOGIN GATE, AI MULTI-APP KYC, PAUSE MODE & BLACKLIST
  // =========================================================================
  isAuthenticated: boolean;
  verifiedAccount: CourierVerifiedAccount;
  loginWithDemoAccount: (keepLoggedInShift?: boolean) => void;
  loginWithCredentials: (
    emailOrPhone: string,
    keepLoggedInShift: boolean
  ) => void;
  completeAiMultiAppRegistration: (
    account: Omit<CourierVerifiedAccount, 'verifiedAt' | 'unifiedMapPinId'>
  ) => void;
  logoutSession: () => void;

  isAppPaused: boolean;
  toggleAppPauseMode: () => void;

  personalBlacklist: string[];
  addEstablishmentToBlacklist: (name: string) => void;
  removeEstablishmentFromBlacklist: (name: string) => void;
  isEstablishmentBlacklisted: (name: string) => string | null;

  // =========================================================================
  // STEP 6: GLOVO NIGHTLY WALLET, FLEET (10%) & TAX TRACKER, PERSONAL GOALS & BUDDYREWARDS
  // =========================================================================
  activeFinanceSubTab: FinanceSubTabId;
  setActiveFinanceSubTab: (sub: FinanceSubTabId) => void;

  glovoWallet: GlovoDailyWalletState;
  updateGlovoWallet: (patch: Partial<GlovoDailyWalletState>) => void;
  closeGlovoDailyAudit: () => void;

  taxAndFleetConfig: TaxAndFleetConfigState;
  updateTaxAndFleetConfig: (patch: Partial<TaxAndFleetConfigState>) => void;
  toggleRookieInvoiceItem: (key: keyof RookieInvoiceChecklistState) => void;

  personalGoals: PersonalGoalsState;
  updatePersonalGoals: (patch: Partial<PersonalGoalsState>) => void;
  recordCompletedDeliveryForGoal: (
    netEurAdded?: number,
    durationMins?: number,
    platformOverride?: PlatformName,
    realKmAdded?: number
  ) => {
    milestoneReached: 50 | 75 | 100 | null;
    newPct: number;
  };
  lastGoalMilestoneBanner: string | null;
  clearGoalMilestoneBanner: () => void;

  buddyRewards: BuddyRewardsState;
  awardBuddyRewardTask: (taskKey: RewardTaskKey, customTitle?: string) => void;
  claimMarketplaceReward: (rewardId: string) => {
    ok: boolean;
    message: string;
    voucherCode?: string;
  };

  // =========================================================================
  // STEP 7: FLOATING BUBBLE MODE, VOICE COPILOT & SUPPORT MACROS,
  // COLLECTIVE ZONE PACTS, SAFETY TELEMETRY, & B2B PARTNER PORTAL
  // =========================================================================
  isBubbleMinimized: boolean;
  setIsBubbleMinimized: (minimized: boolean) => void;
  isQuickSummaryOpen: boolean;
  setIsQuickSummaryOpen: (open: boolean) => void;
  activeBubbleAnimation: BubbleAlertAnimationState | null;
  triggerBubbleMilestoneAnimation: (
    eventType: BubbleMilestoneEventType,
    customSubtitle?: string
  ) => void;
  dismissBubbleAnimation: () => void;

  zonePacts: ZonePactRule[];
  activeJoinedZonePact: ZonePactRule | null;
  toggleJoinZonePact: (pactId: string) => void;
  createZonePact: (
    input: Omit<
      ZonePactRule,
      'id' | 'adheredCouriersCount' | 'joinedByUser' | 'createdBy'
    >
  ) => ZonePactRule;
  communityReputationPct: number;

  safetyTelemetry: RiderSafetyTelemetryState;
  updateSafetyTelemetry: (patch: Partial<RiderSafetyTelemetryState>) => void;
  simulateSpeedAlert: (
    speedKmh: number,
    roadMode?: 'URBANO' | 'VIA_RAPIDA'
  ) => void;
  simulatePhoneMisuseInMotion: () => void;
  clearSafetyAlerts: () => void;

  b2bPartners: B2BPartnerSponsorshipRecord[];
  allMarketplaceRewards: RewardMarketplaceItem[];
  registerB2BPartnerSponsorship: (
    input: Omit<B2BPartnerSponsorshipRecord, 'id' | 'activeCouriersReached'>
  ) => B2BPartnerSponsorshipRecord;

  executeVoiceCommandPt: (spokenPhrase: string) => {
    commandMatched: string;
    actionSummary: string;
  };
  lastVoiceCommandResult: {
    phrase: string;
    commandMatched: string;
    actionSummary: string;
    timestamp: string;
  } | null;

  // =========================================================================
  // STEP 8: ERGONOMIC COCKPIT, MAP RADIUS & MULTI-REGION,
  // MASTER ADMIN BACKOFFICE & INTERACTIVE USER MANUAL
  // =========================================================================
  viewMode: AppViewMode;
  setViewMode: (mode: AppViewMode) => void;
  activeScannerSubTab: ScannerSubTabId;
  setActiveScannerSubTab: (subTab: ScannerSubTabId) => void;

  mapRadiusKm: MapRadiusOptionKm;
  setMapRadiusKm: (radiusKm: MapRadiusOptionKm) => void;
  selectedRegionName: PortugalRegionName;
  setSelectedRegionName: (regionName: PortugalRegionName) => void;
  activeRegionalDataset: RegionalExplorerDataset;
  regionalExplorerList: RegionalExplorerDataset[];

  adminManagedCouriers: AdminManagedCourierRecord[];
  updateAdminCourierKycStatus: (
    courierId: string,
    status: AdminCourierKycStatus
  ) => void;

  adminBroadcasts: AdminBroadcastMessage[];
  mandatoryTermsEnforcementEnabled: boolean;
  toggleMandatoryTermsEnforcement: () => void;
  courierPromotionalOptIn: boolean;
  toggleCourierPromotionalOptIn: () => void;
  sendAdminBroadcast: (input: {
    title: string;
    body: string;
    targetType: AdminBroadcastTargetType;
    targetValue: string;
    category:
      | 'OPERACIONAL_SEGURANCA_OBRIGATORIO'
      | 'PROMOCIONAL_PARCEIROS_OPT_IN';
  }) => AdminBroadcastMessage;
  markAdminBroadcastRead: (broadcastId: string) => void;

  adminSponsoredCampaigns: AdminSponsoredCampaign[];
  createAdminSponsoredCampaign: (
    input: Omit<
      AdminSponsoredCampaign,
      'id' | 'viewsCount' | 'clicksCount' | 'vouchersRedeemedCount'
    >
  ) => AdminSponsoredCampaign;
  toggleAdminSponsoredCampaignActive: (campaignId: string) => void;
  recordSponsoredCampaignClick: (campaignId: string) => void;

  hasSeenWelcomeTour: boolean;
  isWelcomeTourOpen: boolean;
  openWelcomeTour: () => void;
  closeWelcomeTour: () => void;
  isContextualHelpOpen: boolean;
  setIsContextualHelpOpen: (open: boolean) => void;

  // =========================================================================
  // STEP 9: USER AVAILABILITY & ORDER STATUS, ONLINE COURIERS DIRECTORY &
  // CONTACT PERMISSION HANDSHAKE
  // =========================================================================
  userOrderAvailabilityStatus: CourierOrderAvailabilityStatus;
  setUserOrderAvailabilityStatus: (
    status: CourierOrderAvailabilityStatus
  ) => void;
  toggleUserOrderAvailabilityStatus: () => void;
  shareOrderStatusPublicly: boolean;
  toggleShareOrderStatusPublicly: () => void;

  onlineDirectoryCouriers: OnlineDirectoryCourier[];
  incomingContactRequest: IncomingContactRequest | null;
  requestCourierContactPermission: (courierId: string) => void;
  simulateCourierAcceptContactPermission: (courierId: string) => void;
  respondToIncomingContactRequest: (decision: 'ACEITE' | 'RECUSADO') => void;
  activeDirectChatCourierId: string | null;
  setActiveDirectChatCourierId: (courierId: string | null) => void;
  sendDirectCourierMessage: (courierId: string, text: string) => void;
  mapCourierFilterMode: MapCourierFilterMode;
  setMapCourierFilterMode: (mode: MapCourierFilterMode) => void;

  // =========================================================================
  // STEP 10: HANDS-FREE VOICE-CONTROLLED DELIVERY LIFECYCLE STATE MACHINE
  // =========================================================================
  activeDeliveryLifecycle: ActiveDeliveryLifecycleState;
  startActiveDeliveryFromOffer: (
    offer: ScannedOffer,
    realKm: number,
    netProfitEur: number
  ) => void;
  startDeliveryTransitStage: () => void;
  completeActiveDeliveryStage: (override?: {
    netProfitEur?: number;
    grossEur?: number;
    realKm?: number;
    platform?: PlatformName;
    originName?: string;
    destinationName?: string;
  }) => void;
  isListeningSpeechRecognition: boolean;
  startSpeechRecognitionPt: (fallbackPhrase?: string) => void;

  // =========================================================================
  // STEP 11: PLATFORM-AWARE "DIVIDIR PEDIDO" SUPPORT MACRO, PT-BR NATURAL
  // VOICE ENGINE & SCREEN TOUCH COORDINATE MAPPER
  // =========================================================================
  resolvedPtBrVoiceName: string;
  activeSupportSplitMacro: ActiveSupportSplitMacroState;
  triggerSupportSplitOrderMacro: (platformOverride?: PlatformName) => void;
  touchCoordinatesMap: PlatformTouchCoordinateMap;
  updateTouchCoordinatePoint: (
    platform: 'Glovo' | 'Uber Eats',
    actionKey: TouchMacroActionKey,
    patch: Partial<
      Pick<
        TouchCoordinatePoint,
        'xPct' | 'yPct' | 'endXPct' | 'endYPct' | 'delayMs' | 'gestureType'
      >
    >
  ) => void;
  resetTouchCoordinatesToDefault: () => void;

  // =========================================================================
  // STEP 12: INVISIBLE-FIRST AUXILIARY TOOL, 3-TIER ISOLATION MODEL,
  // EPHEMERAL VOICE POP-UP ENGINE, ZERO-PII LOCATION NOTES & SOCIAL BUDDYS
  // =========================================================================
  courierWorkspaceSection: CourierWorkspaceSection;
  setCourierWorkspaceSection: (section: CourierWorkspaceSection) => void;
  isOfferAccepted: boolean;
  setIsOfferAccepted: (accepted: boolean) => void;
  ephemeralVoiceOverlay: EphemeralVoiceOverlayState | null;
  dismissEphemeralVoiceOverlay: () => void;
  sosPendingConfirmation: SosPendingConfirmationState;
  requestOrConfirmSosActivation: (emergencyType?: EmergencySosType) => void;
  cancelSosPendingConfirmation: () => void;
  locationRouteNotes: LocationRouteNote[];
  addLocationRouteNote: (input: {
    streetOrZone: string;
    orderCodeRef?: string;
    category: LocationNoteCategory;
    noteText: string;
  }) => LocationRouteNote;
  confirmLocationRouteNote: (id: string) => void;
  socialBuddyPosts: SocialBuddyPost[];
  addSocialBuddyPost: (input: {
    category: SocialBuddyPost['category'];
    content: string;
    zoneName?: string;
  }) => SocialBuddyPost;
  toggleLikeSocialBuddyPost: (postId: string) => void;

  // =========================================================================
  // STEP 13: SOFT CLEAN UI (DAYLIGHT / NIGHT THEME), ±45% ALERT POP-UP SETTINGS,
  // DUAL VOICE ACTIVATION (PTT + TRIGGER WORD) & CUSTOM AUTO-MESSAGES
  // =========================================================================
  themeMode: AppThemeMode;
  setThemeMode: (mode: AppThemeMode) => void;
  toggleThemeMode: () => void;
  alertPopupPrefs: AlertPopupPreferences;
  updateAlertPopupPrefs: (patch: Partial<AlertPopupPreferences>) => void;
  voiceActivationConfig: VoiceActivationConfig;
  updateVoiceActivationConfig: (patch: Partial<VoiceActivationConfig>) => void;
  isPttActive: boolean;
  startPttHold: () => void;
  releasePttHold: (spokenOverride?: string) => void;
  customAutoMessages: CustomAutoMessage[];
  addCustomAutoMessage: (
    input: Omit<CustomAutoMessage, 'id'>
  ) => CustomAutoMessage;
  updateCustomAutoMessage: (
    id: string,
    patch: Partial<Omit<CustomAutoMessage, 'id'>>
  ) => void;
  deleteCustomAutoMessage: (id: string) => void;

  // =========================================================================
  // STEP 14: EVIDENTIARY REPORT ARCHIVE VAULT ("ARQUIVO DE PROVAS") &
  // PLATFORM-SEGMENTED / CROSS-REFERENCED FINANCES & GOALS
  // =========================================================================
  evidentiaryVaultRecords: EvidentiaryVaultRecord[];
  addEvidentiaryVaultRecord: (
    input: Omit<
      EvidentiaryVaultRecord,
      'id' | 'protocolId' | 'firstReportedDate' | 'confirmationsCount'
    >
  ) => EvidentiaryVaultRecord;
  confirmEvidentiaryVaultRecord: (id: string) => void;
  generateFormalEvidentiaryReportText: (
    recordOrRecords: EvidentiaryVaultRecord | EvidentiaryVaultRecord[]
  ) => string;
  platformLedgers: PlatformLedgersMap;
  activePlatformScope: PlatformFilterScope;
  setActivePlatformScope: (scope: PlatformFilterScope) => void;
  updatePlatformLedger: (
    platform: PlatformName,
    patch: Partial<PlatformFinancialLedger>
  ) => void;

  // =========================================================================
  // STEP 15: PERSISTENT FLOATING BUBBLES, BUDDY 45%/80% POP-UP & AVATAR BUBBLE,
  // FRIEND CROSS-STATS / CHALLENGES & EXTERNAL NAVIGATION MAP ASSIST
  // =========================================================================
  floatingBubblesSide: FloatingBubblesSide;
  setFloatingBubblesSide: (side: FloatingBubblesSide) => void;
  activeBuddyPopupCourierId: string | null;
  setActiveBuddyPopupCourierId: (courierId: string | null) => void;
  buddyPopupSizeMode: BuddyPopupSizeMode;
  setBuddyPopupSizeMode: (mode: BuddyPopupSizeMode) => void;
  minimizedBuddyBubbleCourierId: string | null;
  setMinimizedBuddyBubbleCourierId: (courierId: string | null) => void;
  minimizeBuddyPopupToAvatarBubble: (courierId: string) => void;
  sendBuddyVoiceChatRequest: (courierId: string) => void;
  inviteBuddyToClosedGroup: (courierId: string, groupName: string) => void;
  createBuddyChallenge: (
    courierId: string,
    period: BuddyChallengePeriod
  ) => void;
  lastExternalMapAssist: ExternalMapAssistExecution | null;
  triggerExternalMapAssistMacro: (
    action: ExternalNavMapAssistAction,
    targetNavApp?: 'Waze' | 'Google Maps'
  ) => void;

  // =========================================================================
  // STEP 16: REAL-TIME LIVE VOICE TRANSCRIPTION POP-UP ENGINE (45% SCREEN)
  // =========================================================================
  liveVoiceTranscription: LiveVoiceTranscriptionState | null;
  startLiveVoiceDictation: (config: LiveVoiceDictationConfig) => void;
  startLiveVoiceCommandSession: (
    initialPhrase?: string,
    triggeredVia?: 'PTT' | 'TRIGGER_WORD' | 'VOICE_COMMAND'
  ) => void;
  updateLiveVoiceTranscriptText: (newText: string) => void;
  setLiveVoiceEditing: (editing: boolean) => void;
  clearLiveVoiceTranscriptText: () => void;
  confirmSendLiveDictatedMessage: (overrideText?: string) => void;
  cancelLiveVoiceTranscription: () => void;

  // =========================================================================
  // STEP 17: EMBEDDED AI AGENT (GEMINI PRO / HYBRID) & SUPABASE REALTIME
  // =========================================================================
  aiAgentConfig: AiAgentMasterConfig;
  updateAiAgentConfig: (patch: Partial<AiAgentMasterConfig>) => void;
  testGeminiFlashConnection: () => Promise<void>;
  testGeminiStudioConnection: () => Promise<void>;
  saveAndConnectSupabaseRealtime: (
    supabaseUrl: string,
    supabaseAnonKey: string
  ) => {
    connected: boolean;
    statusMessage: string;
    sanitizedUrl: string;
    sanitizedKey: string;
  };
  toggleProductionModeRealOnly: () => void;
  aiSkillLogs: AiSkillLearningLogEntry[];
  approveAndPublishAiSkillLog: (logId: string) => void;
  discardAiSkillLog: (logId: string) => void;
  testAiSkillLogMacro: (logId: string) => void;
  simulateNewAiSkillLearning: (
    categoryOverride?: Exclude<AiSkillLogCategory, 'TODAS'>
  ) => AiSkillLearningLogEntry;
  realCompletedDeliveries: ShiftTripLog[];
  realApiCallsCount: number;
  hasRealActiveDelivery: boolean;

  // =========================================================================
  // STEP 18: DEVICE FINGERPRINTING, DUAL-MODE AI LEARNING & HOURLY TELEMETRY
  // =========================================================================
  deviceScreenProfile: DeviceScreenProfile;
  updateDeviceScreenProfile: (patch: Partial<DeviceScreenProfile>) => void;
  redetectDeviceScreenProfile: () => DeviceScreenProfile;
  activeSkillTeachingSession: ActiveSkillTeachingSession | null;
  startVoiceTeachSkillMode: (
    taskTitle?: string,
    platformOrApp?: AiSkillLearningLogEntry['platformOrApp']
  ) => void;
  addTapStepToSkillTeachingSession: (stepLabel: string) => void;
  completeAndSaveVoiceTaughtSkill: (
    customNotes?: string
  ) => Promise<AiSkillLearningLogEntry | null>;
  cancelVoiceTeachSkillMode: () => void;
  marketTelemetry: GlobalMarketTelemetrySummary;
  recordMarketTelemetrySnapshot: (
    triggerSource?: string
  ) => MarketHourlySnapshot;

  // =========================================================================
  // STEP 19 & 20: REAL COURIER REGISTRATION, ZERO-AI PHOTO & ACTIVE PLATFORMS
  // =========================================================================
  realCourierProfile: RealCourierMapProfile;
  isCourierRegistrationModalOpen: boolean;
  setIsCourierRegistrationModalOpen: (open: boolean) => void;
  saveAndRegisterRealCourierProfile: (input: {
    id?: string;
    name: string;
    vehicle: CourierRegistrationVehicle;
    zone: AmaranteBaseZoneOption;
    avatar_url?: string;
    active_platforms?: PlatformName[];
  }) => Promise<{
    ok: boolean;
    statusText: string;
    profile: RealCourierMapProfile;
  }>;
  switchOrCreateNewCourierProfileOnDevice: () => void;
  cleanupGhostDuplicatePinsNow: () => Promise<void>;
  refreshLiveGpsPosition: () => Promise<void>;
  supabaseLiveCouriers: SupabaseCourierRow[];
  activePlatforms: PlatformName[];
  setActivePlatforms: (platforms: PlatformName[]) => void;
  toggleActivePlatform: (platform: PlatformName) => void;
  updateCourierAvatarUrl: (avatarDataUrl: string | undefined) => Promise<void>;
  wakeLockEnabled: boolean;
  wakeLockActiveOnDevice: boolean;
  toggleWakeLock: () => void;
  isOfficialManualModalOpen: boolean;
  setIsOfficialManualModalOpen: (open: boolean) => void;
  buddyVoiceRate: number;
  setBuddyVoiceRate: (rate: number) => void;
  isAppInstalledStandalone: boolean;
  canPromptNativeInstall: boolean;
  triggerNativeAppInstallPrompt: () => Promise<
    'ACCEPTED' | 'DISMISSED' | 'MANUAL_GUIDE'
  >;
  showManualInstallGuideModal: boolean;
  setShowManualInstallGuideModal: (open: boolean) => void;
  resetRealDeliveriesAndTestData: () => void;
  addManualDeliveryRecord: (input: {
    platform: PlatformName;
    grossEur: number;
    realKm: number;
    restaurantName?: string;
  }) => void;
  // Street Safety & Profit Protection Modules
  rainLockActive: boolean;
  setRainLockActive: (active: boolean) => void;
  toggleRainLock: () => void;
  crashDetectionEnabled: boolean;
  toggleCrashDetection: () => void;
  crashCountdownSeconds: number | null;
  triggerSimulatedCrashTest: () => void;
  cancelCrashCountdown: () => void;
  batterySurvivalMode: boolean;
  toggleBatterySurvivalMode: () => void;
  batteryLevelPct: number;
  isBatteryCharging: boolean;
  unpluggedChargerAlertActive: boolean;
  dismissUnpluggedChargerAlert: () => void;
  simulateChargerUnpluggedAlert: () => void;
  // Always-On Wake-Word Watchdog & Live Mic Feedback (4s Persistent Box)
  lastHeardLiveTranscript: string | null;
  lastHeardSpokenText: string | null;
  lastExecutedVoiceActionText: string | null;
  toggleVoiceMicListening: () => void;
  startContinuousVoiceMic: () => void;
  stopContinuousVoiceMic: () => void;
  // Automatic Incoming Order Detection & Instant Calculation
  autoOfferDetectorEnabled: boolean;
  lastAutoDetectedOfferBanner: AutoDetectedOfferBannerState | null;
  dismissAutoDetectedOfferBanner: () => void;
  openAndroidAccessibilitySettings: () => void;
  triggerAutoDetectedOffer: (
    euros: number,
    km: number,
    platformRaw?: string
  ) => void;
  // Scanner Main View Sync ('OFERTA_ATUAL' | 'DIVIDIDO_PESO')
  scannerActiveMainView: 'OFERTA_ATUAL' | 'DIVIDIDO_PESO';
  setScannerActiveMainView: (view: 'OFERTA_ATUAL' | 'DIVIDIDO_PESO') => void;
  // Live Open-Meteo Amarante Weather Modal & Rain Bonus Toggle
  isAmaranteWeatherModalOpen: boolean;
  setIsAmaranteWeatherModalOpen: (open: boolean) => void;
  amaranteLiveWeather: AmaranteLiveWeatherState;
  isLoadingAmaranteWeather: boolean;
  rainBonusFinanceActive: boolean;
  toggleRainBonusFinanceActive: () => void;
  openAndFetchAmaranteWeather: (speakNow?: boolean) => Promise<void>;
  // Dynamic 3-State Robot Mascot & Floating Bubble Resting Preset
  buddyMascotImages: BuddyMascotImagesSet;
  currentMascotState: BuddyMascotState;
  currentMascotImageUrl: string;
  uploadThreePoseMascotSheet: (file: File | Blob) => Promise<void>;
  uploadThreePoseMascotSheetFromDataUrl: (
    dataUrl: string
  ) => Promise<BuddyMascotImagesSet>;
  applyCustomMascotImagesSet: (images: BuddyMascotImagesSet) => void;
  mascotSyncId: string;
  resetMascotImagesToBuiltin: () => void;
  bubbleRestingPreset: BubbleRestingPreset;
  setBubbleRestingPreset: (preset: BubbleRestingPreset) => void;
  // Simultaneous Translator & Libras ("Mãos do Buddy")
  isTranslatorModalOpen: boolean;
  setIsTranslatorModalOpen: (open: boolean) => void;
  translatorActiveTab: 'TRADUTOR' | 'LIBRAS';
  setTranslatorActiveTab: (tab: 'TRADUTOR' | 'LIBRAS') => void;
  translatorTargetLang:
    | 'en-US'
    | 'fr-FR'
    | 'es-ES'
    | 'de-DE'
    | 'it-IT'
    | 'uk-UA'
    | 'hi-IN'
    | 'zh-CN';
  setTranslatorTargetLang: (
    lang:
      | 'en-US'
      | 'fr-FR'
      | 'es-ES'
      | 'de-DE'
      | 'it-IT'
      | 'uk-UA'
      | 'hi-IN'
      | 'zh-CN'
  ) => void;
  openTranslatorModal: (
    initialTab?: 'TRADUTOR' | 'LIBRAS',
    initialLang?:
      | 'en-US'
      | 'fr-FR'
      | 'es-ES'
      | 'de-DE'
      | 'it-IT'
      | 'uk-UA'
      | 'hi-IN'
      | 'zh-CN'
  ) => void;
}

export interface AutoDetectedOfferBannerState {
  id: string;
  platform: PlatformName;
  grossEur: number;
  realKm: number;
  netProfitEur: number;
  netEurPerKm: number;
  verdictLabel: 'COMPENSA ACEITAR' | 'RECUSAR OFERTA';
  passes: boolean;
  spokenSummary: string;
  detectedAt: string;
}

export interface AmaranteLiveWeatherState {
  temperatureC: number;
  precipitationMm: number;
  rainMm: number;
  windSpeedKmh: number;
  weatherCode: number;
  conditionLabel: string;
  conditionEmoji: string;
  isRainingNow: boolean;
  updatedAt: string;
}

function describeWmoWeatherCodePt(
  code: number,
  rainMm: number
): { label: string; emoji: string } {
  if (rainMm > 2.5 || code >= 80) {
    return { label: 'Chuva Moderada a Forte', emoji: '🌧️' };
  }
  if (rainMm > 0 || (code >= 51 && code <= 67)) {
    return { label: 'Chuva Fraca / Piso Molhado', emoji: '🌦️' };
  }
  if (code === 0) {
    return { label: 'Céu Limpo', emoji: '☀️' };
  }
  if (code === 1 || code === 2) {
    return { label: 'Parcialmente Nublado', emoji: '⛅' };
  }
  if (code === 3) {
    return { label: 'Céu Nublado', emoji: '☁️' };
  }
  if (code === 45 || code === 48) {
    return { label: 'Nevoeiro Matinal', emoji: '🌫️' };
  }
  return { label: 'Tempo Estável', emoji: '🌤️' };
}

const DEFAULT_CARGO_CHECKLIST: CargoSplitChecklistState = {
  CARGO_GRADE_CERVEJA_14_8: true,
  CARGO_GARRAFOES_AGUA_12_2: true,
  CARGO_AGUARDAR_COLEGA_MORADA: false,
};

const DEFAULT_TOUCH_COORDINATE_MAP: PlatformTouchCoordinateMap = {
  Glovo: [
    {
      id: 'GLV-TOUCH-1',
      actionKey: 'ACEITAR_PEDIDO',
      label: 'Aceitar Pedido',
      gestureType: 'TAP',
      xPct: 50,
      yPct: 89,
      delayMs: 250,
    },
    {
      id: 'GLV-TOUCH-2',
      actionKey: 'RECUSAR_PEDIDO',
      label: 'Recusar Pedido (X)',
      gestureType: 'TAP',
      xPct: 88,
      yPct: 14,
      delayMs: 200,
    },
    {
      id: 'GLV-TOUCH-3',
      actionKey: 'INICIAR_ENTREGA',
      label: 'Pedido Recolhido / Iniciar Entrega (Swipe/Tap)',
      gestureType: 'SWIPE',
      xPct: 18,
      yPct: 90,
      endXPct: 84,
      endYPct: 90,
      delayMs: 420,
    },
    {
      id: 'GLV-TOUCH-4',
      actionKey: 'FINALIZAR_ENTREGA',
      label: 'Finalizar Entrega (Swipe/Tap)',
      gestureType: 'SWIPE',
      xPct: 18,
      yPct: 90,
      endXPct: 84,
      endYPct: 90,
      delayMs: 420,
    },
    {
      id: 'GLV-TOUCH-5',
      actionKey: 'SUPORTE_DIVIDIR_PEDIDO',
      label: 'Suporte: Dividir Pedido',
      gestureType: 'TAP',
      xPct: 91,
      yPct: 7,
      delayMs: 350,
    },
    {
      id: 'GLV-TOUCH-6',
      actionKey: 'SUPORTE_RESTAURANTE_ROTA',
      label: 'Suporte: Restaurante Atrasado / Rota Proibida',
      gestureType: 'TAP',
      xPct: 50,
      yPct: 38,
      delayMs: 350,
    },
  ],
  'Uber Eats': [
    {
      id: 'UBR-TOUCH-1',
      actionKey: 'ACEITAR_PEDIDO',
      label: 'Aceitar Pedido',
      gestureType: 'TAP',
      xPct: 50,
      yPct: 86,
      delayMs: 220,
    },
    {
      id: 'UBR-TOUCH-2',
      actionKey: 'RECUSAR_PEDIDO',
      label: 'Recusar Pedido (X)',
      gestureType: 'TAP',
      xPct: 91,
      yPct: 12,
      delayMs: 180,
    },
    {
      id: 'UBR-TOUCH-3',
      actionKey: 'INICIAR_ENTREGA',
      label: 'Pedido Recolhido / Iniciar Entrega (Swipe/Tap)',
      gestureType: 'SWIPE',
      xPct: 16,
      yPct: 91,
      endXPct: 85,
      endYPct: 91,
      delayMs: 400,
    },
    {
      id: 'UBR-TOUCH-4',
      actionKey: 'FINALIZAR_ENTREGA',
      label: 'Finalizar Entrega (Swipe/Tap)',
      gestureType: 'SWIPE',
      xPct: 16,
      yPct: 91,
      endXPct: 85,
      endYPct: 91,
      delayMs: 400,
    },
    {
      id: 'UBR-TOUCH-5',
      actionKey: 'SUPORTE_DIVIDIR_PEDIDO',
      label: 'Suporte: Dividir Pedido',
      gestureType: 'TAP',
      xPct: 14,
      yPct: 88,
      delayMs: 350,
    },
    {
      id: 'UBR-TOUCH-6',
      actionKey: 'SUPORTE_RESTAURANTE_ROTA',
      label: 'Suporte: Restaurante Atrasado / Rota Proibida',
      gestureType: 'TAP',
      xPct: 50,
      yPct: 45,
      delayMs: 350,
    },
  ],
};

function buildSupportSplitStepsForPlatform(
  platform: PlatformName,
  orderId: string,
  totalKg: number,
  touchMap: PlatformTouchCoordinateMap
): { steps: SupportSplitMacroStep[]; autoPastedMessage: string } {
  const safeOrderId = orderId || '#4101';
  const safeKg = Number(Math.max(2.4, totalKg || 2.4).toFixed(1));

  if (platform === 'Uber Eats') {
    const uberSupportPt = touchMap['Uber Eats'].find(
      (p) => p.actionKey === 'SUPORTE_DIVIDIR_PEDIDO'
    );
    const s1X = uberSupportPt?.xPct ?? 14;
    const s1Y = uberSupportPt?.yPct ?? 88;
    return {
      steps: [
        {
          stepNumber: 1,
          label: `[1. Toque no botão 'Detalhes / Triângulo de Alerta' (X:${s1X}%, Y:${s1Y}%)]`,
          xPct: s1X,
          yPct: s1Y,
        },
        {
          stepNumber: 2,
          label: `[2. Selecionar 'Problema na coleta / Suporte' (X:50%, Y:45%)]`,
          xPct: 50,
          yPct: 45,
        },
        {
          stepNumber: 3,
          label: `[3. Selecionar 'Pedido excessivamente grande / Chamar apoio' (X:50%, Y:62%)]`,
          xPct: 50,
          yPct: 62,
        },
        {
          stepNumber: 4,
          label: `[4. Confirmar solicitação de segundo entregador (${safeOrderId} • ${safeKg.toFixed(1)} kg)]`,
          xPct: 50,
          yPct: 84,
        },
      ],
      autoPastedMessage: `Solicitação de Apoio / Divisão de Pedido ${safeOrderId} (Peso real auditado: ${safeKg.toFixed(
        1
      )} kg vs limite ergonômico 12 kg). Necessário segundo entregador Uber para dividir a carga com segurança.`,
    };
  }

  const glovoSupportPt = touchMap.Glovo.find(
    (p) => p.actionKey === 'SUPORTE_DIVIDIR_PEDIDO'
  );
  const s1X = glovoSupportPt?.xPct ?? 91;
  const s1Y = glovoSupportPt?.yPct ?? 7;

  return {
    steps: [
      {
        stepNumber: 1,
        label: `[1. Toque no ícone 'Ajuda / Suporte' (Topo Direito: X:${s1X}%, Y:${s1Y}%)]`,
        xPct: s1X,
        yPct: s1Y,
      },
      {
        stepNumber: 2,
        label: `[2. Selecionar 'Problema com o pedido atual' (X:50%, Y:38%)]`,
        xPct: 50,
        yPct: 38,
      },
      {
        stepNumber: 3,
        label: `[3. Selecionar 'Pedido muito grande / Dividir pedido (Courier Extra)' (X:50%, Y:54%)]`,
        xPct: 50,
        yPct: 54,
      },
      {
        stepNumber: 4,
        label: `[4. Colar texto técnico do pedido ${safeOrderId} (${safeKg.toFixed(
          1
        )} kg) e Enviar no Chat (X:88%, Y:92%)]`,
        xPct: 88,
        yPct: 92,
      },
    ],
    autoPastedMessage: `Olá Suporte ${platform}. O pedido ${safeOrderId} possui peso auditado de ${safeKg.toFixed(
      1
    )} kg (limite de mochila: 12 kg). Solicito Courier Extra para dividir o pedido imediatamente.`,
  };
}

const DEFAULT_ACTIVE_DELIVERY_LIFECYCLE: ActiveDeliveryLifecycleState = {
  orderId: '#4101',
  platform: 'Uber Eats',
  originName: 'Pizzaria Tâmega — Centro',
  destinationName: 'Freixo de Cima (Amarante)',
  grossEur: 7.8,
  netProfitEur: 7.48,
  realKm: 3.2,
  estimatedMinutes: 14,
  stage: 'AGUARDAR_RECOLHA',
  waitSecondsAtStore: 24,
  transitProgressPct: 15,
  customerDropoffNotes: '3.º Esq • Código Porta: 2480# • Sem dados pessoais (Zero-PII)',
  lastMacroExecuted:
    "[Macro: Oferta Aceite + Cronómetro de Recolha na Loja Ativo]",
  lastVoiceTtsConfirmation: null,
};

const EstafetasContext = createContext<EstafetasContextValue | undefined>(
  undefined
);

function getDefaultState(): PersistedEstafetasState {
  return {
    vehicleProfile: {
      ...DEFAULT_VEHICLE_PROFILE,
      fuelOrEnergyPerKm: 0.09,
      maintenanceAndTiresPerKm: 0.06,
      minTargetNetPerKm: 1.0,
    },
    complaints: SEED_COMPLAINTS,
    shiftTrips: SEED_SHIFT_TRIPS,
    ttsVoiceEnabled: true,
    backpackWeightLimitKg: 12.0,
    auditedOrderItems: DEFAULT_AUDITED_ITEMS,
    simulateSecondCourierPaired: true,
    cargoSplitChecklist: DEFAULT_CARGO_CHECKLIST,
    optInMapAndZoneChat: true,
    walkieMessages: SEED_WALKIE_MESSAGES,
    mutedSenderIds: [],
    userTrustScore: 98,
    activeSosBeacon: null,
    userPrefs: DEFAULT_MASTER_PREFERENCES,
    roadHazards: SEED_ROAD_HAZARD_PINS,
    savedSosProofs: [],
    isAuthenticated: false,
    verifiedAccount: DEFAULT_DEMO_VERIFIED_ACCOUNT,
    isAppPaused: false,
    personalBlacklist: SEED_PERSONAL_BLACKLIST,
    // Step 6 defaults
    glovoWallet: DEFAULT_GLOVO_WALLET_STATE,
    taxAndFleetConfig: DEFAULT_TAX_AND_FLEET_CONFIG,
    personalGoals: {
      ...DEFAULT_PERSONAL_GOALS,
      currentDailyNetEarnedEur: 71.0,
      dailyNetGoalEur: 85.0,
      currentWeeklyNetEarnedEur: 440.0,
      weeklyNetGoalEur: 500.0,
      currentMonthlyNetEarnedEur: 1800.0,
      monthlyNetGoalEur: 2000.0,
      completedDeliveriesToday: 14,
      completedKmToday: 34.5,
      completedKmWeek: 212.0,
      completedKmMonth: 860.0,
    },
    buddyRewards: DEFAULT_BUDDY_REWARDS,
    // Step 7 defaults
    isBubbleMinimized: false,
    zonePacts: SEED_ZONE_PACTS,
    communityReputationPct: 94,
    safetyTelemetry: DEFAULT_SAFETY_TELEMETRY,
    b2bPartners: SEED_B2B_PARTNERS,
    customMarketplaceItems: [],
    // Step 8 defaults (Locked to Amarante 25 km radius)
    mapRadiusKm: 25,
    selectedRegionName: 'Amarante (25 km)',
    adminManagedCouriers: SEED_ADMIN_MANAGED_COURIERS,
    adminBroadcasts: SEED_ADMIN_BROADCASTS,
    mandatoryTermsEnforcementEnabled: true,
    courierPromotionalOptIn: true,
    adminSponsoredCampaigns: SEED_ADMIN_SPONSORED_CAMPAIGNS,
    hasSeenWelcomeTour: false,
    // Step 9 defaults
    userOrderAvailabilityStatus: 'DISPONIVEL',
    shareOrderStatusPublicly: true,
    onlineDirectoryCouriers: SEED_ONLINE_DIRECTORY_COURIERS,
    incomingContactRequest: SEED_INCOMING_CONTACT_REQUEST,
    mapCourierFilterMode: 'TODOS',
    // Step 10 defaults
    activeDeliveryLifecycle: DEFAULT_ACTIVE_DELIVERY_LIFECYCLE,
    // Step 11 defaults
    touchCoordinatesMap: DEFAULT_TOUCH_COORDINATE_MAP,
    // Step 12 defaults
    locationRouteNotes: SEED_LOCATION_ROUTE_NOTES,
    socialBuddyPosts: SEED_SOCIAL_BUDDY_POSTS,
    // Step 13 defaults
    themeMode: 'DAYLIGHT',
    alertPopupPrefs: DEFAULT_ALERT_POPUP_PREFERENCES,
    voiceActivationConfig: DEFAULT_VOICE_ACTIVATION_CONFIG,
    customAutoMessages: SEED_CUSTOM_AUTO_MESSAGES,
    // Step 14 defaults
    evidentiaryVaultRecords: SEED_EVIDENTIARY_VAULT_RECORDS,
    platformLedgers: DEFAULT_PLATFORM_LEDGERS,
    activePlatformScope: 'GLOBAL_CRUZADO',
    // Step 15 defaults
    floatingBubblesSide: 'RIGHT',
    minimizedBuddyBubbleCourierId: null,
    // Step 17 defaults
    aiAgentConfig: DEFAULT_AI_AGENT_MASTER_CONFIG,
    aiSkillLogs: SEED_AI_SKILL_LEARNING_LOGS,
  };
}

const STRICT_AUTH_SESSION_KEY = 'buddy_auth_v2_session';

function hasPersistedRegisteredAccount(): boolean {
  try {
    const authTokenRaw = localStorage.getItem(STRICT_AUTH_SESSION_KEY);
    if (!authTokenRaw) return false;
    const authToken = JSON.parse(authTokenRaw) as {
      active?: boolean;
      username?: string;
    };
    if (
      !authToken ||
      authToken.active !== true ||
      typeof authToken.username !== 'string' ||
      authToken.username.trim().length === 0
    ) {
      return false;
    }

    const raw = localStorage.getItem(REAL_COURIER_MAP_PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RealCourierMapProfile>;
      if (
        parsed &&
        parsed.isRegistered === true &&
        typeof parsed.name === 'string' &&
        parsed.name.trim().length > 0
      ) {
        return true;
      }
    }
    return true;
  } catch {
    // ignore
  }
  return false;
}

function loadPersistedState(): PersistedEstafetasState {
  const defaults = getDefaultState();
  const hasRegisteredProfile = hasPersistedRegisteredAccount();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedEstafetasState>;
      if (
        parsed &&
        parsed.vehicleProfile &&
        Array.isArray(parsed.complaints) &&
        Array.isArray(parsed.shiftTrips)
      ) {
        const verifiedAcc = parsed.verifiedAccount || defaults.verifiedAccount;
        const persistedAuth = hasRegisteredProfile;

        return {
          ...defaults,
          ...parsed,
          isAuthenticated: persistedAuth,
          verifiedAccount: verifiedAcc,
          isAppPaused: Boolean(parsed.isAppPaused),
          personalBlacklist: Array.isArray(parsed.personalBlacklist)
            ? parsed.personalBlacklist
            : defaults.personalBlacklist,
          userPrefs: {
            ...defaults.userPrefs,
            ...(parsed.userPrefs || {}),
          },
          roadHazards: Array.isArray(parsed.roadHazards)
            ? parsed.roadHazards
            : defaults.roadHazards,
          savedSosProofs: Array.isArray(parsed.savedSosProofs)
            ? parsed.savedSosProofs
            : defaults.savedSosProofs,
          auditedOrderItems: Array.isArray(parsed.auditedOrderItems)
            ? parsed.auditedOrderItems
            : defaults.auditedOrderItems,
          walkieMessages: Array.isArray(parsed.walkieMessages)
            ? parsed.walkieMessages
            : defaults.walkieMessages,
          mutedSenderIds: Array.isArray(parsed.mutedSenderIds)
            ? parsed.mutedSenderIds
            : defaults.mutedSenderIds,
          cargoSplitChecklist:
            parsed.cargoSplitChecklist || defaults.cargoSplitChecklist,
          glovoWallet: {
            ...defaults.glovoWallet,
            ...(parsed.glovoWallet || {}),
          },
          taxAndFleetConfig: {
            ...defaults.taxAndFleetConfig,
            ...(parsed.taxAndFleetConfig || {}),
            invoiceChecklist: {
              ...defaults.taxAndFleetConfig.invoiceChecklist,
              ...(parsed.taxAndFleetConfig?.invoiceChecklist || {}),
            },
          },
          personalGoals: {
            ...defaults.personalGoals,
            ...(parsed.personalGoals || {}),
            dailyNetGoalEur:
              parsed.personalGoals?.dailyNetGoalEur &&
              parsed.personalGoals.dailyNetGoalEur > 0 &&
              parsed.personalGoals.dailyNetGoalEur <= 1000
                ? parsed.personalGoals.dailyNetGoalEur
                : 85.0,
            weeklyNetGoalEur:
              parsed.personalGoals?.weeklyNetGoalEur &&
              parsed.personalGoals.weeklyNetGoalEur > 0 &&
              parsed.personalGoals.weeklyNetGoalEur <= 3500 &&
              parsed.personalGoals.weeklyNetGoalEur !== 420 &&
              parsed.personalGoals.weeklyNetGoalEur !== 500
                ? parsed.personalGoals.weeklyNetGoalEur
                : 860.0,
            monthlyNetGoalEur:
              parsed.personalGoals?.monthlyNetGoalEur &&
              parsed.personalGoals.monthlyNetGoalEur > 0 &&
              parsed.personalGoals.monthlyNetGoalEur <= 15000
                ? parsed.personalGoals.monthlyNetGoalEur
                : 2600.0,
          },
          buddyRewards: {
            ...defaults.buddyRewards,
            ...(parsed.buddyRewards || {}),
            actionHistory: Array.isArray(parsed.buddyRewards?.actionHistory)
              ? parsed.buddyRewards!.actionHistory
              : defaults.buddyRewards.actionHistory,
            claimedRewardIds: Array.isArray(
              parsed.buddyRewards?.claimedRewardIds
            )
              ? parsed.buddyRewards!.claimedRewardIds
              : defaults.buddyRewards.claimedRewardIds,
            claimedVoucherCodes:
              parsed.buddyRewards?.claimedVoucherCodes ||
              defaults.buddyRewards.claimedVoucherCodes,
          },
          isBubbleMinimized: Boolean(parsed.isBubbleMinimized),
          zonePacts: Array.isArray(parsed.zonePacts)
            ? parsed.zonePacts
            : defaults.zonePacts,
          communityReputationPct:
            typeof parsed.communityReputationPct === 'number'
              ? parsed.communityReputationPct
              : defaults.communityReputationPct,
          safetyTelemetry: {
            ...defaults.safetyTelemetry,
            ...(parsed.safetyTelemetry || {}),
          },
          b2bPartners: Array.isArray(parsed.b2bPartners)
            ? parsed.b2bPartners
            : defaults.b2bPartners,
          customMarketplaceItems: Array.isArray(parsed.customMarketplaceItems)
            ? parsed.customMarketplaceItems
            : defaults.customMarketplaceItems,
          mapRadiusKm: parsed.mapRadiusKm || defaults.mapRadiusKm,
          selectedRegionName:
            parsed.selectedRegionName || defaults.selectedRegionName,
          adminManagedCouriers: Array.isArray(parsed.adminManagedCouriers)
            ? parsed.adminManagedCouriers
            : defaults.adminManagedCouriers,
          adminBroadcasts: Array.isArray(parsed.adminBroadcasts)
            ? parsed.adminBroadcasts
            : defaults.adminBroadcasts,
          mandatoryTermsEnforcementEnabled:
            parsed.mandatoryTermsEnforcementEnabled !== undefined
              ? Boolean(parsed.mandatoryTermsEnforcementEnabled)
              : defaults.mandatoryTermsEnforcementEnabled,
          courierPromotionalOptIn:
            parsed.courierPromotionalOptIn !== undefined
              ? Boolean(parsed.courierPromotionalOptIn)
              : defaults.courierPromotionalOptIn,
          adminSponsoredCampaigns: Array.isArray(parsed.adminSponsoredCampaigns)
            ? parsed.adminSponsoredCampaigns
            : defaults.adminSponsoredCampaigns,
          hasSeenWelcomeTour: Boolean(parsed.hasSeenWelcomeTour),
          userOrderAvailabilityStatus:
            parsed.userOrderAvailabilityStatus ||
            defaults.userOrderAvailabilityStatus,
          shareOrderStatusPublicly:
            parsed.shareOrderStatusPublicly !== undefined
              ? Boolean(parsed.shareOrderStatusPublicly)
              : defaults.shareOrderStatusPublicly,
          onlineDirectoryCouriers: Array.isArray(parsed.onlineDirectoryCouriers)
            ? parsed.onlineDirectoryCouriers
            : defaults.onlineDirectoryCouriers,
          incomingContactRequest:
            parsed.incomingContactRequest !== undefined
              ? parsed.incomingContactRequest
              : defaults.incomingContactRequest,
          mapCourierFilterMode:
            parsed.mapCourierFilterMode || defaults.mapCourierFilterMode,
          activeDeliveryLifecycle: {
            ...defaults.activeDeliveryLifecycle,
            ...(parsed.activeDeliveryLifecycle || {}),
          },
          touchCoordinatesMap:
            parsed.touchCoordinatesMap &&
            Array.isArray(parsed.touchCoordinatesMap.Glovo) &&
            Array.isArray(parsed.touchCoordinatesMap['Uber Eats'])
              ? parsed.touchCoordinatesMap
              : defaults.touchCoordinatesMap,
          locationRouteNotes: Array.isArray(parsed.locationRouteNotes)
            ? parsed.locationRouteNotes
            : defaults.locationRouteNotes,
          socialBuddyPosts: Array.isArray(parsed.socialBuddyPosts)
            ? parsed.socialBuddyPosts
            : defaults.socialBuddyPosts,
          themeMode:
            parsed.themeMode === 'DAYLIGHT' || parsed.themeMode === 'NIGHT'
              ? parsed.themeMode
              : defaults.themeMode,
          alertPopupPrefs: {
            ...defaults.alertPopupPrefs,
            ...(parsed.alertPopupPrefs || {}),
          },
          voiceActivationConfig: {
            ...defaults.voiceActivationConfig,
            ...(parsed.voiceActivationConfig || {}),
          },
          customAutoMessages: Array.isArray(parsed.customAutoMessages)
            ? parsed.customAutoMessages
            : defaults.customAutoMessages,
          evidentiaryVaultRecords: Array.isArray(parsed.evidentiaryVaultRecords)
            ? parsed.evidentiaryVaultRecords
            : defaults.evidentiaryVaultRecords,
          platformLedgers:
            parsed.platformLedgers &&
            parsed.platformLedgers['Uber Eats'] &&
            parsed.platformLedgers.Glovo &&
            parsed.platformLedgers['Bolt Food']
              ? {
                  'Uber Eats': {
                    ...defaults.platformLedgers['Uber Eats'],
                    ...parsed.platformLedgers['Uber Eats'],
                    weeklyNetGoalEur:
                      parsed.platformLedgers['Uber Eats']?.weeklyNetGoalEur &&
                      parsed.platformLedgers['Uber Eats'].weeklyNetGoalEur > 0 &&
                      parsed.platformLedgers['Uber Eats'].weeklyNetGoalEur <= 2500 &&
                      parsed.platformLedgers['Uber Eats'].weeklyNetGoalEur !== 240
                        ? parsed.platformLedgers['Uber Eats'].weeklyNetGoalEur
                        : 600.0,
                  },
                  Glovo: {
                    ...defaults.platformLedgers.Glovo,
                    ...parsed.platformLedgers.Glovo,
                    weeklyNetGoalEur:
                      parsed.platformLedgers.Glovo?.weeklyNetGoalEur &&
                      parsed.platformLedgers.Glovo.weeklyNetGoalEur > 0 &&
                      parsed.platformLedgers.Glovo.weeklyNetGoalEur <= 2500 &&
                      parsed.platformLedgers.Glovo.weeklyNetGoalEur !== 180
                        ? parsed.platformLedgers.Glovo.weeklyNetGoalEur
                        : 260.0,
                  },
                  'Bolt Food': {
                    ...defaults.platformLedgers['Bolt Food'],
                    ...parsed.platformLedgers['Bolt Food'],
                    weeklyNetGoalEur:
                      parsed.platformLedgers['Bolt Food']?.weeklyNetGoalEur &&
                      parsed.platformLedgers['Bolt Food'].weeklyNetGoalEur > 0 &&
                      parsed.platformLedgers['Bolt Food'].weeklyNetGoalEur <= 2500
                        ? parsed.platformLedgers['Bolt Food'].weeklyNetGoalEur
                        : 80.0,
                  },
                }
              : defaults.platformLedgers,
          activePlatformScope:
            parsed.activePlatformScope || defaults.activePlatformScope,
          floatingBubblesSide:
            parsed.floatingBubblesSide === 'LEFT' ||
            parsed.floatingBubblesSide === 'RIGHT'
              ? parsed.floatingBubblesSide
              : defaults.floatingBubblesSide,
          minimizedBuddyBubbleCourierId:
            parsed.minimizedBuddyBubbleCourierId !== undefined
              ? parsed.minimizedBuddyBubbleCourierId
              : defaults.minimizedBuddyBubbleCourierId,
          aiAgentConfig: {
            ...defaults.aiAgentConfig,
            ...(parsed.aiAgentConfig || {}),
            selectedGeminiModel:
              (localStorage.getItem(
                GEMINI_MODEL_STORAGE_KEY
              ) as GeminiStudioModelSelection) ||
              parsed.aiAgentConfig?.selectedGeminiModel ||
              defaults.aiAgentConfig.selectedGeminiModel,
            customExperimentalModelId:
              localStorage.getItem(GEMINI_CUSTOM_MODEL_STORAGE_KEY) ||
              parsed.aiAgentConfig?.customExperimentalModelId ||
              defaults.aiAgentConfig.customExperimentalModelId,
            geminiApiKey:
              localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) ??
              parsed.aiAgentConfig?.geminiApiKey ??
              defaults.aiAgentConfig.geminiApiKey,
            supabaseUrl: sanitizeSupabaseUrlInput(
              localStorage.getItem(SUPABASE_URL_STORAGE_KEY) ??
                parsed.aiAgentConfig?.supabaseUrl ??
                defaults.aiAgentConfig.supabaseUrl
            ),
            supabaseAnonKey: sanitizeSupabaseKeyInput(
              localStorage.getItem(SUPABASE_ANON_KEY_STORAGE_KEY) ??
                parsed.aiAgentConfig?.supabaseAnonKey ??
                defaults.aiAgentConfig.supabaseAnonKey
            ),
            supabaseRealtimeConnected: true,
            supabaseLastConnectedAt: '🟢 Ligado ao Supabase (Ativo)',
            productionModeRealOnly:
              localStorage.getItem(PRODUCTION_MODE_STORAGE_KEY) !== null
                ? localStorage.getItem(PRODUCTION_MODE_STORAGE_KEY) !== 'false'
                : parsed.aiAgentConfig?.productionModeRealOnly ?? true,
          },
          aiSkillLogs: Array.isArray(parsed.aiSkillLogs)
            ? parsed.aiSkillLogs
            : defaults.aiSkillLogs,
        };
      }
    }
  } catch (err) {
    console.warn('Falha ao ler localStorage de Delivery Buddy:', err);
  }
  return {
    ...defaults,
    isAuthenticated: hasRegisteredProfile,
  };
}

export const EstafetasProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<PersistedEstafetasState>(loadPersistedState);
  const [realCompletedDeliveries, setRealCompletedDeliveries] = useState<
    ShiftTripLog[]
  >(() => {
    try {
      const raw = localStorage.getItem(REAL_COMPLETED_DELIVERIES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [realApiCallsCount, setRealApiCallsCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(REAL_API_CALLS_COUNT_STORAGE_KEY);
      if (raw !== null) {
        const num = parseInt(raw, 10);
        if (!Number.isNaN(num) && num >= 0) return num;
      }
    } catch {
      // ignore
    }
    return 0;
  });
  const [hasRealActiveDelivery, setHasRealActiveDelivery] =
    useState<boolean>(false);
  const [realGlovoWalletPatch, setRealGlovoWalletPatch] = useState<
    Partial<GlovoDailyWalletState>
  >({});

  // Step 18: Automatic Device Model & Screen Aspect Ratio Fingerprinting
  const [deviceScreenProfile, setDeviceScreenProfile] =
    useState<DeviceScreenProfile>(() => {
      try {
        const raw = localStorage.getItem(DEVICE_SCREEN_PROFILE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<DeviceScreenProfile>;
          if (parsed && parsed.deviceModel && parsed.screenAspectRatio) {
            return {
              ...detectDeviceScreenProfile(),
              ...parsed,
            };
          }
        }
      } catch {
        // ignore
      }
      return detectDeviceScreenProfile();
    });

  // Step 18: Mode B Voice-Triggered Guided Skill Recording ("Buddy, ensinar caminho")
  const [activeSkillTeachingSession, setActiveSkillTeachingSession] =
    useState<ActiveSkillTeachingSession | null>(null);

  // Step 18: Global Hourly Telemetry & Projection Engine Snapshots
  const [marketHourlySnapshots, setMarketHourlySnapshots] = useState<
    MarketHourlySnapshot[]
  >(() => {
    try {
      const raw = localStorage.getItem(MARKET_HOURLY_SNAPSHOTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Step 20: Active Platforms Selector ('Uber Eats', 'Glovo', 'Bolt Food') — defaults to ['Uber Eats', 'Glovo']
  const [activePlatforms, setActivePlatformsState] = useState<PlatformName[]>(
    () => {
      try {
        const raw = localStorage.getItem(ACTIVE_PLATFORMS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const valid = parsed.filter(
              (p): p is PlatformName =>
                p === 'Uber Eats' || p === 'Glovo' || p === 'Bolt Food'
            );
            if (valid.length > 0) return valid;
          }
        }
      } catch {
        // ignore
      }
      return ['Uber Eats', 'Glovo'];
    }
  );

  // Step 19 & 20: Real Courier Registration, Live GPS, Zero-AI Avatar & Supabase `public.couriers` Sync
  // STRICT PER-DEVICE SESSION ISOLATION: Never default new devices to "Caio M."
  const [realCourierProfile, setRealCourierProfile] =
    useState<RealCourierMapProfile>(() => {
      const deviceCourierId = getOrCreatePersistentCourierUuid();
      let savedAvatar: string | undefined;
      try {
        savedAvatar =
          localStorage.getItem(COURIER_AVATAR_URL_STORAGE_KEY) || undefined;
      } catch {
        // ignore
      }
      const blankUnregisteredProfile: RealCourierMapProfile = {
        id: deviceCourierId,
        name: '',
        vehicle: 'Mota 125cc',
        zone: 'Amarante Centro / São Gonçalo',
        status: 'Disponível',
        has_order: false,
        lat: AMARANTE_DEFAULT_COORDS.lat,
        lng: AMARANTE_DEFAULT_COORDS.lng,
        reputation: 100,
        buddy_since: 'Fundador • Out 2026',
        updated_at: new Date().toISOString(),
        avatar_url: savedAvatar,
        active_platforms: ['Uber Eats', 'Glovo'],
        isRegistered: false,
        gpsSource: 'AMARANTE_FALLBACK',
        supabaseSyncStatusText:
          'Registe o seu perfil neste telemóvel para entrar online no Mapa',
      };
      try {
        if (!hasPersistedRegisteredAccount()) {
          return blankUnregisteredProfile;
        }
        const raw = localStorage.getItem(REAL_COURIER_MAP_PROFILE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<RealCourierMapProfile>;
          if (
            parsed &&
            parsed.isRegistered === true &&
            typeof parsed.name === 'string' &&
            parsed.name.trim().length > 0
          ) {
            const isHardcodedFallbackCoord =
              Math.abs(Number(parsed.lat || 41.2704) - 41.2704) < 0.0001 &&
              Math.abs(Number(parsed.lng || -8.0818) - -8.0818) < 0.0001;
            return {
              ...blankUnregisteredProfile,
              ...parsed,
              id: parsed.id?.trim() || deviceCourierId,
              name: parsed.name.trim(),
              avatar_url: parsed.avatar_url || savedAvatar,
              active_platforms:
                Array.isArray(parsed.active_platforms) &&
                parsed.active_platforms.length > 0
                  ? parsed.active_platforms
                  : blankUnregisteredProfile.active_platforms,
              isRegistered: true,
              gpsSource: isHardcodedFallbackCoord
                ? 'AMARANTE_FALLBACK'
                : parsed.gpsSource || 'AMARANTE_FALLBACK',
            };
          }
        }
        // Check legacy storage ONLY if user explicitly registered a custom non-default name
        const legacyRaw = localStorage.getItem(
          LEGACY_COURIER_PROFILE_STORAGE_KEY
        );
        if (legacyRaw) {
          const legacyParsed = JSON.parse(
            legacyRaw
          ) as Partial<RealCourierMapProfile>;
          if (
            legacyParsed &&
            legacyParsed.isRegistered === true &&
            typeof legacyParsed.name === 'string' &&
            legacyParsed.name.trim().length > 0 &&
            legacyParsed.name.trim() !== 'Caio M.'
          ) {
            return {
              ...blankUnregisteredProfile,
              ...legacyParsed,
              id: legacyParsed.id?.trim() || deviceCourierId,
              name: legacyParsed.name.trim(),
              avatar_url: legacyParsed.avatar_url || savedAvatar,
              active_platforms:
                Array.isArray(legacyParsed.active_platforms) &&
                legacyParsed.active_platforms.length > 0
                  ? legacyParsed.active_platforms
                  : blankUnregisteredProfile.active_platforms,
              isRegistered: true,
              gpsSource: 'AMARANTE_FALLBACK',
            };
          }
        }
      } catch {
        // ignore
      }
      return blankUnregisteredProfile;
    });

  // Never auto-open the registration/profile popup modal on startup:
  // When logged out, the full-screen <AuthAndVerificationGate /> is shown.
  // When logged in, profile editing exists exclusively inside the Ajustes tab.
  const [isCourierRegistrationModalOpen, setIsCourierRegistrationModalOpen] =
    useState<boolean>(false);

  const [supabaseLiveCouriers, setSupabaseLiveCouriers] = useState<
    SupabaseCourierRow[]
  >(() => {
    try {
      const raw = localStorage.getItem(SUPABASE_LIVE_COURIERS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [realKycStatusOverrides, setRealKycStatusOverrides] = useState<
    Record<string, AdminCourierKycStatus>
  >({});

  useEffect(() => {
    try {
      localStorage.setItem(
        ACTIVE_PLATFORMS_STORAGE_KEY,
        JSON.stringify(activePlatforms)
      );
    } catch {
      // ignore
    }
    // Keep activePlatformScope aligned with activePlatforms
    setState((prev) => {
      if (activePlatforms.length === 1) {
        const single = activePlatforms[0];
        if (prev.activePlatformScope !== single) {
          return { ...prev, activePlatformScope: single };
        }
        return prev;
      }
      if (
        prev.activePlatformScope !== 'GLOBAL_CRUZADO' &&
        !activePlatforms.includes(prev.activePlatformScope)
      ) {
        return { ...prev, activePlatformScope: 'GLOBAL_CRUZADO' };
      }
      return prev;
    });
  }, [activePlatforms]);

  useEffect(() => {
    try {
      if (
        realCourierProfile.isRegistered &&
        realCourierProfile.name.trim().length > 0
      ) {
        localStorage.setItem(
          REAL_COURIER_MAP_PROFILE_STORAGE_KEY,
          JSON.stringify(realCourierProfile)
        );
      }
      if (realCourierProfile.avatar_url) {
        localStorage.setItem(
          COURIER_AVATAR_URL_STORAGE_KEY,
          realCourierProfile.avatar_url
        );
      }
    } catch {
      // ignore
    }
  }, [realCourierProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SUPABASE_LIVE_COURIERS_CACHE_KEY,
        JSON.stringify(supabaseLiveCouriers)
      );
    } catch {
      // ignore
    }
  }, [supabaseLiveCouriers]);

  useEffect(() => {
    try {
      localStorage.setItem(
        DEVICE_SCREEN_PROFILE_STORAGE_KEY,
        JSON.stringify(deviceScreenProfile)
      );
    } catch {
      // ignore
    }
  }, [deviceScreenProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(
        MARKET_HOURLY_SNAPSHOTS_STORAGE_KEY,
        JSON.stringify(marketHourlySnapshots)
      );
    } catch {
      // ignore
    }
  }, [marketHourlySnapshots]);

  useEffect(() => {
    try {
      localStorage.setItem(
        REAL_COMPLETED_DELIVERIES_STORAGE_KEY,
        JSON.stringify(realCompletedDeliveries)
      );
    } catch {
      // ignore
    }
  }, [realCompletedDeliveries]);

  useEffect(() => {
    try {
      localStorage.setItem(
        REAL_API_CALLS_COUNT_STORAGE_KEY,
        String(realApiCallsCount)
      );
    } catch {
      // ignore
    }
  }, [realApiCallsCount]);

  // Step 8: Default to 'scanner' (Início/Scanner) for immediate Zero-Scroll Cockpit experience
  const [activeTab, setActiveTabState] = useState<AppTabId>('scanner');
  const [viewMode, setViewModeState] = useState<AppViewMode>('MODO_ESTAFETA');
  const [courierWorkspaceSection, setCourierWorkspaceSectionState] =
    useState<CourierWorkspaceSection>('AREA_PRIVADA');
  const [isOfferAccepted, setIsOfferAccepted] = useState<boolean>(false);
  const [ephemeralVoiceOverlay, setEphemeralVoiceOverlay] =
    useState<EphemeralVoiceOverlayState | null>(null);
  const [liveVoiceTranscription, setLiveVoiceTranscription] =
    useState<LiveVoiceTranscriptionState | null>(null);
  const liveVoiceTranscriptionRef = useRef<LiveVoiceTranscriptionState | null>(
    null
  );
  useEffect(() => {
    liveVoiceTranscriptionRef.current = liveVoiceTranscription;
  }, [liveVoiceTranscription]);

  const wordStreamTimerRef = useRef<number | null>(null);
  const sendCountdownTimerRef = useRef<number | null>(null);
  const activeSpeechRecRef = useRef<{
    onend?: (() => void) | null;
    onerror?: ((event?: { error?: string }) => void) | null;
    stop: () => void;
    abort?: () => void;
  } | null>(null);
  const keepVoiceListeningRef = useRef<boolean>(false);
  const isSpeakingTtsRef = useRef<boolean>(false);
  const watchdogRestartTimerRef = useRef<number | null>(null);
  const hasUnlockedMicOnFirstTouchRef = useRef<boolean>(false);
  const lastExecutedVoicePhraseRef = useRef<{ phrase: string; ts: number }>({
    phrase: '',
    ts: 0,
  });
  const [lastHeardLiveTranscript, setLastHeardLiveTranscript] = useState<
    string | null
  >(null);
  const [lastHeardSpokenText, setLastHeardSpokenText] = useState<string | null>(
    null
  );
  const [lastExecutedVoiceActionText, setLastExecutedVoiceActionText] =
    useState<string | null>(null);
  const lastHeardTranscriptTimerRef = useRef<number | null>(null);
  const startContinuousRecognitionInstanceRef = useRef<() => void>(() => {});
  const [scannerActiveMainView, setScannerActiveMainView] = useState<
    'OFERTA_ATUAL' | 'DIVIDIDO_PESO'
  >('OFERTA_ATUAL');
  const [autoOfferDetectorEnabled, setAutoOfferDetectorEnabled] =
    useState<boolean>(true);
  const [lastAutoDetectedOfferBanner, setLastAutoDetectedOfferBanner] =
    useState<AutoDetectedOfferBannerState | null>(null);
  const autoOfferBannerTimerRef = useRef<number | null>(null);

  const [isTranslatorModalOpen, setIsTranslatorModalOpen] =
    useState<boolean>(false);
  const [translatorActiveTab, setTranslatorActiveTab] = useState<
    'TRADUTOR' | 'LIBRAS'
  >('TRADUTOR');
  const [translatorTargetLang, setTranslatorTargetLang] = useState<
    | 'en-US'
    | 'fr-FR'
    | 'es-ES'
    | 'de-DE'
    | 'it-IT'
    | 'uk-UA'
    | 'hi-IN'
    | 'zh-CN'
  >('en-US');

  const openTranslatorModal = useCallback(
    (
      initialTab: 'TRADUTOR' | 'LIBRAS' = 'TRADUTOR',
      initialLang?:
        | 'en-US'
        | 'fr-FR'
        | 'es-ES'
        | 'de-DE'
        | 'it-IT'
        | 'uk-UA'
        | 'hi-IN'
        | 'zh-CN'
    ) => {
      setTranslatorActiveTab(initialTab);
      if (initialLang) {
        setTranslatorTargetLang(initialLang);
      }
      setIsBubbleMinimized(false);
      setIsTranslatorModalOpen(true);
    },
    []
  );

  // Auto-enable Night Mode between 20:00 and 07:00 unless user manually changed theme in this session
  useEffect(() => {
    try {
      const manualChoice = sessionStorage.getItem('buddy_manual_theme_choice');
      if (manualChoice) return;
      const curHour = new Date().getHours();
      if (curHour >= 20 || curHour < 7) {
        setState((prev) =>
          prev.themeMode !== 'NIGHT' ? { ...prev, themeMode: 'NIGHT' } : prev
        );
      }
    } catch {
      // ignore
    }
  }, []);

  const showLiveMicTranscriptFeedback = useCallback(
    (heardText: string, spokenOverride?: string, executedOverride?: string) => {
      const trimmed = heardText.trim();
      if (!trimmed) return;
      setLastHeardLiveTranscript(trimmed);
      if (spokenOverride !== undefined) {
        setLastHeardSpokenText(spokenOverride);
      }
      if (executedOverride !== undefined) {
        setLastExecutedVoiceActionText(executedOverride);
      }
      if (lastHeardTranscriptTimerRef.current !== null) {
        window.clearTimeout(lastHeardTranscriptTimerRef.current);
      }
      // Keep the transcription box visible for 4.2 seconds after recognition finishes
      lastHeardTranscriptTimerRef.current = window.setTimeout(() => {
        setLastHeardLiveTranscript(null);
        setLastHeardSpokenText(null);
        setLastExecutedVoiceActionText(null);
        lastHeardTranscriptTimerRef.current = null;
      }, 4200);
    },
    []
  );

  const [sosPendingConfirmation, setSosPendingConfirmation] =
    useState<SosPendingConfirmationState>({
      isPending: false,
      secondsRemaining: 0,
    });
  const [isPttActive, setIsPttActive] = useState<boolean>(false);
  const [activeBuddyPopupCourierId, setActiveBuddyPopupCourierId] = useState<
    string | null
  >(null);
  const [buddyPopupSizeMode, setBuddyPopupSizeMode] =
    useState<BuddyPopupSizeMode>('45VH');
  const [lastExternalMapAssist, setLastExternalMapAssist] =
    useState<ExternalMapAssistExecution | null>(null);

  const [activeScannerSubTab, setActiveScannerSubTab] =
    useState<ScannerSubTabId>('RESUMO_ROTA');
  const [isWelcomeTourOpen, setIsWelcomeTourOpen] = useState<boolean>(false);
  const [isContextualHelpOpen, setIsContextualHelpOpenState] =
    useState<boolean>(false);
  const [activeFinanceSubTab, setActiveFinanceSubTab] =
    useState<FinanceSubTabId>('RECOMPENSAS_PATENTES');
  const [lastGoalMilestoneBanner, setLastGoalMilestoneBanner] = useState<
    string | null
  >(null);
  const [activeComplaintCategory, setActiveComplaintCategory] = useState<
    ComplaintCategory | 'TODAS'
  >('ROTA_ILEGAL_DESVIO');

  // Step 7 Bubble Quick Summary & Milestone Animation state
  const [isQuickSummaryOpen, setIsQuickSummaryOpenState] =
    useState<boolean>(false);
  const [activeBubbleAnimation, setActiveBubbleAnimation] =
    useState<BubbleAlertAnimationState | null>(null);
  const [lastVoiceCommandResult, setLastVoiceCommandResult] = useState<{
    phrase: string;
    commandMatched: string;
    actionSummary: string;
    timestamp: string;
  } | null>(null);

  const [activeScannedOffer, setActiveScannedOffer] = useState<ScannedOffer>(
    () => SCANNER_OFFER_PRESETS[0]
  );
  const [isSpeakingTts, setIsSpeakingTts] = useState<boolean>(false);
  const [lastSpokenTranscript, setLastSpokenTranscript] = useState<string>('');
  const [preFilledRouteTrapDraft, setPreFilledRouteTrapDraft] =
    useState<PreFilledRouteTrapDraft | null>(null);
  const [isListeningSpeechRecognition, setIsListeningSpeechRecognition] =
    useState<boolean>(false);
  const [resolvedPtBrVoiceName, setResolvedPtBrVoiceName] = useState<string>(
    'Google português do Brasil (pt-BR)'
  );
  const [activeSupportSplitMacro, setActiveSupportSplitMacro] =
    useState<ActiveSupportSplitMacroState>(() => {
      const initial = buildSupportSplitStepsForPlatform(
        'Uber Eats',
        '#4101',
        2.4,
        DEFAULT_TOUCH_COORDINATE_MAP
      );
      return {
        isRunning: false,
        isCompleted: false,
        platform: 'Uber Eats',
        orderId: '#4101',
        totalWeightKg: 2.4,
        currentStepIndex: 0,
        steps: initial.steps,
        autoPastedMessage: initial.autoPastedMessage,
        triggeredAtTimestamp: null,
      };
    });

  const cancelSpeechNow = useCallback(() => {
    cancelBuddySpeechNow();
    isSpeakingTtsRef.current = false;
    setIsSpeakingTts(false);
  }, []);

  const setActiveTab = useCallback(
    (tab: AppTabId) => {
      cancelSpeechNow();
      setActiveTabState(tab);
      if (tab === 'walkietalkie' || tab === 'radar') {
        setCourierWorkspaceSectionState('AREA_PUBLICA_SOCIAL');
      } else if (
        tab === 'scanner' ||
        tab === 'financas' ||
        tab === 'calculadora'
      ) {
        setCourierWorkspaceSectionState('AREA_PRIVADA');
      }
    },
    [cancelSpeechNow]
  );

  const setCourierWorkspaceSection = useCallback(
    (section: CourierWorkspaceSection) => {
      cancelSpeechNow();
      setCourierWorkspaceSectionState(section);
      if (section === 'AREA_PUBLICA_SOCIAL') {
        setActiveTabState((prev) =>
          prev === 'walkietalkie' || prev === 'radar' ? prev : 'walkietalkie'
        );
      } else {
        setActiveTabState((prev) =>
          prev === 'walkietalkie' || prev === 'radar' ? 'scanner' : prev
        );
      }
    },
    [cancelSpeechNow]
  );

  const setIsContextualHelpOpen = useCallback(
    (open: boolean) => {
      cancelSpeechNow();
      setIsContextualHelpOpenState(open);
    },
    [cancelSpeechNow]
  );

  const setIsQuickSummaryOpen = useCallback(
    (open: boolean) => {
      cancelSpeechNow();
      setIsQuickSummaryOpenState(open);
    },
    [cancelSpeechNow]
  );

  const [activeWalkieChannel, setActiveWalkieChannel] =
    useState<WalkieChannelId>('RADIO_ZONA_LOCAL');
  const [lastSentTimestampMs, setLastSentTimestampMs] = useState<number>(0);

  const targetHeartbeatCycleSeconds = useMemo(() => {
    if (
      state.aiAgentConfig?.networkSyncSpeedMode ===
      'FASE_1_TEMPO_REAL_INSTANTANEO'
    ) {
      return 3;
    }
    if (state.aiAgentConfig?.networkSyncSpeedMode === 'BALANCEADO_15S') {
      return 15;
    }
    return 150;
  }, [state.aiAgentConfig?.networkSyncSpeedMode]);

  // Tactical Map Heartbeat Timer (Defaults to Phase 1: 3s GPS / <200ms events, freezes when isAppPaused is true!)
  const [heartbeatSecondsLeft, setHeartbeatSecondsLeft] = useState<number>(3);

  useEffect(() => {
    setHeartbeatSecondsLeft(targetHeartbeatCycleSeconds);
  }, [targetHeartbeatCycleSeconds]);

  useEffect(() => {
    if (state.isAppPaused || !state.isAuthenticated) {
      return;
    }
    const timer = setInterval(() => {
      setHeartbeatSecondsLeft((prev) =>
        prev <= 1 ? targetHeartbeatCycleSeconds : prev - 1
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [
    state.isAppPaused,
    state.isAuthenticated,
    targetHeartbeatCycleSeconds,
  ]);

  // Ephemeral Voice Request Overlay Auto-Minimize Countdown AFTER TTS finishes
  useEffect(() => {
    if (!ephemeralVoiceOverlay || !ephemeralVoiceOverlay.isOpen) {
      return;
    }
    // If user configured "Fechar Apenas Manualmente / Por Voz", never auto-close!
    if (state.alertPopupPrefs.durationMode === 'MANUAL') {
      return;
    }
    // Never cut off audio prematurely: wait while TTS is actively speaking
    if (
      isSpeakingTts ||
      (typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        window.speechSynthesis.speaking)
    ) {
      return;
    }
    const timer = setInterval(() => {
      // Double-check speechSynthesis.speaking inside the tick
      if (
        typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        window.speechSynthesis.speaking
      ) {
        return;
      }
      setEphemeralVoiceOverlay((prev) => {
        if (!prev || !prev.isOpen) return null;
        if (prev.countdownSecondsLeft <= 1) {
          if (prev.wasTriggeredFromMinimized) {
            setState((s) => ({ ...s, isBubbleMinimized: true }));
          }
          if (prev.cardCategory === 'SOS_CONFIRMACAO') {
            setSosPendingConfirmation({ isPending: false, secondsRemaining: 0 });
          }
          setLiveVoiceTranscription((lv) =>
            lv?.mode === 'COMANDO_BUDDY' ? null : lv
          );
          return null;
        }
        return {
          ...prev,
          countdownSecondsLeft: prev.countdownSecondsLeft - 1,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [
    ephemeralVoiceOverlay,
    isSpeakingTts,
    state.alertPopupPrefs.durationMode,
  ]);

  // 5-second SOS 2-Step Confirmation Countdown Timer
  useEffect(() => {
    if (!sosPendingConfirmation.isPending) {
      return;
    }
    const timer = setInterval(() => {
      setSosPendingConfirmation((prev) => {
        if (!prev.isPending) return prev;
        if (prev.secondsRemaining <= 1) {
          return { isPending: false, secondsRemaining: 0 };
        }
        return {
          ...prev,
          secondsRemaining: prev.secondsRemaining - 1,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sosPendingConfirmation.isPending]);

  // Live Restaurant Wait Timer (Tempo na Recolha: MM:SS) during Stage 1 (AGUARDAR_RECOLHA)
  useEffect(() => {
    if (
      state.isAppPaused ||
      !state.isAuthenticated ||
      state.activeDeliveryLifecycle.stage !== 'AGUARDAR_RECOLHA'
    ) {
      return;
    }
    const waitTimer = setInterval(() => {
      setState((prev) => {
        if (prev.activeDeliveryLifecycle.stage !== 'AGUARDAR_RECOLHA') {
          return prev;
        }
        return {
          ...prev,
          activeDeliveryLifecycle: {
            ...prev.activeDeliveryLifecycle,
            waitSecondsAtStore:
              prev.activeDeliveryLifecycle.waitSecondsAtStore + 1,
          },
        };
      });
    }, 1000);
    return () => clearInterval(waitTimer);
  }, [
    state.isAppPaused,
    state.isAuthenticated,
    state.activeDeliveryLifecycle.stage,
  ]);

  const forceSyncHeartbeatNow = useCallback(() => {
    if (state.isAppPaused) return;
    setHeartbeatSecondsLeft(targetHeartbeatCycleSeconds);
  }, [state.isAppPaused, targetHeartbeatCycleSeconds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Erro ao gravar localStorage de Delivery Buddy:', err);
    }
  }, [state]);

  const totalCostPerKm = useMemo(() => {
    return Number(
      (
        state.vehicleProfile.fuelOrEnergyPerKm +
        state.vehicleProfile.maintenanceAndTiresPerKm
      ).toFixed(3)
    );
  }, [state.vehicleProfile]);

  const routeTrapComplaints = useMemo(
    () =>
      state.complaints.filter((c) => c.category === 'ROTA_ILEGAL_DESVIO'),
    [state.complaints]
  );

  const criticalRestaurantComplaints = useMemo(
    () =>
      state.complaints.filter((c) => c.category === 'RESTAURANTE_CRITICO'),
    [state.complaints]
  );

  const totalAuditedWeightKg = useMemo(() => {
    const sum = state.auditedOrderItems.reduce((acc, entry) => {
      const refItem = HEAVY_ITEMS_DB.find((i) => i.id === entry.itemId);
      if (!refItem) return acc;
      return acc + refItem.unitWeightKg * entry.quantity;
    }, 0);
    if (sum > 0) return Number(sum.toFixed(1));
    if (state.aiAgentConfig.productionModeRealOnly && !hasRealActiveDelivery) {
      return 0.0;
    }
    return 2.4;
  }, [
    state.auditedOrderItems,
    state.aiAgentConfig.productionModeRealOnly,
    hasRealActiveDelivery,
  ]);

  // Step 5 Personal Blacklist Matcher
  const isEstablishmentBlacklisted = useCallback(
    (name: string): string | null => {
      const cleanTarget = (name || '').trim().toLowerCase();
      if (!cleanTarget) return null;
      const found = state.personalBlacklist.find((entry) => {
        const cleanEntry = entry.trim().toLowerCase();
        if (!cleanEntry) return false;
        return (
          cleanTarget.includes(cleanEntry) ||
          cleanEntry.includes(cleanTarget) ||
          (cleanEntry.includes('mcdonald') && cleanTarget.includes('mcdonald')) ||
          (cleanEntry.includes('central') && cleanTarget.includes('central'))
        );
      });
      return found || null;
    },
    [state.personalBlacklist]
  );

  const addEstablishmentToBlacklist = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState((prev) => {
      const exists = prev.personalBlacklist.some(
        (b) => b.toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) return prev;
      return {
        ...prev,
        personalBlacklist: [trimmed, ...prev.personalBlacklist],
      };
    });
  }, []);

  const removeEstablishmentFromBlacklist = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      personalBlacklist: prev.personalBlacklist.filter((b) => b !== name),
    }));
  }, []);

  // Step 5 Auth & Pause Actions
  const loginWithDemoAccount = useCallback((keepLoggedInShift = true) => {
    try {
      localStorage.setItem(
        STRICT_AUTH_SESSION_KEY,
        JSON.stringify({
          active: true,
          username: DEFAULT_DEMO_VERIFIED_ACCOUNT.courierName,
          loggedInAt: new Date().toISOString(),
        })
      );
    } catch {
      // ignore
    }
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      verifiedAccount: {
        ...DEFAULT_DEMO_VERIFIED_ACCOUNT,
        keepLoggedInShift,
      },
    }));
  }, []);

  const loginWithCredentials = useCallback(
    (emailOrPhone: string, keepLoggedInShift: boolean) => {
      const cleanInput = emailOrPhone.trim() || 'estafeta@deliverybuddy.pt';
      const displayName = cleanInput.includes('@')
        ? cleanInput.split('@')[0].replace('.', ' ')
        : `Estafeta ${cleanInput}`;

      try {
        localStorage.setItem(
          STRICT_AUTH_SESSION_KEY,
          JSON.stringify({
            active: true,
            username: displayName,
            loggedInAt: new Date().toISOString(),
          })
        );
      } catch {
        // ignore
      }

      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        verifiedAccount: {
          ...prev.verifiedAccount,
          courierName: `${displayName} (Verificado)`,
          emailOrPhone: cleanInput,
          keepLoggedInShift,
        },
      }));
    },
    []
  );

  const completeAiMultiAppRegistration = useCallback(
    (
      account: Omit<CourierVerifiedAccount, 'verifiedAt' | 'unifiedMapPinId'>
    ) => {
      try {
        localStorage.setItem(
          STRICT_AUTH_SESSION_KEY,
          JSON.stringify({
            active: true,
            username: account.courierName,
            loggedInAt: new Date().toISOString(),
          })
        );
      } catch {
        // ignore
      }
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        verifiedAccount: {
          ...account,
          verifiedAt: new Date().toISOString(),
          unifiedMapPinId: `PIN-UNIFICADO-PT-${Math.floor(
            1000 + Math.random() * 8999
          )}`,
        },
      }));
    },
    []
  );

  const logoutSession = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    try {
      localStorage.removeItem(STRICT_AUTH_SESSION_KEY);
      localStorage.removeItem(REAL_COURIER_MAP_PROFILE_STORAGE_KEY);
      localStorage.removeItem(LEGACY_COURIER_PROFILE_STORAGE_KEY);
    } catch {
      // ignore
    }
    const freshDeviceId = resetAndGenerateNewCourierUuid();
    setRealCourierProfile({
      id: freshDeviceId,
      name: '',
      vehicle: 'Mota 125cc',
      zone: 'Amarante Centro / São Gonçalo',
      status: 'Disponível',
      has_order: false,
      lat: AMARANTE_DEFAULT_COORDS.lat,
      lng: AMARANTE_DEFAULT_COORDS.lng,
      reputation: 100,
      buddy_since: 'Fundador • Out 2026',
      updated_at: new Date().toISOString(),
      avatar_url: undefined,
      active_platforms: ['Uber Eats', 'Glovo'],
      isRegistered: false,
      gpsSource: 'AMARANTE_FALLBACK',
      supabaseSyncStatusText:
        'Sessão terminada — inicie sessão ou crie conta para entrar',
    });
    setActiveDirectChatCourierId(null);
    setActiveBuddyPopupCourierId(null);
    setIsCourierRegistrationModalOpen(false);
    setViewModeState('MODO_ESTAFETA');
    setActiveTab('scanner');
    setState((prev) => ({
      ...prev,
      isAuthenticated: false,
      isAppPaused: false,
      verifiedAccount: {
        ...prev.verifiedAccount,
        courierName: 'Novo Estafeta',
      },
    }));
  }, [setActiveTab]);

  const toggleAppPauseMode = useCallback(() => {
    setState((prev) => {
      const nextPaused = !prev.isAppPaused;
      if (
        nextPaused &&
        typeof window !== 'undefined' &&
        'speechSynthesis' in window
      ) {
        window.speechSynthesis.cancel();
        setIsSpeakingTts(false);
      }
      return {
        ...prev,
        isAppPaused: nextPaused,
      };
    });
  }, []);

  const updateVehicleProfile = useCallback(
    (patch: Partial<VehicleCostProfile>) => {
      setState((prev) => {
        const nextVehicle = {
          ...prev.vehicleProfile,
          ...patch,
        };
        const nextPrefs =
          patch.minTargetNetPerKm !== undefined
            ? {
                ...prev.userPrefs,
                minNetProfitPerKmEur: patch.minTargetNetPerKm,
              }
            : prev.userPrefs;
        return {
          ...prev,
          vehicleProfile: nextVehicle,
          userPrefs: nextPrefs,
        };
      });
    },
    []
  );

  const updateUserPreferences = useCallback(
    (patch: Partial<MasterUserPreferences>) => {
      setState((prev) => {
        const nextPrefs = {
          ...prev.userPrefs,
          ...patch,
        };
        const nextVehicle =
          patch.minNetProfitPerKmEur !== undefined
            ? {
                ...prev.vehicleProfile,
                minTargetNetPerKm: patch.minNetProfitPerKmEur,
              }
            : prev.vehicleProfile;

        return {
          ...prev,
          userPrefs: nextPrefs,
          vehicleProfile: nextVehicle,
          ttsVoiceEnabled:
            patch.autoTtsOnNewOffer !== undefined
              ? patch.autoTtsOnNewOffer
              : prev.ttsVoiceEnabled,
          optInMapAndZoneChat:
            patch.anonymousMode !== undefined
              ? !patch.anonymousMode
              : prev.optInMapAndZoneChat,
        };
      });
    },
    []
  );

  const toggleAnonymousMode = useCallback(() => {
    setState((prev) => {
      const nextAnon = !prev.userPrefs.anonymousMode;
      return {
        ...prev,
        optInMapAndZoneChat: !nextAnon,
        userPrefs: {
          ...prev.userPrefs,
          anonymousMode: nextAnon,
          locationPrivacyMode: nextAnon
            ? 'OCULTA_APENAS_ALERTAS'
            : 'APROXIMADA_ZONA_2M30S',
        },
      };
    });
  }, []);

  const activeJoinedZonePact = useMemo(() => {
    return state.zonePacts.find((p) => p.joinedByUser) || null;
  }, [state.zonePacts]);

  const evaluateOfferAgainstPreferences = useCallback(
    (
      grossEur: number,
      netPerKmEur: number,
      hasCriticalTrap = false,
      establishmentName = ''
    ): OfferPreferenceVerdict => {
      const pactMinGross = activeJoinedZonePact
        ? activeJoinedZonePact.minCollectiveOrderEur
        : 0;
      const pactMinPerKm = activeJoinedZonePact
        ? activeJoinedZonePact.minCollectivePerKmEur
        : 0;

      const minGross = Math.max(
        state.userPrefs.minGrossOrderValueEur,
        pactMinGross
      );
      const minPerKm = Math.max(
        state.userPrefs.minNetProfitPerKmEur,
        pactMinPerKm
      );
      const mode = state.userPrefs.filterLogicMode;

      let matchedBlacklistEntry = isEstablishmentBlacklisted(establishmentName);
      if (
        !matchedBlacklistEntry &&
        activeJoinedZonePact?.boycottedEstablishment &&
        establishmentName
          .toLowerCase()
          .includes(
            activeJoinedZonePact.boycottedEstablishment
              .toLowerCase()
              .slice(0, 10)
          )
      ) {
        matchedBlacklistEntry = `${activeJoinedZonePact.boycottedEstablishment} (Boicote do Acordo de Zona)`;
      }

      const passesMinGross = grossEur >= minGross - 0.001;
      const passesMinPerKm = netPerKmEur >= minPerKm - 0.001;

      let passesFilterLogic = false;
      let primaryRejectionReason: string | null = null;

      if (matchedBlacklistEntry) {
        passesFilterLogic = false;
        primaryRejectionReason = `RECUSADO AUTOMATICAMENTE: Estabelecimento Bloqueado ("${matchedBlacklistEntry}")`;
      } else if (mode === 'EXIGIR_AMBOS') {
        passesFilterLogic = passesMinGross && passesMinPerKm;
        if (!passesMinGross) {
          primaryRejectionReason = activeJoinedZonePact && minGross === pactMinGross
            ? `Bloqueado pelo ${activeJoinedZonePact.title}: Oferta (${grossEur.toFixed(2)} €) abaixo do mínimo coletivo de ${minGross.toFixed(2)} €`
            : `Recusar: Abaixo do Valor Mínimo de ${minGross
                .toFixed(2)
                .replace('.', ',')} €`;
        } else if (!passesMinPerKm) {
          primaryRejectionReason = `Recusar: Rentabilidade (${netPerKmEur
            .toFixed(2)
            .replace('.', ',')} €/km) abaixo do mínimo de ${minPerKm
            .toFixed(2)
            .replace('.', ',')} €/km`;
        }
      } else if (mode === 'APENAS_VALOR_MINIMO') {
        passesFilterLogic = passesMinGross;
        if (!passesMinGross) {
          primaryRejectionReason = `Recusar: Abaixo do Valor Mínimo de ${minGross
            .toFixed(2)
            .replace('.', ',')} €`;
        }
      } else {
        passesFilterLogic = passesMinPerKm;
        if (!passesMinPerKm) {
          primaryRejectionReason = `Recusar: Rentabilidade (${netPerKmEur
            .toFixed(2)
            .replace('.', ',')} €/km) abaixo do mínimo de ${minPerKm
            .toFixed(2)
            .replace('.', ',')} €/km`;
        }
      }

      const isAutoAccepted =
        !state.isAppPaused &&
        state.userPrefs.autoAcceptEnabled &&
        passesFilterLogic &&
        !hasCriticalTrap &&
        !matchedBlacklistEntry;

      const isAutoDeclined =
        !state.isAppPaused &&
        state.userPrefs.autoDeclineEnabled &&
        (Boolean(matchedBlacklistEntry) ||
          !passesFilterLogic ||
          hasCriticalTrap);

      return {
        passesMinGross,
        passesMinPerKm,
        passesFilterLogic,
        matchedBlacklistEntry,
        matchedZonePactTitle: activeJoinedZonePact
          ? activeJoinedZonePact.title
          : null,
        effectiveMinGrossEur: minGross,
        effectiveMinPerKmEur: minPerKm,
        isAutoAccepted,
        isAutoDeclined,
        primaryRejectionReason,
      };
    },
    [
      state.userPrefs,
      state.isAppPaused,
      isEstablishmentBlacklisted,
      activeJoinedZonePact,
    ]
  );

  const addRoadHazardPin = useCallback(
    (
      hazardType: RoadHazardType,
      streetLocation: string,
      cityZone = 'Amarante — São Gonçalo / Centro'
    ): RoadHazardPin => {
      const newPin: RoadHazardPin = {
        id: `HAZ-PT-${Math.floor(10 + Math.random() * 89)}`,
        hazardType,
        streetLocation:
          streetLocation.trim() || 'Ponte de São Gonçalo (Ponto reportado GPS)',
        cityZone,
        reportedAt: 'Agora mesmo',
        reporterName: state.userPrefs.anonymousMode
          ? 'Estafeta Anónimo'
          : state.verifiedAccount.courierName,
        confirmations: 1,
        resolved: false,
        gridX: Math.floor(18 + Math.random() * 64),
        gridY: Math.floor(20 + Math.random() * 60),
      };

      setState((prev) => ({
        ...prev,
        roadHazards: [newPin, ...prev.roadHazards],
      }));

      void publishRoadHazardToCloud(newPin);

      return newPin;
    },
    [state.userPrefs.anonymousMode, state.verifiedAccount.courierName]
  );

  const confirmRoadHazardPin = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      roadHazards: prev.roadHazards.map((p) =>
        p.id === id ? { ...p, confirmations: p.confirmations + 1 } : p
      ),
    }));
  }, []);

  const resolveRoadHazardPin = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      roadHazards: prev.roadHazards.map((p) =>
        p.id === id ? { ...p, resolved: !p.resolved } : p
      ),
    }));
  }, []);

  const addComplaintRecord = useCallback(
    (
      input: Omit<ComplaintRecord, 'id' | 'createdAt' | 'confirmationsCount'>
    ): ComplaintRecord => {
      const announced = input.appAnnouncedKm ?? 0;
      const real = input.realLegalKm ?? announced;
      const detour = Math.max(0, Number((real - announced).toFixed(2)));
      const stolen = Number(
        (detour * state.vehicleProfile.platformKmReferenceRate).toFixed(2)
      );

      const newRecord: ComplaintRecord = {
        ...input,
        id:
          input.category === 'ROTA_ILEGAL_DESVIO'
            ? `TRP-PT-${Math.floor(10 + Math.random() * 89)}`
            : `CMP-PT-${Math.floor(100 + Math.random() * 899)}`,
        createdAt: new Date().toISOString(),
        confirmationsCount: 1,
        unpaidDetourKm:
          input.category === 'ROTA_ILEGAL_DESVIO' ? detour : input.unpaidDetourKm,
        stolenTariffEur:
          input.category === 'ROTA_ILEGAL_DESVIO' ? stolen : input.stolenTariffEur,
      };

      const nowTimeStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setState((prev) => {
        const shouldLearn = prev.aiAgentConfig?.continuousLearningEnabled;
        const passiveRouteLog: AiSkillLearningLogEntry | null = shouldLearn
          ? {
              id: `AI-PASSIVE-ROUTE-${Date.now().toString().slice(-5)}`,
              timestamp: `Agora • ${nowTimeStr}`,
              category: 'INTELIGENCIA_RUA_AMARANTE',
              platformOrApp: input.platform,
              skillTitle:
                input.category === 'ROTA_ILEGAL_DESVIO'
                  ? `Aprendizagem Passiva (Desvio): ${input.segmentOriginDest || input.title} (+${detour.toFixed(1)} km reais)`
                  : `Aprendizagem Passiva (Ocorrência): ${input.title}`,
              actionSequenceSummary: `Deteção automática de discrepância cartográfica em ${input.cityZone}: ${announced.toFixed(1)} km app vs ${real.toFixed(1)} km reais (+${detour.toFixed(1)} km). Padrão de rua registado para ${deviceScreenProfile.deviceModel} (${deviceScreenProfile.screenAspectRatio}).`,
              confidenceScorePct: 99.1,
              status: 'PRONTA_APROVACAO',
              learnedFromCourierTag: prev.verifiedAccount.courierName,
              zoneContext: input.cityZone || 'Amarante — São Gonçalo',
              deviceModel: deviceScreenProfile.deviceModel,
              screenAspectRatio: deviceScreenProfile.screenAspectRatio,
              learningOrigin: 'PASSIVA_AUTOMATICA',
            }
          : null;

        return {
          ...prev,
          complaints: [newRecord, ...prev.complaints],
          aiSkillLogs: passiveRouteLog
            ? [passiveRouteLog, ...prev.aiSkillLogs]
            : prev.aiSkillLogs,
        };
      });

      return newRecord;
    },
    [
      state.vehicleProfile.platformKmReferenceRate,
      deviceScreenProfile.deviceModel,
      deviceScreenProfile.screenAspectRatio,
    ]
  );

  const confirmComplaintRecord = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      complaints: prev.complaints.map((item) =>
        item.id === id
          ? { ...item, confirmationsCount: item.confirmationsCount + 1 }
          : item
      ),
    }));
  }, []);

  const generateDisputeEvidenceText = useCallback(
    (trap: ComplaintRecord): string => {
      const announced = trap.appAnnouncedKm ?? 2.0;
      const real = trap.realLegalKm ?? 4.0;
      const detour = Number(
        (trap.unpaidDetourKm ?? Math.max(0, real - announced)).toFixed(1)
      );
      const stolenEur = Number(
        (
          trap.stolenTariffEur ??
          detour * state.vehicleProfile.platformKmReferenceRate
        ).toFixed(2)
      );
      const pctDiscrepancy =
        announced > 0 ? (((real - announced) / announced) * 100).toFixed(1) : '100.0';
      const tagsText =
        trap.routeTrapTags && trap.routeTrapTags.length > 0
          ? trap.routeTrapTags.join(' + ')
          : 'Restrição Legal de Trânsito / Código da Estrada';

      return `RECLAMAÇÃO FORMAL DE TARIFA E AUDITORIA DE ROTA ILEGAL — ${trap.platform.toUpperCase()}
Ref.ª Registo Coletivo: ${trap.id} | Zona: ${trap.cityZone}
Trecho Auditado (Origem → Destino): ${trap.segmentOriginDest || trap.title}
Restrição Legal de Trânsito: ${tagsText}

1. DISCREPÂNCIA QUILOMÉTRICA E PENALIZAÇÃO NÃO PAGA:
• KM Anunciado e Pago pela App (${trap.platform}): ${announced.toFixed(1)} km
• KM Real Obrigatório (Cumprindo o Código da Estrada): ${real.toFixed(1)} km
• Desvio Legal Obrigatório Não Pago: +${detour.toFixed(1)} km (+${pctDiscrepancy}% de distância real ocultada)
• Prejuízo Direto / Valor Roubado na Tarifa: -${stolenEur.toFixed(2)} € por entrega

2. FUNDAMENTAÇÃO TÉCNICA E PROVA COLETIVA:
O trajeto calculado pelo algoritmo da ${trap.platform} exige infração direta ao Código da Estrada (${tagsText}). O cumprimento da via legal transitável obriga a percorrer ${real.toFixed(1)} km em vez dos ${announced.toFixed(1)} km tarifados.
• Registo auditado e confirmado por ${trap.confirmationsCount} estafetas no terreno.

Solicita-se a revisão imediata do cálculo cartográfico deste trecho e o crédito de compensação de +${detour.toFixed(1)} km (${stolenEur.toFixed(2)} €) na tarifa da viagem.`;
    },
    [state.vehicleProfile.platformKmReferenceRate]
  );

  const [buddyVoiceRate, setBuddyVoiceRateState] = useState<number>(() =>
    getSavedBuddyVoiceRate()
  );

  const setBuddyVoiceRate = useCallback((nextRate: number) => {
    const saved = saveBuddyVoiceRate(nextRate);
    setBuddyVoiceRateState(saved);
  }, []);

  // PWA Standalone Fullscreen & beforeinstallprompt Capture
  const deferredInstallPromptRef = useRef<{
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  } | null>(null);

  const [canPromptNativeInstall, setCanPromptNativeInstall] =
    useState<boolean>(false);
  const [showManualInstallGuideModal, setShowManualInstallGuideModal] =
    useState<boolean>(false);
  const [isAppInstalledStandalone, setIsAppInstalledStandalone] =
    useState<boolean>(() => {
      if (typeof window === 'undefined') return false;
      const isStandaloneMedia = window.matchMedia?.(
        '(display-mode: standalone)'
      )?.matches;
      const isIosStandalone = Boolean(
        (window.navigator as unknown as { standalone?: boolean }).standalone
      );
      return Boolean(isStandaloneMedia || isIosStandalone);
    });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredInstallPromptRef.current = e as unknown as {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
      };
      setCanPromptNativeInstall(true);
    };

    const handleAppInstalled = () => {
      deferredInstallPromptRef.current = null;
      setCanPromptNativeInstall(false);
      setIsAppInstalledStandalone(true);
      setShowManualInstallGuideModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerNativeAppInstallPrompt = useCallback(async (): Promise<
    'ACCEPTED' | 'DISMISSED' | 'MANUAL_GUIDE'
  > => {
    const deferred = deferredInstallPromptRef.current;
    if (deferred && typeof deferred.prompt === 'function') {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice?.outcome === 'accepted') {
          deferredInstallPromptRef.current = null;
          setCanPromptNativeInstall(false);
          setIsAppInstalledStandalone(true);
          return 'ACCEPTED';
        }
        return 'DISMISSED';
      } catch {
        setShowManualInstallGuideModal(true);
        return 'MANUAL_GUIDE';
      }
    }
    setShowManualInstallGuideModal(true);
    return 'MANUAL_GUIDE';
  }, []);

  const pickNaturalPtBrVoice = useCallback(
    (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
      return selectBestGeminiLikePtVoice(voices);
    },
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    const syncVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const chosen = pickNaturalPtBrVoice(voices);
      if (chosen) {
        setResolvedPtBrVoiceName(`${chosen.name} (${chosen.lang})`);
      }
    };
    syncVoices();
    window.speechSynthesis.onvoiceschanged = syncVoices;
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [pickNaturalPtBrVoice]);

  const speakTextPt = useCallback(
    (text: string) => {
      setLastSpokenTranscript(text);
      isSpeakingTtsRef.current = true;
      // Stop Web SpeechRecognition if running in web mode so mic doesn't hear Buddy's own voice
      if (activeSpeechRecRef.current) {
        try {
          activeSpeechRecRef.current.onend = null;
          activeSpeechRecRef.current.onerror = null;
          activeSpeechRecRef.current.stop();
        } catch {
          // ignore
        }
        activeSpeechRecRef.current = null;
      }
      speakWithBuddyVoiceEngine({
        text,
        rate: buddyVoiceRate,
        pitch: 0.95,
        isPaused: state.isAppPaused,
        onStart: () => {
          isSpeakingTtsRef.current = true;
          setIsSpeakingTts(true);
        },
        onEnd: () => {
          isSpeakingTtsRef.current = false;
          setIsSpeakingTts(false);
        },
        onError: () => {
          isSpeakingTtsRef.current = false;
          setIsSpeakingTts(false);
        },
        onVoiceResolved: (voiceLabel) => setResolvedPtBrVoiceName(voiceLabel),
      });
    },
    [state.isAppPaused, buddyVoiceRate]
  );

  const toggleTtsVoice = useCallback(() => {
    setState((prev) => {
      const next = !prev.ttsVoiceEnabled;
      if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeakingTts(false);
      }
      return {
        ...prev,
        ttsVoiceEnabled: next,
        userPrefs: {
          ...prev.userPrefs,
          autoTtsOnNewOffer: next,
        },
      };
    });
  }, []);

  const setAuditedOrderItemsPreset = useCallback(
    (
      presetType:
        | 'NORMAL_2_4KG'
        | 'OVERWEIGHT_27KG'
        | 'SINGLE_CRATE_14_8KG'
        | 'LIGHT_ORDER_6_1KG'
    ) => {
      if (presetType === 'NORMAL_2_4KG') {
        setState((prev) => ({
          ...prev,
          auditedOrderItems: [
            { itemId: 'ITEM-GRADE-CERVEJA-24', quantity: 0 },
            { itemId: 'ITEM-GARRAFAO-AGUA-6L', quantity: 0 },
            { itemId: 'ITEM-PACK-CERVEJA-6', quantity: 0 },
            { itemId: 'ITEM-PACK-LEITE-SUMOS-6X1L', quantity: 0 },
            { itemId: 'ITEM-SACO-BATATAS-ARROZ-5KG', quantity: 0 },
          ],
        }));
      } else if (presetType === 'OVERWEIGHT_27KG') {
        setState((prev) => ({
          ...prev,
          auditedOrderItems: [
            { itemId: 'ITEM-GRADE-CERVEJA-24', quantity: 1 },
            { itemId: 'ITEM-GARRAFAO-AGUA-6L', quantity: 2 },
            { itemId: 'ITEM-PACK-CERVEJA-6', quantity: 0 },
            { itemId: 'ITEM-PACK-LEITE-SUMOS-6X1L', quantity: 0 },
            { itemId: 'ITEM-SACO-BATATAS-ARROZ-5KG', quantity: 0 },
          ],
        }));
      } else if (presetType === 'SINGLE_CRATE_14_8KG') {
        setState((prev) => ({
          ...prev,
          auditedOrderItems: [
            { itemId: 'ITEM-GRADE-CERVEJA-24', quantity: 1 },
            { itemId: 'ITEM-GARRAFAO-AGUA-6L', quantity: 0 },
            { itemId: 'ITEM-PACK-CERVEJA-6', quantity: 0 },
            { itemId: 'ITEM-PACK-LEITE-SUMOS-6X1L', quantity: 0 },
            { itemId: 'ITEM-SACO-BATATAS-ARROZ-5KG', quantity: 0 },
          ],
        }));
      } else {
        setState((prev) => ({
          ...prev,
          auditedOrderItems: [
            { itemId: 'ITEM-GRADE-CERVEJA-24', quantity: 0 },
            { itemId: 'ITEM-GARRAFAO-AGUA-6L', quantity: 1 },
            { itemId: 'ITEM-PACK-CERVEJA-6', quantity: 0 },
            { itemId: 'ITEM-PACK-LEITE-SUMOS-6X1L', quantity: 0 },
            { itemId: 'ITEM-SACO-BATATAS-ARROZ-5KG', quantity: 0 },
          ],
        }));
      }
    },
    []
  );

  const selectOfferPreset = useCallback(
    (preset: ScannedOffer) => {
      setActiveScannedOffer(preset);
      setIsOfferAccepted(false);
      const isHeavy = Boolean(preset.isSplitOrderCandidate);
      const nextWeight = isHeavy ? 27.0 : 2.4;
      const nextOrderId =
        preset.orderId || `#410${preset.presetNumber || 1}`;
      if (isHeavy) {
        setAuditedOrderItemsPreset('OVERWEIGHT_27KG');
      } else {
        setAuditedOrderItemsPreset('NORMAL_2_4KG');
      }
      const nextSteps = buildSupportSplitStepsForPlatform(
        preset.platform,
        nextOrderId,
        nextWeight,
        state.touchCoordinatesMap
      );
      setActiveSupportSplitMacro({
        isRunning: false,
        isCompleted: false,
        platform: preset.platform,
        orderId: nextOrderId,
        totalWeightKg: nextWeight,
        currentStepIndex: 0,
        steps: nextSteps.steps,
        autoPastedMessage: nextSteps.autoPastedMessage,
        triggeredAtTimestamp: null,
      });

      // Mode A: 100% Automatic Passive Event-Driven Learning on Offer Scan ("Ler Print")
      const nowTimeStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setState((prev) => {
        if (!prev.aiAgentConfig?.continuousLearningEnabled) return prev;
        const passiveScanLog: AiSkillLearningLogEntry = {
          id: `AI-PASSIVE-SCAN-${Date.now().toString().slice(-5)}`,
          timestamp: `Agora • ${nowTimeStr}`,
          category: 'SKILLS_TOQUE_UI',
          platformOrApp: preset.platform,
          skillTitle: `Aprendizagem Passiva (Scan OCR): Oferta ${preset.platform} em ${preset.originName} (${preset.grossAmountEur.toFixed(2)} € / ${preset.appAnnouncedKm.toFixed(1)} km)`,
          actionSequenceSummary: `Captura passiva de ecrã (${deviceScreenProfile.screenAspectRatio} • ${deviceScreenProfile.screenWidthPx}x${deviceScreenProfile.screenHeightPx}) → Extração de valor bruto (${preset.grossAmountEur.toFixed(2)} €) e rota (${preset.originName} → ${preset.destinationName}) sem intervenção manual.`,
          confidenceScorePct: 99.3,
          status: 'PRONTA_APROVACAO',
          learnedFromCourierTag: prev.verifiedAccount.courierName,
          zoneContext: `${preset.originName} → ${preset.destinationName}`,
          deviceModel: deviceScreenProfile.deviceModel,
          screenAspectRatio: deviceScreenProfile.screenAspectRatio,
          learningOrigin: 'PASSIVA_AUTOMATICA',
        };
        return {
          ...prev,
          aiSkillLogs: [passiveScanLog, ...prev.aiSkillLogs],
        };
      });
    },
    [
      setAuditedOrderItemsPreset,
      state.touchCoordinatesMap,
      deviceScreenProfile.deviceModel,
      deviceScreenProfile.screenAspectRatio,
      deviceScreenProfile.screenWidthPx,
      deviceScreenProfile.screenHeightPx,
    ]
  );

  const openRouteTrapModalFromOffer = useCallback(
    (offer: ScannedOffer, detectedDetourKm: number) => {
      const suggestedDetour = detectedDetourKm > 0 ? detectedDetourKm : 1.8;
      const realKm = Number(
        (offer.appAnnouncedKm + suggestedDetour).toFixed(1)
      );

      setPreFilledRouteTrapDraft({
        platform: offer.platform,
        cityZone: offer.cityZone || 'Amarante — Centro / São Gonçalo',
        segmentOriginDest: `${offer.originName} → ${offer.destinationName}`,
        appAnnouncedKm: offer.appAnnouncedKm,
        realLegalKm: realKm,
        routeTrapTags: ['Zona Pedonal / Pilaretes (Bloqueado)'],
        description: `Rota anunciada pela ${offer.platform} com ${offer.appAnnouncedKm.toFixed(
          1
        )} km atravessa acesso bloqueado/proibido, forçando desvio legal até ${realKm.toFixed(
          1
        )} km (+${suggestedDetour.toFixed(1)} km não pagos).`,
      });
      setActiveComplaintCategory('ROTA_ILEGAL_DESVIO');
      setActiveTab('reclamacoes');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setActiveTab]
  );

  const recordOfferDecision = useCallback(
    (
      offer: ScannedOffer,
      realKm: number,
      netProfitEur: number,
      netEurPerKm: number,
      verdict: 'ACEITE' | 'RECUSADA'
    ) => {
      setIsOfferAccepted(verdict === 'ACEITE');
      if (verdict === 'ACEITE') {
        setHasRealActiveDelivery(true);
      }
      const nowTimeStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const newTrip: ShiftTripLog = {
        id: `REAL-SHF-${Date.now()}`,
        timestamp: new Date().toISOString(),
        platform: offer.platform,
        segment: `${offer.originName} → ${offer.destinationName}`,
        grossEur: offer.grossAmountEur,
        realKm,
        netProfitEur,
        netEurPerKm,
        verdict,
      };
      setRealCompletedDeliveries((prev) => [newTrip, ...prev]);
      setRealApiCallsCount((prev) => prev + 1);
      setState((prev) => {
        const shouldLearn = prev.aiAgentConfig?.continuousLearningEnabled;
        const autoLearnedLog: AiSkillLearningLogEntry | null = shouldLearn
          ? {
              id: `AI-PASSIVE-DECISION-${Date.now().toString().slice(-5)}`,
              timestamp: `Agora • ${nowTimeStr}`,
              category: 'PADROES_UTILIZADORES',
              platformOrApp: offer.platform,
              skillTitle:
                verdict === 'ACEITE'
                  ? `Aprendizagem Passiva: Aceitação em ${offer.originName} (${netEurPerKm.toFixed(2)} €/km líquidos)`
                  : `Aprendizagem Passiva: Recusa em ${offer.originName} (${offer.grossAmountEur.toFixed(2)} € bruto / ${realKm.toFixed(1)} km)`,
              actionSequenceSummary:
                verdict === 'ACEITE'
                  ? `Leitura OCR (<120ms) em tela ${deviceScreenProfile.screenAspectRatio} → Veredito Positivo (+${netProfitEur.toFixed(2)} € líquidos) → Toque Simulado Aceitar (${offer.platform}) em ${offer.cityZone || 'Amarante'}.`
                  : `Leitura OCR (<120ms) em tela ${deviceScreenProfile.screenAspectRatio} → Rentabilidade abaixo da meta ou espera/desvio detetado → Toque Simulado Recusar (${offer.platform}).`,
              confidenceScorePct: 98.9,
              status: 'PRONTA_APROVACAO',
              learnedFromCourierTag: prev.verifiedAccount.courierName,
              zoneContext: `${offer.originName} → ${offer.destinationName}`,
              deviceModel: deviceScreenProfile.deviceModel,
              screenAspectRatio: deviceScreenProfile.screenAspectRatio,
              learningOrigin: 'PASSIVA_AUTOMATICA',
            }
          : null;

        return {
          ...prev,
          shiftTrips: [newTrip, ...prev.shiftTrips],
          aiSkillLogs: autoLearnedLog
            ? [autoLearnedLog, ...prev.aiSkillLogs]
            : prev.aiSkillLogs,
          aiAgentConfig: shouldLearn
            ? {
                ...prev.aiAgentConfig,
                dailyApiCallsUsed: Math.min(
                  prev.aiAgentConfig.dailyApiCallsMax,
                  prev.aiAgentConfig.dailyApiCallsUsed + 1
                ),
              }
            : prev.aiAgentConfig,
          userOrderAvailabilityStatus:
            verdict === 'ACEITE'
              ? 'OCUPADO_COM_PEDIDO'
              : prev.userOrderAvailabilityStatus,
          activeDeliveryLifecycle:
            verdict === 'ACEITE'
              ? {
                  orderId:
                    offer.orderId || `#410${offer.presetNumber || 1}`,
                  platform: offer.platform,
                  originName: offer.originName,
                  destinationName: offer.destinationName,
                  grossEur: offer.grossAmountEur,
                  netProfitEur,
                  realKm,
                  estimatedMinutes: offer.estimatedMinutes,
                  stage: 'AGUARDAR_RECOLHA',
                  waitSecondsAtStore: 0,
                  transitProgressPct: 15,
                  customerDropoffNotes:
                    '3.º Esq • Código Porta: 2480# • Sem dados pessoais (Zero-PII)',
                  lastMacroExecuted:
                    "[Macro: Oferta Aceite + Cronómetro de Recolha na Loja Ativo]",
                  lastVoiceTtsConfirmation: null,
                }
              : prev.activeDeliveryLifecycle,
        };
      });
    },
    []
  );

  const setBackpackWeightLimitKg = useCallback((limitKg: number) => {
    const clamped = Math.max(5, Math.min(35, Number(limitKg.toFixed(1))));
    setState((prev) => ({
      ...prev,
      backpackWeightLimitKg: clamped,
    }));
  }, []);

  const updateAuditedItemQuantity = useCallback(
    (itemId: string, delta: number) => {
      setState((prev) => ({
        ...prev,
        auditedOrderItems: prev.auditedOrderItems.map((entry) =>
          entry.itemId === itemId
            ? { ...entry, quantity: Math.max(0, entry.quantity + delta) }
            : entry
        ),
      }));
    },
    []
  );

  const generateOverweightDisputeProofAndLog = useCallback(
    (
      offer: ScannedOffer,
      totalKg: number,
      limitKg: number,
      itemsSummary: string
    ) => {
      const excessKg = Math.max(0, Number((totalKg - limitKg).toFixed(1)));
      const recommendedCouriers = Math.max(2, Math.ceil(totalKg / limitKg));
      const orderRef = offer.orderId || '#4829';

      const disputeText = `RECLAMAÇÃO FORMAL DE SOBREPESO ILEGAL E RISCO ERGONÓMICO — ${offer.platform.toUpperCase()}
Pedido: ${orderRef} (Zero-PII • Destino: ${offer.destinationName}) | Estabelecimento: ${offer.originName}
Zona: ${offer.cityZone}

1. AUDITORIA AUTOMÁTICA DE PESO BRUTO (INCLUINDO TARA DE VIDRO):
• Peso Total Calculado do Pedido: ${totalKg.toFixed(1)} kg
• Limite Legal / Ergonómico de Mochila: ${limitKg.toFixed(1)} kg
• Excesso Ilegal Atribuído: +${excessKg.toFixed(1)} kg acima do limite (+${(
        (excessKg / limitKg) *
        100
      ).toFixed(0)}%)
• Composição Detetada: ${itemsSummary}

2. EXIGÊNCIA OPERACIONAL E COMPENSAÇÃO:
Este pedido exige obrigatoriamente ${recommendedCouriers}+ estafetas (Divisão de Carga / Split-Order) por ultrapassar a capacidade segura de transporte em veículo de 2 rodas. Solicita-se a divisão imediata da recolha sem penalização de taxa de aceitação ou o pagamento de suplemento de carga pesada.`;

      const createdComplaint = addComplaintRecord({
        category: 'TARIFA_SUPORTE',
        platform: offer.platform,
        cityZone: offer.cityZone || 'Amarante — São Gonçalo',
        title: `Sobrepeso Ilegal (${totalKg.toFixed(1)} kg vs limite ${limitKg.toFixed(
          1
        )} kg) — Pedido ${orderRef} (${offer.originName})`,
        description: `Auditoria de Itens detetou ${totalKg.toFixed(
          1
        )} kg (${itemsSummary}) atribuídos a estafeta individual. Exige ${recommendedCouriers}+ estafetas.`,
      });

      return { text: disputeText, createdComplaint };
    },
    [addComplaintRecord]
  );

  const toggleSimulateSecondCourier = useCallback(() => {
    setState((prev) => ({
      ...prev,
      simulateSecondCourierPaired: !prev.simulateSecondCourierPaired,
    }));
  }, []);

  const toggleCargoChecklistItem = useCallback((key: CargoChecklistItemId) => {
    const labelMap: Record<CargoChecklistItemId, string> = {
      CARGO_GRADE_CERVEJA_14_8: 'Levei 1x Grade de Cerveja (14.8 kg)',
      CARGO_GARRAFOES_AGUA_12_2: 'Ficou no balcão: 2x Garrafões Água 6L (12.2 kg)',
      CARGO_AGUARDAR_COLEGA_MORADA: 'Aguardar colega no ponto de entrega',
    };

    setState((prev) => {
      const nextVal = !prev.cargoSplitChecklist[key];
      const nextChecklist = {
        ...prev.cargoSplitChecklist,
        [key]: nextVal,
      };

      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const syncMsg: WalkieMessage = {
        id: `MSG-CARGO-${Date.now()}`,
        channel: 'PARCEIRO_PEDIDO_DIVIDIDO',
        senderId: 'SELF-COURIER',
        senderName: prev.userPrefs.anonymousMode
          ? 'Estafeta Anónimo (#1)'
          : prev.verifiedAccount.courierName,
        senderVehicle: prev.vehicleProfile.vehicleType,
        senderTrustScore: prev.userTrustScore,
        timestamp: nowStr,
        text: `${nextVal ? '✅ Confirmado na Carga:' : '↩️ Desmarcado:'} "${
          labelMap[key]
        }" (Pedido #4829 - Zona: Continente Modelo Amarante)`,
        isSystemCargoSync: true,
        communityFlagsCount: 0,
      };

      return {
        ...prev,
        cargoSplitChecklist: nextChecklist,
        walkieMessages: [...prev.walkieMessages, syncMsg],
      };
    });
  }, []);

  const toggleOptInMapAndZoneChat = useCallback(() => {
    setState((prev) => {
      const nextOptIn = !prev.optInMapAndZoneChat;
      return {
        ...prev,
        optInMapAndZoneChat: nextOptIn,
        userPrefs: {
          ...prev.userPrefs,
          anonymousMode: !nextOptIn,
        },
      };
    });
  }, []);

  const sendWalkieMessage = useCallback(
    (
      text: string,
      options?: {
        isVoicePtt?: boolean;
        voiceDurationSec?: number;
        channelOverride?: WalkieChannelId;
      }
    ) => {
      if (state.isAppPaused) {
        return {
          ok: false,
          reason:
            'Aplicação em Pausa de Turno: Retome o turno no topo para transmitir no Walkie-Talkie.',
        };
      }

      const trimmed = text.trim();
      if (!trimmed) {
        return { ok: false, reason: 'Mensagem vazia.' };
      }

      const nowMs = Date.now();
      const elapsedMs = nowMs - lastSentTimestampMs;
      if (lastSentTimestampMs > 0 && elapsedMs < 5000) {
        const remaining = Math.ceil((5000 - elapsedMs) / 1000);
        return {
          ok: false,
          reason: `Anti-Spam Ativo: Aguarde ${remaining}s antes de enviar nova mensagem no rádio.`,
          cooldownRemainingSec: remaining,
        };
      }

      const normalizedLower = trimmed.toLowerCase();
      const matchedBadWord = PROFANITY_BLOCKLIST_PT.find((bad) =>
        normalizedLower.includes(bad)
      );
      if (matchedBadWord) {
        return {
          ok: false,
          reason: `Auto-Moderação Bloqueou a Mensagem: Linguagem abusiva/ofensiva detetada ("${matchedBadWord}"). Mantenha o rádio profissional.`,
          blockedWord: matchedBadWord,
        };
      }

      const targetChannel = options?.channelOverride || activeWalkieChannel;
      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const newMsg: WalkieMessage = {
        id: `MSG-${Date.now()}`,
        channel: targetChannel,
        senderId: 'SELF-COURIER',
        senderName: state.userPrefs.anonymousMode
          ? 'Estafeta Anónimo'
          : state.verifiedAccount.courierName,
        senderVehicle: state.vehicleProfile.vehicleType,
        senderTrustScore: state.userTrustScore,
        timestamp: nowStr,
        text: trimmed,
        isVoicePtt: options?.isVoicePtt ?? false,
        voiceDurationSec: options?.voiceDurationSec,
        communityFlagsCount: 0,
      };

      setLastSentTimestampMs(nowMs);
      setState((prev) => ({
        ...prev,
        walkieMessages: [...prev.walkieMessages, newMsg],
      }));

      void publishWalkieMessageToCloud({
        ...newMsg,
        senderId: realCourierProfileRef.current.id || 'SELF-COURIER',
        senderName:
          realCourierProfileRef.current.name.trim() || newMsg.senderName,
      });

      return { ok: true };
    },
    [
      state.isAppPaused,
      lastSentTimestampMs,
      activeWalkieChannel,
      state.vehicleProfile.vehicleType,
      state.userTrustScore,
      state.userPrefs.anonymousMode,
      state.verifiedAccount.courierName,
    ]
  );

  const flagOrMuteWalkieMessage = useCallback((messageId: string) => {
    let updatedCount = 0;
    let autoMutedName: string | undefined;

    setState((prev) => {
      let senderToMute: string | null = null;
      const nextMessages = prev.walkieMessages.map((msg) => {
        if (msg.id !== messageId) return msg;
        updatedCount = msg.communityFlagsCount + 1;
        if (updatedCount >= 3) {
          senderToMute = msg.senderId;
          autoMutedName = msg.senderName;
        }
        return {
          ...msg,
          communityFlagsCount: updatedCount,
        };
      });

      const nextMuted =
        senderToMute && !prev.mutedSenderIds.includes(senderToMute)
          ? [...prev.mutedSenderIds, senderToMute]
          : prev.mutedSenderIds;

      return {
        ...prev,
        walkieMessages: nextMessages,
        mutedSenderIds: nextMuted,
      };
    });

    return {
      newFlagsCount: updatedCount,
      autoMutedSenderName: autoMutedName,
    };
  }, []);

  const triggerSosEmergencyBeacon = useCallback(
    (emergencyType: EmergencySosType) => {
      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const exactCoords = '41.2688° N, 8.0782° W';
      const exactStreet =
        'Av. General Silveira / Ponte de São Gonçalo, Amarante';

      const initialLinesByType: Record<EmergencySosType, string[]> = {
        'Acidente na Via': [
          '[00:01] Microfone Aberto Hands-Free ativado em modo contínuo (OPEN LIVE STREAM).',
          '[00:03] "Preciso de ajuda imediata na rotunda de São Gonçalo em Amarante, sofri embate na via!"',
        ],
        'Assédio / Ameaça em Curso': [
          '[00:01] Microfone Aberto Hands-Free bloqueado automaticamente (Mãos-Livres).',
          '[00:04] "Afastem-se da mota por favor! A gravação e o meu GPS exato estão a ser transmitidos em direto para os colegas de Amarante!"',
        ],
        'Conflito c/ Cliente': [
          '[00:01] Microfone Aberto Contínuo ativado para proteção legal do estafeta.',
          '[00:03] "Estou na portaria do cliente em Amarante, recusa fornecer PIN e está agressivo. Áudio em direto p/ prova."',
        ],
        'Avaria Grave': [
          '[00:01] Microfone Aberto Contínuo e baliza GPS exata ativados.',
          '[00:03] "Mota imobilizada na EN15 em Amarante, preciso de sinalização e apoio de colega próximo."',
        ],
      };

      const beacon: ActiveSosBeaconState = {
        active: true,
        emergencyType,
        openMicLocked: state.userPrefs.autoOpenMicOnSos,
        exactGpsCoords: exactCoords,
        exactStreetAddress: exactStreet,
        triggeredAt: nowStr,
        liveTranscriptLines: initialLinesByType[emergencyType],
      };

      const sosMsg: WalkieMessage = {
        id: `SOS-${Date.now()}`,
        channel: 'RADIO_ZONA_LOCAL',
        senderId: 'SELF-COURIER',
        senderName: '🚨 SOS OPEN-MIC • Estafeta em Emergência',
        senderVehicle: state.vehicleProfile.vehicleType,
        senderTrustScore: state.userTrustScore,
        timestamp: nowStr,
        text: `ALERTA SOS HANDS-FREE (${emergencyType.toUpperCase()}): Microfone Aberto Contínuo em transmissão! A transmitir áudio ambiente e GPS exato (${exactCoords} — ${exactStreet}) para estafetas num raio de 3 km!`,
        isSosBroadcast: true,
        sosEmergencyType: emergencyType,
        exactGpsCoords: exactCoords,
        exactStreetAddress: exactStreet,
        communityFlagsCount: 0,
      };

      setActiveWalkieChannel('RADIO_ZONA_LOCAL');
      setState((prev) => ({
        ...prev,
        isAppPaused: false, // Emergency overrides pause
        activeSosBeacon: beacon,
        walkieMessages: [...prev.walkieMessages, sosMsg],
      }));
    },
    [
      state.vehicleProfile.vehicleType,
      state.userTrustScore,
      state.userPrefs.autoOpenMicOnSos,
    ]
  );

  const appendSosTranscriptLine = useCallback((line: string) => {
    setState((prev) => {
      if (!prev.activeSosBeacon) return prev;
      return {
        ...prev,
        activeSosBeacon: {
          ...prev.activeSosBeacon,
          liveTranscriptLines: [
            ...prev.activeSosBeacon.liveTranscriptLines,
            line,
          ],
        },
      };
    });
  }, []);

  const endSosAndSaveProof = useCallback((elapsedSeconds: number): string => {
    let summarySaved = '';
    setState((prev) => {
      if (!prev.activeSosBeacon) return prev;
      const b = prev.activeSosBeacon;
      summarySaved = `PROVA SOS GUARDADA [${b.triggeredAt}] • Tipo: ${
        b.emergencyType
      } • Duração: ${elapsedSeconds}s • GPS Exato: ${b.exactGpsCoords} (${
        b.exactStreetAddress
      }) • Transcrição: ${b.liveTranscriptLines.join(' | ')}`;

      return {
        ...prev,
        activeSosBeacon: null,
        savedSosProofs: [summarySaved, ...prev.savedSosProofs],
      };
    });
    return summarySaved;
  }, []);

  const clearSosEmergencyBeacon = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeSosBeacon: null,
    }));
  }, []);

  const shareExactLocationWithCourier = useCallback(
    (recipientName: string, channel: WalkieChannelId) => {
      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const exactCoords = '41.2688° N, 8.0782° W';
      const exactStreet =
        'Continente Modelo — Amarante (Entrada Lateral / Balcão Recolha)';

      const pinMsg: WalkieMessage = {
        id: `PIN-${Date.now()}`,
        channel,
        senderId: 'SELF-COURIER',
        senderName: 'Tu (Partilha de Pin Exato)',
        senderVehicle: state.vehicleProfile.vehicleType,
        senderTrustScore: state.userTrustScore,
        timestamp: nowStr,
        text: `📍 Localização Exata partilhada com ${recipientName}: ${exactCoords} (${exactStreet}).`,
        isDirectLocationPin: true,
        targetRecipientName: recipientName,
        exactGpsCoords: exactCoords,
        exactStreetAddress: exactStreet,
        communityFlagsCount: 0,
      };

      setActiveWalkieChannel(channel);
      setState((prev) => ({
        ...prev,
        walkieMessages: [...prev.walkieMessages, pinMsg],
      }));
    },
    [state.vehicleProfile.vehicleType, state.userTrustScore]
  );

  // =========================================================================
  // STEP 6 CALLBACKS: GLOVO WALLET, FLEET/TAX, PERSONAL GOALS & BUDDYREWARDS
  // =========================================================================

  const awardBuddyRewardTask = useCallback(
    (taskKey: RewardTaskKey, customTitle?: string) => {
      const taskMap: Record<
        RewardTaskKey,
        { title: string; points: number; xp: number }
      > = {
        BATER_META_DIARIA_50: {
          title: 'Bater a Meta Pessoal Diária',
          points: 50,
          xp: 50,
        },
        ADERIR_PACTO_ZONA_40: {
          title: 'Cumprir Acordo Coletivo de Zona (>= 5,00 €)',
          points: 40,
          xp: 40,
        },
        SINCRONIZAR_PEDIDO_DIVIDIDO_25: {
          title: 'Sincronizar Pedido Dividido com Colega',
          points: 25,
          xp: 25,
        },
        REGISTAR_ROTA_PROIBIDA_20: {
          title: 'Registar Rota Proibida / Desvio com Prova',
          points: 20,
          xp: 20,
        },
        ALERTAR_ANOMALIA_MAPA_15: {
          title: 'Alertar Anomalia / Buraco na Via no Mapa',
          points: 15,
          xp: 15,
        },
        BONUS_ENTREGA_HANDS_FREE_15: {
          title: 'Bónus Entrega Hands-Free',
          points: 15,
          xp: 15,
        },
        FECHAR_AUDITORIA_GLOVO_10: {
          title: 'Fechar Auditoria Diária de Caixa Glovo',
          points: 10,
          xp: 10,
        },
      };

      const meta = taskMap[taskKey];
      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      });

      setState((prev) => ({
        ...prev,
        buddyRewards: {
          ...prev.buddyRewards,
          buddyCoins: prev.buddyRewards.buddyCoins + meta.points,
          xpPoints: prev.buddyRewards.xpPoints + meta.xp,
          actionHistory: [
            {
              id: `RWD-${Date.now()}`,
              timestamp: `Agora, ${nowStr}`,
              taskKey,
              title: customTitle || meta.title,
              pointsAwarded: meta.points,
              xpAwarded: meta.xp,
            },
            ...prev.buddyRewards.actionHistory,
          ],
        },
      }));
    },
    []
  );

  const updateGlovoWallet = useCallback(
    (patch: Partial<GlovoDailyWalletState>) => {
      setRealGlovoWalletPatch((prev) => ({ ...prev, ...patch }));
      setState((prev) => ({
        ...prev,
        glovoWallet: {
          ...prev.glovoWallet,
          ...patch,
        },
      }));
    },
    []
  );

  const closeGlovoDailyAudit = useCallback(() => {
    setRealGlovoWalletPatch((prev) => ({ ...prev, auditClosedToday: true }));
    setState((prev) => {
      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return {
        ...prev,
        glovoWallet: {
          ...prev.glovoWallet,
          auditClosedToday: true,
        },
        buddyRewards: {
          ...prev.buddyRewards,
          buddyCoins: prev.buddyRewards.buddyCoins + 10,
          xpPoints: prev.buddyRewards.xpPoints + 10,
          actionHistory: [
            {
              id: `RWD-GLOVO-${Date.now()}`,
              timestamp: `Agora, ${nowStr}`,
              taskKey: 'FECHAR_AUDITORIA_GLOVO_10',
              title: 'Fechar Auditoria Diária de Caixa Glovo',
              pointsAwarded: 10,
              xpAwarded: 10,
            },
            ...prev.buddyRewards.actionHistory,
          ],
        },
      };
    });
  }, []);

  const updateTaxAndFleetConfig = useCallback(
    (patch: Partial<TaxAndFleetConfigState>) => {
      setState((prev) => ({
        ...prev,
        taxAndFleetConfig: {
          ...prev.taxAndFleetConfig,
          ...patch,
        },
      }));
    },
    []
  );

  const toggleRookieInvoiceItem = useCallback(
    (key: keyof RookieInvoiceChecklistState) => {
      setState((prev) => ({
        ...prev,
        taxAndFleetConfig: {
          ...prev.taxAndFleetConfig,
          invoiceChecklist: {
            ...prev.taxAndFleetConfig.invoiceChecklist,
            [key]: !prev.taxAndFleetConfig.invoiceChecklist[key],
          },
        },
      }));
    },
    []
  );

  const updatePersonalGoals = useCallback(
    (patch: Partial<PersonalGoalsState>) => {
      setState((prev) => ({
        ...prev,
        personalGoals: {
          ...prev.personalGoals,
          ...patch,
        },
      }));
    },
    []
  );

  // =========================================================================
  // STEP 7 CALLBACKS: FLOATING BUBBLE MODE, MILESTONE ANIMATIONS,
  // ZONE AGREEMENTS, SAFETY TELEMETRY, B2B PORTAL & VOICE COMMAND COPILOT
  // =========================================================================

  const setIsBubbleMinimized = useCallback(
    (minimized: boolean) => {
      if (minimized) {
        cancelSpeechNow();
        setIsQuickSummaryOpenState(false);
      }

      if (typeof window !== 'undefined') {
        const winAny = window as unknown as {
          BuddyNativeOverlay?: {
            minimizeToFloatingBubble?: () => void;
            maximizeFromBubble?: () => void;
            setBubbleListeningState?: (listening: boolean) => void;
            startNativeVoice?: () => void;
            stopNativeVoice?: () => void;
          };
          BuddyAndroid?: {
            maximizeWindow?: () => void;
            minimizeToBubble?: () => void;
          };
        };

        // If running inside Native Android .APK (window.BuddyNativeOverlay):
        // Keep the normal React dashboard rendered in the WebView (isBubbleMinimized = false)
        // and let MainActivity moveTaskToBack(true) + show BuddyOverlayService floating DB bubble!
        if (winAny.BuddyNativeOverlay) {
          setState((prev) =>
            prev.isBubbleMinimized ? { ...prev, isBubbleMinimized: false } : prev
          );
          if (minimized) {
            try {
              winAny.BuddyNativeOverlay.minimizeToFloatingBubble?.();
            } catch {
              // ignore native overlay error
            }
          } else if (typeof document !== 'undefined' && document.hidden) {
            // Only call native maximizeFromBubble when actually transitioning from background to foreground!
            try {
              winAny.BuddyNativeOverlay.maximizeFromBubble?.();
            } catch {
              // ignore native overlay error
            }
          }
          return;
        }

        // Web / PWA fallback when not inside Native Android .APK
        setState((prev) => {
          if (!minimized && prev.isBubbleMinimized) {
            playBuddyOpenChime();
          }
          return prev.isBubbleMinimized === minimized
            ? prev
            : {
                ...prev,
                isBubbleMinimized: minimized,
              };
        });

        if (minimized) {
          try {
            winAny.BuddyAndroid?.minimizeToBubble?.();
          } catch {
            // ignore legacy native bridge error
          }
          try {
            if (typeof document !== 'undefined' && document.fullscreenElement) {
              document.exitFullscreen?.().catch(() => {});
            }
          } catch {
            // ignore fullscreen exit error
          }
        } else {
          try {
            winAny.BuddyAndroid?.maximizeWindow?.();
          } catch {
            // ignore legacy native bridge error
          }
          try {
            window.focus?.();
          } catch {
            // ignore focus error
          }
        }
      } else {
        setState((prev) =>
          prev.isBubbleMinimized === minimized
            ? prev
            : {
                ...prev,
                isBubbleMinimized: minimized,
              }
        );
      }
    },
    [cancelSpeechNow]
  );

  // Sync listening state with Native Android Overlay Service bubble & hard-stop mic when OFF
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const winAny = window as unknown as {
      BuddyNativeOverlay?: {
        setBubbleListeningState?: (listening: boolean) => void;
        stopNativeVoice?: () => void;
      };
      __onNativeBubbleRestore?: () => void;
      onBuddyNativeListeningState?: (listening: boolean) => void;
      onBuddyNativeSpeakingState?: (speaking: boolean) => void;
    };
    try {
      winAny.BuddyNativeOverlay?.setBubbleListeningState?.(
        isListeningSpeechRecognition
      );
      if (!isListeningSpeechRecognition) {
        keepVoiceListeningRef.current = false;
        winAny.BuddyNativeOverlay?.stopNativeVoice?.();
      }
    } catch {
      // ignore
    }
    winAny.onBuddyNativeListeningState = (listening: boolean) => {
      keepVoiceListeningRef.current = Boolean(listening);
      setIsListeningSpeechRecognition(Boolean(listening));
    };
    winAny.onBuddyNativeSpeakingState = (speaking: boolean) => {
      isSpeakingTtsRef.current = Boolean(speaking);
      setIsSpeakingTts(Boolean(speaking));
    };
    winAny.__onNativeBubbleRestore = () => {
      playBuddyOpenChime();
      setState((prev) =>
        prev.isBubbleMinimized ? { ...prev, isBubbleMinimized: false } : prev
      );
      // Never speak "Tela aberta" on restore — keep open modals & active speech intact!
    };
  }, [isListeningSpeechRecognition]);

  const dismissBubbleAnimation = useCallback(() => {
    setActiveBubbleAnimation(null);
  }, []);

  const triggerBubbleMilestoneAnimation = useCallback(
    (eventType: BubbleMilestoneEventType, customSubtitle?: string) => {
      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const presetByEvent: Record<
        BubbleMilestoneEventType,
        Omit<BubbleAlertAnimationState, 'id' | 'eventType' | 'triggeredAt'>
      > = {
        META_ATINGIDA: {
          title: '🏆 Meta Atingida! (+50 BuddyCoins)',
          subtitle:
            customSubtitle ||
            `Objetivo diário líquido de ${state.personalGoals.dailyNetGoalEur.toFixed(
              2
            )} € concluído com sucesso!`,
          badgeText: 'MARCO DE META 100%',
          accentColor: 'white',
          voiceReadoutText:
            'Parabéns! Meta diária líquida atingida! Recebeste mais 50 BuddyCoins na tua carteira.',
        },
        PACTO_ZONA_ATIVO: {
          title: '🤝 Acordo de Zona Ativo (>= 5,00 €)',
          subtitle:
            customSubtitle ||
            'Acordo Zona Centro: Só aceitar pedidos >= 5,00 € (35 estafetas unidos). Piso imposto no Scanner!',
          badgeText: 'ACORDO COLETIVO +40 PTS',
          accentColor: 'zinc',
          voiceReadoutText:
            'Acordo de Zona Centro ativo. O Scanner está a bloquear automaticamente qualquer oferta abaixo de 5 euros.',
        },
        PEDIDO_DIVIDIDO_DETETADO: {
          title: '📦 Pedido Dividido Detetado (#4829)',
          subtitle:
            customSubtitle ||
            'Carga de 14.8 kg detetada no Continente Amarante! Diga "dividir pedido" para acionar suporte.',
          badgeText: 'SPLIT-ORDER MATCH',
          accentColor: 'zinc',
          voiceReadoutText: buildSurgicalHeavyOrderStreetTts(14),
        },
        ALERTA_VELOCIDADE_TELEMOVEL: {
          title: '⚠️ Alerta de Velocidade / Telemóvel em Movimento!',
          subtitle:
            customSubtitle ||
            'Atenção! Uso prolongado do telemóvel em movimento (>8s). Mude para o Modo Bolha ou use Comandos de Voz.',
          badgeText: 'SEGURANÇA RODOVIÁRIA',
          accentColor: 'zinc',
          voiceReadoutText:
            'Atenção! Uso prolongado do telemóvel em movimento. Risco de acidente. Mude para o Modo Bolha ou use Comandos de Voz.',
        },
        SOS_EMERGENCIA: {
          title: '🚨 SOS Microfone Aberto em Transmissão!',
          subtitle:
            customSubtitle ||
            'Áudio ambiente e coordenadas GPS exatas (41.2704° N) transmitidos em direto para colegas a 3 km!',
          badgeText: 'SOS OPEN-MIC',
          accentColor: 'white',
          voiceReadoutText:
            'Alerta SOS de emergência ativado. Microfone aberto e localização GPS exata em transmissão para os estafetas da zona.',
        },
      };

      const chosen = presetByEvent[eventType];
      const anim: BubbleAlertAnimationState = {
        id: `BUB-ANIM-${Date.now()}`,
        eventType,
        triggeredAt: nowStr,
        ...chosen,
      };

      setActiveBubbleAnimation(anim);
      speakTextPt(chosen.voiceReadoutText);

      // Auto-collapse after 4 seconds as specified in Step 7
      setTimeout(() => {
        setActiveBubbleAnimation((current) =>
          current?.id === anim.id ? null : current
        );
      }, 4200);
    },
    [state.personalGoals.dailyNetGoalEur, speakTextPt]
  );

  const recordCompletedDeliveryForGoal = useCallback(
    (
      netEurAdded = 4.5,
      durationMins = 18,
      platformOverride?: PlatformName,
      realKmAdded = 2.6
    ): { milestoneReached: 50 | 75 | 100 | null; newPct: number } => {
      let milestoneReached: 50 | 75 | 100 | null = null;
      let computedNewPct = 0;

      const resolvedPlat: PlatformName =
        platformOverride ||
        (state.activePlatformScope !== 'GLOBAL_CRUZADO'
          ? state.activePlatformScope
          : state.activeDeliveryLifecycle.platform || 'Uber Eats');
      const grossAddedVal = Number((netEurAdded * 1.18).toFixed(2));
      const newRealTrip: ShiftTripLog = {
        id: `REAL-SHF-${Date.now()}`,
        timestamp: new Date().toISOString(),
        platform: resolvedPlat,
        segment: 'Entrega Real Registada (Amarante)',
        grossEur: grossAddedVal,
        realKm: realKmAdded,
        netProfitEur: netEurAdded,
        netEurPerKm: Number(
          (netEurAdded / Math.max(0.1, realKmAdded)).toFixed(2)
        ),
        verdict: 'ACEITE',
      };
      setRealCompletedDeliveries((prev) => [newRealTrip, ...prev]);

      setState((prev) => {
        const targetPlatform: PlatformName =
          platformOverride ||
          (prev.activePlatformScope !== 'GLOBAL_CRUZADO'
            ? prev.activePlatformScope
            : prev.activeDeliveryLifecycle.platform || 'Uber Eats');

        const grossAdded = Number((netEurAdded * 1.18).toFixed(2));
        const curPlatLedger = prev.platformLedgers[targetPlatform];
        const updatedPlatLedger: PlatformFinancialLedger = {
          ...curPlatLedger,
          dailyGrossEur: Number(
            (curPlatLedger.dailyGrossEur + grossAdded).toFixed(2)
          ),
          weeklyGrossEur: Number(
            (curPlatLedger.weeklyGrossEur + grossAdded).toFixed(2)
          ),
          monthlyGrossEur: Number(
            (curPlatLedger.monthlyGrossEur + grossAdded).toFixed(2)
          ),
          dailyNetEarnedEur: Number(
            (curPlatLedger.dailyNetEarnedEur + netEurAdded).toFixed(2)
          ),
          weeklyNetEarnedEur: Number(
            (curPlatLedger.weeklyNetEarnedEur + netEurAdded).toFixed(2)
          ),
          monthlyNetEarnedEur: Number(
            (curPlatLedger.monthlyNetEarnedEur + netEurAdded).toFixed(2)
          ),
          completedDeliveriesToday: curPlatLedger.completedDeliveriesToday + 1,
          completedKmToday: Number(
            (curPlatLedger.completedKmToday + realKmAdded).toFixed(1)
          ),
          completedKmWeek: Number(
            (curPlatLedger.completedKmWeek + realKmAdded).toFixed(1)
          ),
          completedKmMonth: Number(
            (curPlatLedger.completedKmMonth + realKmAdded).toFixed(1)
          ),
          hoursWorkedToday: Number(
            (curPlatLedger.hoursWorkedToday + durationMins / 60).toFixed(2)
          ),
        };

        const goal = Math.max(1, prev.personalGoals.dailyNetGoalEur);
        const oldEarned = prev.personalGoals.currentDailyNetEarnedEur;
        const newEarned = Number((oldEarned + netEurAdded).toFixed(2));
        const oldPct = (oldEarned / goal) * 100;
        const newPct = (newEarned / goal) * 100;
        computedNewPct = newPct;

        if (oldPct < 100 && newPct >= 100) {
          milestoneReached = 100;
        } else if (oldPct < 75 && newPct >= 75) {
          milestoneReached = 75;
        } else if (oldPct < 50 && newPct >= 50) {
          milestoneReached = 50;
        }

        const nowStr = new Date().toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const updatedRewards =
          milestoneReached === 100
            ? {
                ...prev.buddyRewards,
                buddyCoins: prev.buddyRewards.buddyCoins + 50,
                xpPoints: prev.buddyRewards.xpPoints + 50,
                actionHistory: [
                  {
                    id: `RWD-GOAL-${Date.now()}`,
                    timestamp: `Agora, ${nowStr}`,
                    taskKey: 'BATER_META_DIARIA_50' as RewardTaskKey,
                    title: `Bater a Meta Pessoal Diária (${goal.toFixed(2)} € Líquidos)`,
                    pointsAwarded: 50,
                    xpAwarded: 50,
                  },
                  ...prev.buddyRewards.actionHistory,
                ],
              }
            : prev.buddyRewards;

        return {
          ...prev,
          userOrderAvailabilityStatus: 'DISPONIVEL',
          shiftTrips: [newRealTrip, ...prev.shiftTrips],
          platformLedgers: {
            ...prev.platformLedgers,
            [targetPlatform]: updatedPlatLedger,
          },
          personalGoals: {
            ...prev.personalGoals,
            currentDailyNetEarnedEur: newEarned,
            currentWeeklyNetEarnedEur: Number(
              (prev.personalGoals.currentWeeklyNetEarnedEur + netEurAdded).toFixed(2)
            ),
            currentMonthlyNetEarnedEur: Number(
              (prev.personalGoals.currentMonthlyNetEarnedEur + netEurAdded).toFixed(2)
            ),
            hoursWorkedToday: Number(
              (prev.personalGoals.hoursWorkedToday + durationMins / 60).toFixed(2)
            ),
            completedDeliveriesToday:
              prev.personalGoals.completedDeliveriesToday + 1,
            completedKmToday: Number(
              ((prev.personalGoals.completedKmToday ?? 34.5) + realKmAdded).toFixed(1)
            ),
            completedKmWeek: Number(
              ((prev.personalGoals.completedKmWeek ?? 212.0) + realKmAdded).toFixed(1)
            ),
            completedKmMonth: Number(
              ((prev.personalGoals.completedKmMonth ?? 860.0) + realKmAdded).toFixed(1)
            ),
          },
          buddyRewards: updatedRewards,
        };
      });

      if (milestoneReached === 100) {
        setLastGoalMilestoneBanner(
          '🏆 PARABÉNS! META DIÁRIA 100% ATINGIDA! Recebeste +50 BuddyCoins e +50 XP no BuddyRewards!'
        );
        triggerBubbleMilestoneAnimation('META_ATINGIDA');
      } else if (milestoneReached === 75) {
        setLastGoalMilestoneBanner(
          '🔥 MARCO DE 75% DA META DIÁRIA ATINGIDO! Estás na reta final do teu turno!'
        );
      } else if (milestoneReached === 50) {
        setLastGoalMilestoneBanner(
          '⚡ MARCO DE 50% DA META DIÁRIA ULTRAPASSADO! Meio caminho feito com lucro real!'
        );
      }

      return { milestoneReached, newPct: computedNewPct };
    },
    [triggerBubbleMilestoneAnimation]
  );

  const clearGoalMilestoneBanner = useCallback(() => {
    setLastGoalMilestoneBanner(null);
  }, []);

  const allMarketplaceRewards = useMemo(() => {
    return [...REWARD_MARKETPLACE_ITEMS, ...state.customMarketplaceItems];
  }, [state.customMarketplaceItems]);

  const claimMarketplaceReward = useCallback(
    (
      rewardId: string
    ): { ok: boolean; message: string; voucherCode?: string } => {
      const item = allMarketplaceRewards.find((r) => r.id === rewardId);
      if (!item) {
        return { ok: false, message: 'Recompensa não encontrada.' };
      }

      if (state.buddyRewards.claimedRewardIds.includes(rewardId)) {
        const existingCode = state.buddyRewards.claimedVoucherCodes[rewardId];
        return {
          ok: true,
          message: `Benefício já resgatado! Código QR / Voucher ativo: ${existingCode}`,
          voucherCode: existingCode,
        };
      }

      const requiredRep = item.minCommunityReputationPct ?? 85;
      if (state.communityReputationPct < requiredRep) {
        return {
          ok: false,
          message: `Reputação na Comunidade insuficiente: este vale exige >= ${requiredRep}% (tens ${state.communityReputationPct}%). Adere a um Acordo de Zona para subir a reputação!`,
        };
      }

      if (state.buddyRewards.buddyCoins < item.costBuddyCoins) {
        return {
          ok: false,
          message: `Saldo insuficiente: precisas de ${item.costBuddyCoins} BuddyCoins (tens ${state.buddyRewards.buddyCoins} pts).`,
        };
      }

      const generatedCode = `${item.voucherCodePrefix}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      setState((prev) => ({
        ...prev,
        buddyRewards: {
          ...prev.buddyRewards,
          buddyCoins: prev.buddyRewards.buddyCoins - item.costBuddyCoins,
          claimedRewardIds: [...prev.buddyRewards.claimedRewardIds, rewardId],
          claimedVoucherCodes: {
            ...prev.buddyRewards.claimedVoucherCodes,
            [rewardId]: generatedCode,
          },
        },
      }));

      return {
        ok: true,
        message: `Vale "${item.title}" resgatado com sucesso! Apresenta o QR Code no parceiro.`,
        voucherCode: generatedCode,
      };
    },
    [allMarketplaceRewards, state.buddyRewards, state.communityReputationPct]
  );

  // Step 7 Module 3: Collective Area Rules Engine ("Acordos de Zona")
  const toggleJoinZonePact = useCallback(
    (pactId: string) => {
      let joinedNow = false;
      let pactTitle = '';
      let pactMinEur = 5.0;

      setState((prev) => {
        const nowStr = new Date().toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const nextPacts = prev.zonePacts.map((p) => {
          if (p.id !== pactId) return p;
          const nextJoined = !p.joinedByUser;
          joinedNow = nextJoined;
          pactTitle = p.title;
          pactMinEur = p.minCollectiveOrderEur;
          return {
            ...p,
            joinedByUser: nextJoined,
            adheredCouriersCount: nextJoined
              ? p.adheredCouriersCount + 1
              : Math.max(1, p.adheredCouriersCount - 1),
          };
        });

        if (joinedNow) {
          return {
            ...prev,
            zonePacts: nextPacts,
            communityReputationPct: Math.min(
              100,
              prev.communityReputationPct + 4
            ),
            buddyRewards: {
              ...prev.buddyRewards,
              buddyCoins: prev.buddyRewards.buddyCoins + 40,
              xpPoints: prev.buddyRewards.xpPoints + 40,
              actionHistory: [
                {
                  id: `RWD-PACT-${Date.now()}`,
                  timestamp: `Agora, ${nowStr}`,
                  taskKey: 'ADERIR_PACTO_ZONA_40',
                  title: `Aderir ao ${pactTitle}`,
                  pointsAwarded: 40,
                  xpAwarded: 40,
                },
                ...prev.buddyRewards.actionHistory,
              ],
            },
          };
        }

        return {
          ...prev,
          zonePacts: nextPacts,
        };
      });

      if (joinedNow) {
        triggerBubbleMilestoneAnimation(
          'PACTO_ZONA_ATIVO',
          `${pactTitle} ativo! Scanner impõe piso >= ${pactMinEur.toFixed(
            2
          )} € (+40 BuddyCoins e Reputação aumentada).`
        );
      }
    },
    [triggerBubbleMilestoneAnimation]
  );

  const createZonePact = useCallback(
    (
      input: Omit<
        ZonePactRule,
        'id' | 'adheredCouriersCount' | 'joinedByUser' | 'createdBy'
      >
    ): ZonePactRule => {
      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const created: ZonePactRule = {
        ...input,
        id: `PACT-PT-${Math.floor(10 + Math.random() * 89)}`,
        adheredCouriersCount: 15,
        joinedByUser: true,
        createdBy: state.userPrefs.anonymousMode
          ? 'Estafeta Verificado (Zona)'
          : state.verifiedAccount.courierName,
      };

      setState((prev) => ({
        ...prev,
        zonePacts: [created, ...prev.zonePacts],
        communityReputationPct: Math.min(100, prev.communityReputationPct + 4),
        buddyRewards: {
          ...prev.buddyRewards,
          buddyCoins: prev.buddyRewards.buddyCoins + 40,
          xpPoints: prev.buddyRewards.xpPoints + 40,
          actionHistory: [
            {
              id: `RWD-NEWPACT-${Date.now()}`,
              timestamp: `Agora, ${nowStr}`,
              taskKey: 'ADERIR_PACTO_ZONA_40',
              title: `Criar & Aderir: ${created.title}`,
              pointsAwarded: 40,
              xpAwarded: 40,
            },
            ...prev.buddyRewards.actionHistory,
          ],
        },
      }));

      triggerBubbleMilestoneAnimation(
        'PACTO_ZONA_ATIVO',
        `Novo Acordo Criado: ${created.title} (+40 BuddyCoins atribuídos!)`
      );

      return created;
    },
    [
      state.userPrefs.anonymousMode,
      state.verifiedAccount.courierName,
      triggerBubbleMilestoneAnimation,
    ]
  );

  // Step 7 Module 4: Rider Safety Telemetry (Speeding & Improper Phone Usage in Motion)
  const updateSafetyTelemetry = useCallback(
    (patch: Partial<RiderSafetyTelemetryState>) => {
      setState((prev) => ({
        ...prev,
        safetyTelemetry: {
          ...prev.safetyTelemetry,
          ...patch,
        },
      }));
    },
    []
  );

  const simulateSpeedAlert = useCallback(
    (speedKmh: number, roadMode?: 'URBANO' | 'VIA_RAPIDA') => {
      const mode = roadMode || state.safetyTelemetry.activeRoadMode;
      const cap =
        mode === 'URBANO'
          ? state.safetyTelemetry.urbanSpeedCapKmh
          : state.safetyTelemetry.highwaySpeedCapKmh;
      const isOverSpeed = speedKmh > cap;

      const warningMsg = isOverSpeed
        ? `🚨 EXCESSO DE VELOCIDADE DETETADO: Circulas a ${speedKmh} km/h em limite ${
            mode === 'URBANO' ? 'Urbano' : 'Via Rápida'
          } de ${cap} km/h! Reduz a velocidade para evitar sinistro e coima.`
        : null;

      setState((prev) => ({
        ...prev,
        safetyTelemetry: {
          ...prev.safetyTelemetry,
          activeRoadMode: mode,
          currentSimulatedSpeedKmh: speedKmh,
          lastSafetyWarningMessage: warningMsg,
        },
      }));

      if (isOverSpeed && state.safetyTelemetry.speedLimitAlertEnabled) {
        triggerBubbleMilestoneAnimation(
          'ALERTA_VELOCIDADE_TELEMOVEL',
          warningMsg || undefined
        );
      }
    },
    [state.safetyTelemetry, triggerBubbleMilestoneAnimation]
  );

  const simulatePhoneMisuseInMotion = useCallback(() => {
    const exactVoiceWarning =
      'Atenção! Uso prolongado do telemóvel em movimento. Risco de acidente. Mude para o Modo Bolha ou use Comandos de Voz.';

    setState((prev) => ({
      ...prev,
      safetyTelemetry: {
        ...prev.safetyTelemetry,
        currentSimulatedSpeedKmh: Math.max(
          36,
          prev.safetyTelemetry.currentSimulatedSpeedKmh
        ),
        currentTouchDurationSec: prev.safetyTelemetry.maxTouchDurationSec + 3,
        isPhoneMisuseTriggered: true,
        lastSafetyWarningMessage: exactVoiceWarning,
      },
    }));

    triggerBubbleMilestoneAnimation(
      'ALERTA_VELOCIDADE_TELEMOVEL',
      exactVoiceWarning
    );
    speakTextPt(exactVoiceWarning);
  }, [triggerBubbleMilestoneAnimation, speakTextPt]);

  const clearSafetyAlerts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      safetyTelemetry: {
        ...prev.safetyTelemetry,
        currentSimulatedSpeedKmh: 32,
        currentTouchDurationSec: 2,
        isPhoneMisuseTriggered: false,
        lastSafetyWarningMessage: null,
      },
    }));
  }, []);

  // Step 7 Module 6: B2B Partner Sponsorship Portal
  const registerB2BPartnerSponsorship = useCallback(
    (
      input: Omit<B2BPartnerSponsorshipRecord, 'id' | 'activeCouriersReached'>
    ): B2BPartnerSponsorshipRecord => {
      const newPartner: B2BPartnerSponsorshipRecord = {
        ...input,
        id: `B2B-PT-${Math.floor(10 + Math.random() * 89)}`,
        activeCouriersReached: Math.floor(180 + Math.random() * 450),
      };

      const newMarketplaceVoucher: RewardMarketplaceItem = {
        id: `REWARD-B2B-${Date.now()}`,
        title: `${input.discountOfferTitle} (${input.businessName})`,
        subtitle: `Vale B2B patrocinado por ${input.businessName} em ${input.cityZone}. Apresenta o QR Code diretamente na loja/oficina.`,
        rewardType: 'DIRETO',
        costBuddyCoins: input.costBuddyCoins,
        minCommunityReputationPct: input.minReputationPct,
        partnerBadge: `Parceiro B2B • ${input.category}`,
        voucherCodePrefix: input.voucherPrefix || 'B2B-VALE-PT',
        partnerBusinessName: input.businessName,
      };

      setState((prev) => ({
        ...prev,
        b2bPartners: [newPartner, ...prev.b2bPartners],
        customMarketplaceItems: [
          newMarketplaceVoucher,
          ...prev.customMarketplaceItems,
        ],
      }));

      return newPartner;
    },
    []
  );

  // =========================================================================
  // STEP 10: HANDS-FREE VOICE-CONTROLLED DELIVERY LIFECYCLE STATE MACHINE
  // =========================================================================

  const startActiveDeliveryFromOffer = useCallback(
    (offer: ScannedOffer, realKm: number, netProfitEur: number) => {
      setIsOfferAccepted(true);
      setHasRealActiveDelivery(true);
      setState((prev) => ({
        ...prev,
        userOrderAvailabilityStatus: 'OCUPADO_COM_PEDIDO',
        activeDeliveryLifecycle: {
          orderId: offer.orderId || `#410${offer.presetNumber || 1}`,
          platform: offer.platform,
          originName: offer.originName,
          destinationName: offer.destinationName,
          grossEur: offer.grossAmountEur,
          netProfitEur,
          realKm,
          estimatedMinutes: offer.estimatedMinutes,
          stage: 'AGUARDAR_RECOLHA',
          waitSecondsAtStore: 0,
          transitProgressPct: 15,
          customerDropoffNotes:
            '3.º Esq • Código Porta: 2480# • Sem dados pessoais (Zero-PII)',
          lastMacroExecuted:
            "[Macro: Oferta Aceite + Cronómetro de Recolha na Loja Ativo]",
          lastVoiceTtsConfirmation: null,
        },
      }));
    },
    []
  );

  const startDeliveryTransitStage = useCallback(() => {
    setIsOfferAccepted(true);
    const ttsMsg = 'Coleta confirmada. Iniciando rota para o cliente.';
    const macroText =
      "[Macro: Deslizar 'Pedido Recolhido' + Abrir Navegação GPS p/ Cliente]";

    setState((prev) => ({
      ...prev,
      userOrderAvailabilityStatus: 'OCUPADO_EM_ENTREGA',
      activeDeliveryLifecycle: {
        ...prev.activeDeliveryLifecycle,
        stage: 'EM_TRANSITO',
        transitProgressPct: 68,
        lastMacroExecuted: macroText,
        lastVoiceTtsConfirmation: ttsMsg,
      },
    }));

    speakTextPt(ttsMsg);
  }, [speakTextPt]);

  const completeActiveDeliveryStage = useCallback(
    (override?: {
      netProfitEur?: number;
      grossEur?: number;
      realKm?: number;
      platform?: PlatformName;
      originName?: string;
      destinationName?: string;
    }) => {
      const netEur =
        override?.netProfitEur ??
        (state.activeDeliveryLifecycle.netProfitEur || 4.95);
      const grossEur =
        override?.grossEur ?? (state.activeDeliveryLifecycle.grossEur || 5.4);
      const realKm =
        override?.realKm ?? (state.activeDeliveryLifecycle.realKm || 3.0);
      const estMins = state.activeDeliveryLifecycle.estimatedMinutes || 14;
      const platform =
        override?.platform ?? (state.activeDeliveryLifecycle.platform || 'Glovo');
      const originName =
        override?.originName ??
        (state.activeDeliveryLifecycle.originName ||
          'Pizzaria Tâmega — Centro');
      const destinationName =
        override?.destinationName ??
        (state.activeDeliveryLifecycle.destinationName ||
          'Freixo de Cima (Amarante)');

      setHasRealActiveDelivery(false);

      const realitySummary = buildEndOfDeliveryRealitySummary({
        netProfitEur: netEur,
        distanceKm: realKm,
        platform,
        routeLabel: `${originName} → ${destinationName}`,
      });

      const ttsMsg = realitySummary.spokenMessagePt;
      const macroText = "[Macro: Deslizar 'Entrega Concluída' na App]";
      const nowStr = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

    const completedTripLog: ShiftTripLog = {
      id: `REAL-SHF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      platform,
      segment: `${originName} → ${destinationName}`,
      grossEur,
      realKm,
      netProfitEur: netEur,
      netEurPerKm: Number((netEur / Math.max(0.1, realKm)).toFixed(2)),
      verdict: 'ACEITE',
    };
    setRealCompletedDeliveries((prev) => [completedTripLog, ...prev]);

    let milestoneReached: 50 | 75 | 100 | null = null;

    setState((prev) => {
      const goal = Math.max(1, prev.personalGoals.dailyNetGoalEur);
      const oldEarned = prev.personalGoals.currentDailyNetEarnedEur;
      const newEarned = Number((oldEarned + netEur).toFixed(2));
      const oldPct = (oldEarned / goal) * 100;
      const newPct = (newEarned / goal) * 100;

      if (oldPct < 100 && newPct >= 100) {
        milestoneReached = 100;
      } else if (oldPct < 75 && newPct >= 75) {
        milestoneReached = 75;
      } else if (oldPct < 50 && newPct >= 50) {
        milestoneReached = 50;
      }

      const handsFreeRewardEntry = {
        id: `RWD-HF-${Date.now()}`,
        timestamp: `Agora, ${nowStr}`,
        taskKey: 'BONUS_ENTREGA_HANDS_FREE_15' as RewardTaskKey,
        title: 'Bónus Entrega Hands-Free',
        pointsAwarded: 15,
        xpAwarded: 15,
      };

      const extraGoalCoins = milestoneReached === 100 ? 50 : 0;
      const extraGoalEntry =
        milestoneReached === 100
          ? [
              {
                id: `RWD-GOAL-${Date.now() + 1}`,
                timestamp: `Agora, ${nowStr}`,
                taskKey: 'BATER_META_DIARIA_50' as RewardTaskKey,
                title: `Bater a Meta Pessoal Diária (${goal.toFixed(2)} € Líquidos)`,
                pointsAwarded: 50,
                xpAwarded: 50,
              },
            ]
          : [];

      const curPlatLedger = prev.platformLedgers[platform];
      const updatedPlatLedger: PlatformFinancialLedger = {
        ...curPlatLedger,
        dailyGrossEur: Number(
          (curPlatLedger.dailyGrossEur + grossEur).toFixed(2)
        ),
        weeklyGrossEur: Number(
          (curPlatLedger.weeklyGrossEur + grossEur).toFixed(2)
        ),
        monthlyGrossEur: Number(
          (curPlatLedger.monthlyGrossEur + grossEur).toFixed(2)
        ),
        dailyNetEarnedEur: Number(
          (curPlatLedger.dailyNetEarnedEur + netEur).toFixed(2)
        ),
        weeklyNetEarnedEur: Number(
          (curPlatLedger.weeklyNetEarnedEur + netEur).toFixed(2)
        ),
        monthlyNetEarnedEur: Number(
          (curPlatLedger.monthlyNetEarnedEur + netEur).toFixed(2)
        ),
        completedDeliveriesToday: curPlatLedger.completedDeliveriesToday + 1,
        completedKmToday: Number(
          (curPlatLedger.completedKmToday + realKm).toFixed(1)
        ),
        completedKmWeek: Number(
          (curPlatLedger.completedKmWeek + realKm).toFixed(1)
        ),
        completedKmMonth: Number(
          (curPlatLedger.completedKmMonth + realKm).toFixed(1)
        ),
        hoursWorkedToday: Number(
          (curPlatLedger.hoursWorkedToday + estMins / 60).toFixed(2)
        ),
      };

      const shouldLearnDeliv = prev.aiAgentConfig?.continuousLearningEnabled;
      const passiveDeliveryLog: AiSkillLearningLogEntry | null = shouldLearnDeliv
        ? {
            id: `AI-PASSIVE-DELIV-${Date.now().toString().slice(-5)}`,
            timestamp: `Agora • ${nowStr}`,
            category: 'INTELIGENCIA_RUA_AMARANTE',
            platformOrApp: platform,
            skillTitle: `Aprendizagem Passiva (Entrega Concluída): ${originName} → ${destinationName} (+${netEur.toFixed(2)} € líq.)`,
            actionSequenceSummary: `Entrega finalizada em ${estMins} min (${realKm.toFixed(1)} km reais) em ecrã ${deviceScreenProfile.screenAspectRatio}. Telemetria de tempo de recolha e rota sincronizada para projeções horárias de Amarante.`,
            confidenceScorePct: 99.4,
            status: 'PRONTA_APROVACAO',
            learnedFromCourierTag: prev.verifiedAccount.courierName,
            zoneContext: `${originName} → ${destinationName}`,
            deviceModel: deviceScreenProfile.deviceModel,
            screenAspectRatio: deviceScreenProfile.screenAspectRatio,
            learningOrigin: 'PASSIVA_AUTOMATICA',
          }
        : null;

      return {
        ...prev,
        userOrderAvailabilityStatus: 'DISPONIVEL',
        shiftTrips: [completedTripLog, ...prev.shiftTrips],
        aiSkillLogs: passiveDeliveryLog
          ? [passiveDeliveryLog, ...prev.aiSkillLogs]
          : prev.aiSkillLogs,
        platformLedgers: {
          ...prev.platformLedgers,
          [platform]: updatedPlatLedger,
        },
        glovoWallet: {
          ...prev.glovoWallet,
          dailyGrossGlovoEur:
            platform === 'Glovo'
              ? Number(
                  (prev.glovoWallet.dailyGrossGlovoEur + grossEur).toFixed(2)
                )
              : prev.glovoWallet.dailyGrossGlovoEur,
        },
        taxAndFleetConfig: {
          ...prev.taxAndFleetConfig,
          glovoGrossEur:
            platform === 'Glovo'
              ? Number(
                  (prev.taxAndFleetConfig.glovoGrossEur + grossEur).toFixed(2)
                )
              : prev.taxAndFleetConfig.glovoGrossEur,
          uberGrossEur:
            platform === 'Uber Eats'
              ? Number(
                  (prev.taxAndFleetConfig.uberGrossEur + grossEur).toFixed(2)
                )
              : prev.taxAndFleetConfig.uberGrossEur,
          boltGrossEur:
            platform === 'Bolt Food'
              ? Number(
                  (prev.taxAndFleetConfig.boltGrossEur + grossEur).toFixed(2)
                )
              : prev.taxAndFleetConfig.boltGrossEur,
          totalKmDriven: Number(
            (prev.taxAndFleetConfig.totalKmDriven + realKm).toFixed(1)
          ),
        },
        personalGoals: {
          ...prev.personalGoals,
          currentDailyNetEarnedEur: newEarned,
          currentWeeklyNetEarnedEur: Number(
            (prev.personalGoals.currentWeeklyNetEarnedEur + netEur).toFixed(2)
          ),
          currentMonthlyNetEarnedEur: Number(
            (prev.personalGoals.currentMonthlyNetEarnedEur + netEur).toFixed(2)
          ),
          hoursWorkedToday: Number(
            (prev.personalGoals.hoursWorkedToday + estMins / 60).toFixed(2)
          ),
          completedDeliveriesToday:
            prev.personalGoals.completedDeliveriesToday + 1,
          completedKmToday: Number(
            ((prev.personalGoals.completedKmToday ?? 34.5) + realKm).toFixed(1)
          ),
          completedKmWeek: Number(
            ((prev.personalGoals.completedKmWeek ?? 212.0) + realKm).toFixed(1)
          ),
          completedKmMonth: Number(
            ((prev.personalGoals.completedKmMonth ?? 860.0) + realKm).toFixed(1)
          ),
        },
        buddyRewards: {
          ...prev.buddyRewards,
          buddyCoins: prev.buddyRewards.buddyCoins + 15 + extraGoalCoins,
          xpPoints: prev.buddyRewards.xpPoints + 15 + extraGoalCoins,
          actionHistory: [
            handsFreeRewardEntry,
            ...extraGoalEntry,
            ...prev.buddyRewards.actionHistory,
          ],
        },
        activeDeliveryLifecycle: {
          ...prev.activeDeliveryLifecycle,
          stage: 'CONCLUIDA',
          transitProgressPct: 100,
          lastMacroExecuted: macroText,
          lastVoiceTtsConfirmation: ttsMsg,
          completedAtTimestamp: nowStr,
        },
      };
    });

    if (milestoneReached === 100) {
      setLastGoalMilestoneBanner(
        '🏆 PARABÉNS! META DIÁRIA 100% ATINGIDA! Recebeste +50 BuddyCoins e +50 XP no BuddyRewards!'
      );
      triggerBubbleMilestoneAnimation('META_ATINGIDA');
    }

    speakTextPt(ttsMsg);
  }, [
    state.activeDeliveryLifecycle,
    speakTextPt,
    triggerBubbleMilestoneAnimation,
    deviceScreenProfile.deviceModel,
    deviceScreenProfile.screenAspectRatio,
  ]);

  // =========================================================================
  // STEP 11 & 12: PLATFORM-AWARE "DIVIDIR PEDIDO" SUPPORT MACRO (DYNAMIC KG!)
  // =========================================================================
  const triggerSupportSplitOrderMacro = useCallback(
    (platformOverride?: PlatformName) => {
      const detectedPlatform: PlatformName =
        platformOverride ||
        activeScannedOffer.platform ||
        state.activeDeliveryLifecycle.platform ||
        'Glovo';

      const orderId =
        activeScannedOffer.orderId ||
        state.activeDeliveryLifecycle.orderId ||
        `#410${activeScannedOffer.presetNumber || 1}`;
      // Fix Bug #3: Dynamically inject the real audited weight of the active order!
      const weightKg = Number(Math.max(2.4, totalAuditedWeightKg).toFixed(1));

      const { steps, autoPastedMessage } = buildSupportSplitStepsForPlatform(
        detectedPlatform,
        orderId,
        weightKg,
        state.touchCoordinatesMap
      );

      const nowStr = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const spokenPlatformName =
        detectedPlatform === 'Uber Eats'
          ? 'Uber'
          : detectedPlatform === 'Bolt Food'
            ? 'Bolt'
            : 'Glovo';

      const ttsMsg =
        detectedPlatform === 'Glovo'
          ? `Acionando suporte da Glovo para o pedido ${orderId} com ${weightKg.toFixed(1).replace('.', ' vírgula ')} quilos. Mensagem preenchida e enviada.`
          : `Acionando suporte da ${spokenPlatformName} para o pedido ${orderId} com ${weightKg.toFixed(1).replace('.', ' vírgula ')} quilos. Mensagem preenchida e enviada.`;

      setActiveSupportSplitMacro({
        isRunning: true,
        isCompleted: false,
        platform: detectedPlatform,
        orderId,
        totalWeightKg: weightKg,
        currentStepIndex: 0,
        steps,
        autoPastedMessage,
        triggeredAtTimestamp: nowStr,
      });

      setRealApiCallsCount((prev) => prev + 1);
      setState((prev) => {
        if (!prev.aiAgentConfig?.continuousLearningEnabled) return prev;
        const newSkillLog: AiSkillLearningLogEntry = {
          id: `AI-SKILL-MACRO-${Date.now().toString().slice(-5)}`,
          timestamp: `Agora • ${nowStr}`,
          category: 'SKILLS_TOQUE_UI',
          platformOrApp: detectedPlatform,
          skillTitle: `Skill Aprendida: Dividir Pedido Pesado (${weightKg.toFixed(1)} kg) — ${detectedPlatform}`,
          actionSequenceSummary: `Toque %X:${steps[0]?.xPct ?? 88} %Y:${steps[0]?.yPct ?? 14} (Suporte) → Selecionar Excesso de Peso (%X:${steps[2]?.xPct ?? 50} %Y:${steps[2]?.yPct ?? 54}) → Colar Texto (${orderId}) → Enviar (%X:${steps[3]?.xPct ?? 88} %Y:${steps[3]?.yPct ?? 92}).`,
          confidenceScorePct: 99.5,
          status: 'PRONTA_APROVACAO',
          learnedFromCourierTag: prev.verifiedAccount.courierName,
          zoneContext: activeScannedOffer.originName || 'Amarante Centro',
          deviceModel: deviceScreenProfile.deviceModel,
          screenAspectRatio: deviceScreenProfile.screenAspectRatio,
          learningOrigin: 'PASSIVA_AUTOMATICA',
        };
        return {
          ...prev,
          aiSkillLogs: [newSkillLog, ...prev.aiSkillLogs],
          aiAgentConfig: {
            ...prev.aiAgentConfig,
            dailyApiCallsUsed: Math.min(
              prev.aiAgentConfig.dailyApiCallsMax,
              prev.aiAgentConfig.dailyApiCallsUsed + 1
            ),
          },
        };
      });

      try {
        navigator.clipboard?.writeText(autoPastedMessage);
      } catch {
        // ignore clipboard permission error
      }

      speakTextPt(ttsMsg);

      // Simulate automated step-by-step screen taps (1 -> 2 -> 3 -> 4)
      setTimeout(() => {
        setActiveSupportSplitMacro((prev) => ({
          ...prev,
          currentStepIndex: 1,
        }));
      }, 320);

      setTimeout(() => {
        setActiveSupportSplitMacro((prev) => ({
          ...prev,
          currentStepIndex: 2,
        }));
      }, 640);

      setTimeout(() => {
        setActiveSupportSplitMacro((prev) => ({
          ...prev,
          isRunning: false,
          isCompleted: true,
          currentStepIndex: 3,
        }));
      }, 980);
    },
    [
      activeScannedOffer.platform,
      activeScannedOffer.orderId,
      activeScannedOffer.presetNumber,
      activeScannedOffer.originName,
      state.activeDeliveryLifecycle.platform,
      state.activeDeliveryLifecycle.orderId,
      state.touchCoordinatesMap,
      totalAuditedWeightKg,
      speakTextPt,
      deviceScreenProfile.deviceModel,
      deviceScreenProfile.screenAspectRatio,
    ]
  );

  const updateTouchCoordinatePoint = useCallback(
    (
      platform: 'Glovo' | 'Uber Eats',
      actionKey: TouchMacroActionKey,
      patch: Partial<
        Pick<
          TouchCoordinatePoint,
          'xPct' | 'yPct' | 'endXPct' | 'endYPct' | 'delayMs' | 'gestureType'
        >
      >
    ) => {
      setState((prev) => {
        const updatedList = prev.touchCoordinatesMap[platform].map((item) => {
          if (item.actionKey !== actionKey) return item;
          return {
            ...item,
            ...patch,
            xPct:
              patch.xPct !== undefined
                ? Math.max(0, Math.min(100, Math.round(patch.xPct)))
                : item.xPct,
            yPct:
              patch.yPct !== undefined
                ? Math.max(0, Math.min(100, Math.round(patch.yPct)))
                : item.yPct,
            endXPct:
              patch.endXPct !== undefined
                ? Math.max(0, Math.min(100, Math.round(patch.endXPct)))
                : item.endXPct,
            endYPct:
              patch.endYPct !== undefined
                ? Math.max(0, Math.min(100, Math.round(patch.endYPct)))
                : item.endYPct,
            delayMs:
              patch.delayMs !== undefined
              ? Math.max(50, Math.min(5000, Math.round(patch.delayMs)))
              : item.delayMs,
          };
        });
        return {
          ...prev,
          touchCoordinatesMap: {
            ...prev.touchCoordinatesMap,
            [platform]: updatedList,
          },
        };
      });
    },
    []
  );

  const resetTouchCoordinatesToDefault = useCallback(() => {
    setState((prev) => ({
      ...prev,
      touchCoordinatesMap: DEFAULT_TOUCH_COORDINATE_MAP,
    }));
  }, []);

  // =========================================================================
  // STEP 12: EPHEMERAL VOICE POP-UP ENGINE, 2-STEP SOS CONFIRMATION,
  // ZERO-PII LOCATION NOTES & SOCIAL BUDDYS BLOG
  // =========================================================================

  const stopAllLiveVoiceTimersAndRec = useCallback(() => {
    if (wordStreamTimerRef.current !== null) {
      window.clearInterval(wordStreamTimerRef.current);
      wordStreamTimerRef.current = null;
    }
    if (sendCountdownTimerRef.current !== null) {
      window.clearInterval(sendCountdownTimerRef.current);
      sendCountdownTimerRef.current = null;
    }
    if (watchdogRestartTimerRef.current !== null) {
      window.clearTimeout(watchdogRestartTimerRef.current);
      watchdogRestartTimerRef.current = null;
    }
    if (activeSpeechRecRef.current) {
      try {
        activeSpeechRecRef.current.onend = null;
        activeSpeechRecRef.current.onerror = null;
        activeSpeechRecRef.current.stop();
        activeSpeechRecRef.current.abort?.();
      } catch {
        // ignore
      }
      activeSpeechRecRef.current = null;
    }
    if (!keepVoiceListeningRef.current) {
      setIsListeningSpeechRecognition(false);
    }
    setIsPttActive(false);
  }, []);

  const animateWordStreamForCommand = useCallback(
    (
      phraseToStream: string,
      triggeredVia: 'PTT' | 'TRIGGER_WORD' | 'VOICE_COMMAND' = 'VOICE_COMMAND'
    ) => {
      if (wordStreamTimerRef.current !== null) {
        window.clearInterval(wordStreamTimerRef.current);
        wordStreamTimerRef.current = null;
      }
      if (sendCountdownTimerRef.current !== null) {
        window.clearInterval(sendCountdownTimerRef.current);
        sendCountdownTimerRef.current = null;
      }

      const cleaned = phraseToStream.replace(/^["“]|["”]$/g, '').trim();
      const words = cleaned.split(/\s+/).filter(Boolean);
      if (words.length === 0) return;

      let idx = 1;
      setLiveVoiceTranscription({
        isOpen: true,
        mode: 'COMANDO_BUDDY',
        phase: words.length === 1 ? 'COMMAND_ANSWER_CARD' : 'LISTENING_STREAMING',
        transcriptText: words[0],
        fullTargetText: cleaned,
        isEditingText: false,
        dictationTarget: null,
        sendCountdownSeconds: 0,
        sendCountdownProgressPct: 100,
        triggeredVia,
      });

      if (words.length <= 1) return;

      wordStreamTimerRef.current = window.setInterval(() => {
        idx += 1;
        const partial = words.slice(0, idx).join(' ');
        const isDone = idx >= words.length;

        setLiveVoiceTranscription((prev) => {
          if (!prev || !prev.isOpen) return prev;
          return {
            ...prev,
            transcriptText: partial,
            phase: isDone ? 'COMMAND_ANSWER_CARD' : 'LISTENING_STREAMING',
          };
        });

        if (isDone && wordStreamTimerRef.current !== null) {
          window.clearInterval(wordStreamTimerRef.current);
          wordStreamTimerRef.current = null;
        }
      }, 60);
    },
    []
  );

  const dismissEphemeralVoiceOverlay = useCallback(() => {
    stopAllLiveVoiceTimersAndRec();
    cancelSpeechNow();
    setSosPendingConfirmation({ isPending: false, secondsRemaining: 0 });
    setEphemeralVoiceOverlay(null);
    setLiveVoiceTranscription(null);
  }, [cancelSpeechNow, stopAllLiveVoiceTimersAndRec]);

  const triggerEphemeralOverlayCard = useCallback(
    (input: {
      cardCategory: EphemeralVoiceCardCategory;
      commandSpoken: string;
      title: string;
      subtitle: string;
      primaryMetricLabel: string;
      primaryMetricValue: string;
      secondaryDetails: string[];
      spokenTextPtBr: string;
    }) => {
      const configuredSeconds =
        state.alertPopupPrefs.durationMode === '3S'
          ? 3
          : state.alertPopupPrefs.durationMode === '10S'
            ? 10
            : state.alertPopupPrefs.durationMode === 'MANUAL'
              ? 999
              : 5;

      animateWordStreamForCommand(input.commandSpoken, 'VOICE_COMMAND');

      setEphemeralVoiceOverlay({
        isOpen: true,
        cardCategory: input.cardCategory,
        commandSpoken: input.commandSpoken,
        title: input.title,
        subtitle: input.subtitle,
        primaryMetricLabel: input.primaryMetricLabel,
        primaryMetricValue: input.primaryMetricValue,
        secondaryDetails: input.secondaryDetails,
        spokenTextPtBr: input.spokenTextPtBr,
        countdownSecondsLeft: configuredSeconds,
        wasTriggeredFromMinimized: state.isBubbleMinimized,
      });
      speakTextPt(input.spokenTextPtBr);
    },
    [
      state.isBubbleMinimized,
      state.alertPopupPrefs.durationMode,
      speakTextPt,
      animateWordStreamForCommand,
    ]
  );

  const cancelSosPendingConfirmation = useCallback(() => {
    setSosPendingConfirmation({ isPending: false, secondsRemaining: 0 });
  }, []);

  const requestOrConfirmSosActivation = useCallback(
    (emergencyType: EmergencySosType = 'Acidente na Via') => {
      if (sosPendingConfirmation.isPending && sosPendingConfirmation.secondsRemaining > 0) {
        // Step 2 confirmed! Activate the real SOS Open-Mic Beacon
        setSosPendingConfirmation({ isPending: false, secondsRemaining: 0 });
        triggerSosEmergencyBeacon(emergencyType);
        const confirmTts =
          'SOS confirmado! Microfone de emergência aberto e localização exata transmitida para os entregadores da zona.';
        speakTextPt(confirmTts);
        return;
      }

      // Step 1: Open mandatory 5-second confirmation window
      setSosPendingConfirmation({ isPending: true, secondsRemaining: 5 });
      const promptTts =
        "Confirmação de segurança obrigatória: Diga 'Confirmar SOS' ou toque novamente em até 5 segundos para abrir o microfone de emergência.";
      triggerEphemeralOverlayCard({
        cardCategory: 'SOS_CONFIRMACAO',
        commandSpoken: '"Ativar SOS"',
        title: 'Confirmação de Segurança SOS (2 Etapas)',
        subtitle: 'Prevenção contra ativação acidental no bolso / guiador',
        primaryMetricLabel: 'Janela de Confirmação',
        primaryMetricValue: '5 segundos',
        secondaryDetails: [
          'Diga "Confirmar SOS" ou toque novamente no botão SOS',
          'O microfone de emergência só abre após o 2.º comando',
        ],
        spokenTextPtBr: promptTts,
      });
    },
    [
      sosPendingConfirmation,
      triggerSosEmergencyBeacon,
      speakTextPt,
      triggerEphemeralOverlayCard,
    ]
  );

  const addLocationRouteNote = useCallback(
    (input: {
      streetOrZone: string;
      orderCodeRef?: string;
      category: LocationNoteCategory;
      noteText: string;
    }): LocationRouteNote => {
      const sanitizedOrderRef = input.orderCodeRef?.trim()
        ? input.orderCodeRef.trim().replace(/[^#0-9A-Za-z-]/g, '')
        : activeScannedOffer.orderId || '#4829';

      const newNote: LocationRouteNote = {
        id: `LOC-NOTE-${Date.now().toString().slice(-4)}`,
        streetOrZone:
          input.streetOrZone.trim() ||
          activeScannedOffer.destinationName ||
          'Rua 31 de Janeiro — Amarante Centro',
        orderCodeRef: sanitizedOrderRef,
        category: input.category,
        noteText: input.noteText.trim(),
        reportedBy: state.userPrefs.anonymousMode
          ? 'Estafeta Anónimo'
          : state.verifiedAccount.courierName,
        timestamp: 'Agora mesmo',
        confirmations: 1,
      };

      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      });

      setState((prev) => {
        const shouldLearn = prev.aiAgentConfig?.continuousLearningEnabled;
        const passiveNoteLog: AiSkillLearningLogEntry | null = shouldLearn
          ? {
              id: `AI-PASSIVE-NOTE-${Date.now().toString().slice(-5)}`,
              timestamp: `Agora • ${nowStr}`,
              category: 'INTELIGENCIA_RUA_AMARANTE',
              platformOrApp: activeScannedOffer.platform || 'Uber Eats',
              skillTitle: `Aprendizagem Passiva (Nota de Rua): ${newNote.streetOrZone} (${newNote.category})`,
              actionSequenceSummary: `Nota Zero-PII registada em ${newNote.streetOrZone} (${sanitizedOrderRef}): "${newNote.noteText}". Sincronizada com ecrã ${deviceScreenProfile.screenAspectRatio}.`,
              confidenceScorePct: 98.7,
              status: 'PRONTA_APROVACAO',
              learnedFromCourierTag: prev.verifiedAccount.courierName,
              zoneContext: newNote.streetOrZone,
              deviceModel: deviceScreenProfile.deviceModel,
              screenAspectRatio: deviceScreenProfile.screenAspectRatio,
              learningOrigin: 'PASSIVA_AUTOMATICA',
            }
          : null;
        return {
          ...prev,
          locationRouteNotes: [newNote, ...prev.locationRouteNotes],
          aiSkillLogs: passiveNoteLog
            ? [passiveNoteLog, ...prev.aiSkillLogs]
            : prev.aiSkillLogs,
        };
      });

      return newNote;
    },
    [
      activeScannedOffer.orderId,
      activeScannedOffer.destinationName,
      activeScannedOffer.platform,
      state.userPrefs.anonymousMode,
      state.verifiedAccount.courierName,
      deviceScreenProfile.deviceModel,
      deviceScreenProfile.screenAspectRatio,
    ]
  );

  const confirmLocationRouteNote = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      locationRouteNotes: prev.locationRouteNotes.map((n) =>
        n.id === id ? { ...n, confirmations: n.confirmations + 1 } : n
      ),
    }));
  }, []);

  const addSocialBuddyPost = useCallback(
    (input: {
      category: SocialBuddyPost['category'];
      content: string;
      zoneName?: string;
    }): SocialBuddyPost => {
      const newPost: SocialBuddyPost = {
        id: `POST-BUDDY-${Date.now().toString().slice(-4)}`,
        authorId: 'SELF-COURIER',
        authorCallsign: state.userPrefs.anonymousMode
          ? 'Buddy Anónimo'
          : state.verifiedAccount.courierName.split(' ')[0] + ' A.',
        authorVehicle: state.vehicleProfile.vehicleType,
        zoneName:
          input.zoneName || state.selectedRegionName || 'Amarante (25 km)',
        timestamp: 'Agora mesmo',
        category: input.category,
        content: input.content.trim(),
        likesCount: 1,
        likedByUser: true,
      };

      setState((prev) => ({
        ...prev,
        socialBuddyPosts: [newPost, ...prev.socialBuddyPosts],
      }));

      return newPost;
    },
    [
      state.userPrefs.anonymousMode,
      state.verifiedAccount.courierName,
      state.vehicleProfile.vehicleType,
      state.selectedRegionName,
    ]
  );

  const toggleLikeSocialBuddyPost = useCallback((postId: string) => {
    setState((prev) => ({
      ...prev,
      socialBuddyPosts: prev.socialBuddyPosts.map((p) => {
        if (p.id !== postId) return p;
        const nextLiked = !p.likedByUser;
        return {
          ...p,
          likedByUser: nextLiked,
          likesCount: Math.max(0, p.likesCount + (nextLiked ? 1 : -1)),
        };
      }),
    }));
  }, []);

  // =========================================================================
  // STEP 18: DEVICE FINGERPRINTING, DUAL-MODE AI LEARNING & HOURLY TELEMETRY
  // =========================================================================

  const updateDeviceScreenProfile = useCallback(
    (patch: Partial<DeviceScreenProfile>) => {
      setDeviceScreenProfile((prev) => {
        const nextW = patch.screenWidthPx ?? prev.screenWidthPx;
        const nextH = patch.screenHeightPx ?? prev.screenHeightPx;
        const nextRatio =
          patch.screenAspectRatio ??
          (patch.screenWidthPx !== undefined ||
          patch.screenHeightPx !== undefined
            ? calculateScreenAspectRatioTag(nextW, nextH)
            : prev.screenAspectRatio);
        return {
          ...prev,
          ...patch,
          screenWidthPx: nextW,
          screenHeightPx: nextH,
          screenAspectRatio: nextRatio,
          autoDetected: patch.autoDetected ?? false,
          lastUpdatedAt: new Date().toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
      });
    },
    []
  );

  const redetectDeviceScreenProfile = useCallback((): DeviceScreenProfile => {
    const detected = detectDeviceScreenProfile();
    setDeviceScreenProfile(detected);
    speakTextPt(
      `Modelo de telemóvel e ecrã detetados automaticamente: ${detected.deviceModel}, proporção ${detected.screenAspectRatio.replace(':', ' por ')}.`
    );
    return detected;
  }, [speakTextPt]);

  const startVoiceTeachSkillMode = useCallback(
    (
      taskTitle?: string,
      platformOrApp?: AiSkillLearningLogEntry['platformOrApp']
    ) => {
      const targetApp: AiSkillLearningLogEntry['platformOrApp'] =
        platformOrApp || activeScannedOffer.platform || 'Glovo';
      const cleanTask =
        taskTitle?.trim() ||
        `Aprender Caminho no Suporte (${targetApp})`;
      const nowTime = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const initialSteps = [
        `1. Toque %X:91 %Y:07 (Abrir Ajuda / Suporte ${targetApp} • Ecrã ${deviceScreenProfile.screenAspectRatio})`,
        `2. Toque %X:50 %Y:42 (Selecionar Opção: "${cleanTask}")`,
      ];

      setActiveSkillTeachingSession({
        isRecording: true,
        taskTitle: cleanTask,
        platformOrApp: targetApp,
        recordedSteps: initialSteps,
        startedAt: nowTime,
        deviceModel: deviceScreenProfile.deviceModel,
        screenAspectRatio: deviceScreenProfile.screenAspectRatio,
      });

      const tts = `Modo Gravação de Nova Skill IA ativado para ${cleanTask} no ecrã ${deviceScreenProfile.screenAspectRatio.replace(':', ' por ')}. Registe os toques na janela de 45 por cento e envie para o Gemini Pro.`;
      triggerEphemeralOverlayCard({
        cardCategory: 'GRAVACAO_SKILL_IA',
        commandSpoken: `"Buddy, aprender tarefa: ${cleanTask}"`,
        title: `Modo Gravação de Nova Skill IA (${targetApp})`,
        subtitle: `${deviceScreenProfile.deviceModel} • Tela ${deviceScreenProfile.screenAspectRatio} (${deviceScreenProfile.screenWidthPx}x${deviceScreenProfile.screenHeightPx})`,
        primaryMetricLabel: 'Tarefa em Gravação p/ Gemini Pro',
        primaryMetricValue: cleanTask,
        secondaryDetails: [
          `Proporção de Ecrã: ${deviceScreenProfile.screenAspectRatio} (Compatível com todos os colegas ${deviceScreenProfile.screenAspectRatio})`,
          'Adicione passos de toque abaixo e toque em "Enviar p/ Gemini Pro & Guardar Skill"',
        ],
        spokenTextPtBr: tts,
      });
    },
    [
      activeScannedOffer.platform,
      deviceScreenProfile.deviceModel,
      deviceScreenProfile.screenAspectRatio,
      deviceScreenProfile.screenWidthPx,
      deviceScreenProfile.screenHeightPx,
      triggerEphemeralOverlayCard,
    ]
  );

  const addTapStepToSkillTeachingSession = useCallback(
    (stepLabel: string) => {
      const cleanStep = stepLabel.trim();
      if (!cleanStep) return;
      setActiveSkillTeachingSession((prev) => {
        if (!prev) return prev;
        const nextNum = prev.recordedSteps.length + 1;
        const randX = Math.floor(24 + Math.random() * 64);
        const randY = Math.floor(28 + Math.random() * 60);
        const formatted = cleanStep.includes('%X:')
          ? `${nextNum}. ${cleanStep}`
          : `${nextNum}. Toque %X:${randX} %Y:${randY} (${cleanStep} • Tela ${prev.screenAspectRatio})`;
        return {
          ...prev,
          recordedSteps: [...prev.recordedSteps, formatted],
        };
      });
    },
    []
  );

  const completeAndSaveVoiceTaughtSkill = useCallback(
    async (customNotes?: string): Promise<AiSkillLearningLogEntry | null> => {
      if (!activeSkillTeachingSession) return null;
      const session = activeSkillTeachingSession;
      const stepsToSynthesize = customNotes?.trim()
        ? [
            ...session.recordedSteps,
            `${session.recordedSteps.length + 1}. Nota do Estafeta: ${customNotes.trim()}`,
          ]
        : session.recordedSteps;

      const synth = await synthesizeAiSkillWithGemini({
        apiKey: state.aiAgentConfig.geminiApiKey,
        selectedGeminiModel: state.aiAgentConfig.selectedGeminiModel,
        customExperimentalModelId:
          state.aiAgentConfig.customExperimentalModelId,
        taskName: session.taskTitle,
        platformOrApp: session.platformOrApp,
        recordedTaps: stepsToSynthesize,
        deviceModel: deviceScreenProfile.deviceModel,
        screenAspectRatio: deviceScreenProfile.screenAspectRatio,
      });

      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const newSkillEntry: AiSkillLearningLogEntry = {
        id: `AI-VOICE-SKILL-${Date.now().toString().slice(-5)}`,
        timestamp: `Agora • ${nowStr}`,
        category: 'SKILLS_TOQUE_UI',
        platformOrApp: session.platformOrApp,
        skillTitle: synth.skillTitle,
        actionSequenceSummary: synth.actionSequenceSummary,
        confidenceScorePct: synth.confidenceScorePct,
        status: 'PUBLICADA_OTA',
        learnedFromCourierTag: state.verifiedAccount.courierName,
        zoneContext:
          activeScannedOffer.originName || 'Amarante Centro (25 km)',
        deviceModel: deviceScreenProfile.deviceModel,
        screenAspectRatio: deviceScreenProfile.screenAspectRatio,
        learningOrigin: 'ENSINO_VOZ_GUIADO',
      };

      setRealApiCallsCount((c) => c + 1);
      setState((prev) => ({
        ...prev,
        aiSkillLogs: [newSkillEntry, ...prev.aiSkillLogs],
        aiAgentConfig: {
          ...prev.aiAgentConfig,
          dailyApiCallsUsed: Math.min(
            prev.aiAgentConfig.dailyApiCallsMax,
            prev.aiAgentConfig.dailyApiCallsUsed + 1
          ),
        },
      }));

      void insertAiSkillLogToSupabaseRest({
        supabaseUrl: state.aiAgentConfig.supabaseUrl,
        supabaseAnonKey: state.aiAgentConfig.supabaseAnonKey,
        entry: newSkillEntry,
        modelUsed: state.aiAgentConfig.activeResolvedModelName,
      });

      setActiveSkillTeachingSession(null);
      setEphemeralVoiceOverlay(null);

      speakTextPt(
        `Nova Skill ensinada por voz sintetizada pelo motor ${state.aiAgentConfig.activeResolvedModelName} e publicada via OTA para todos os telemóveis com proporção ${deviceScreenProfile.screenAspectRatio.replace(':', ' por ')}!`
      );

      return newSkillEntry;
    },
    [
      activeSkillTeachingSession,
      state.aiAgentConfig.geminiApiKey,
      state.aiAgentConfig.selectedGeminiModel,
      state.aiAgentConfig.customExperimentalModelId,
      state.verifiedAccount.courierName,
      deviceScreenProfile,
      activeScannedOffer.originName,
      speakTextPt,
    ]
  );

  const cancelVoiceTeachSkillMode = useCallback(() => {
    setActiveSkillTeachingSession(null);
    setEphemeralVoiceOverlay((prev) =>
      prev?.cardCategory === 'GRAVACAO_SKILL_IA' ? null : prev
    );
  }, []);

  const marketTelemetry = useMemo<GlobalMarketTelemetrySummary>(() => {
    const isProd = Boolean(state.aiAgentConfig.productionModeRealOnly);
    const nowDate = new Date();
    const curHour = nowDate.getHours();
    const padHour = (h: number) => String(((h % 24) + 24) % 24).padStart(2, '0');
    const currentHourWindowLabel = `${padHour(curHour)}h–${padHour(curHour + 1)}h`;

    const mockCourierNames = [
      'Tiago R.',
      'Carlos M.',
      'Inês V.',
      'Rui S.',
      'Rui K.',
      'Rui Moto',
      'Filipe T.',
      'Bruno Costa',
      'André F.',
      'Miguel P.',
      'Sofia L.',
    ];

    const activeRemotePeers = supabaseLiveCouriers.filter((r) => {
      if (!r.name || !r.name.trim()) return false;
      if (realCourierProfile && r.id === realCourierProfile.id) return false;
      const rLower = r.name.trim().toLowerCase();
      if (rLower === 'caio m.' || rLower === 'caio m' || rLower === 'cm') {
        return false;
      }
      const updatedMs = r.updated_at ? Date.parse(r.updated_at) : 0;
      return (
        Number.isFinite(updatedMs) &&
        Date.now() - updatedMs <= 2 * 60 * 60 * 1000
      );
    });

    const directoryCouriers = isProd
      ? activeRemotePeers.map((r) => ({
          id: r.id,
          callsign: r.name,
          orderStatus: (r.has_order ||
          r.status === 'Ocupado' ||
          r.status === 'OCUPADO_COM_PEDIDO'
            ? 'OCUPADO_COM_PEDIDO'
            : 'DISPONIVEL') as CourierOrderAvailabilityStatus,
        }))
      : state.onlineDirectoryCouriers.filter(
          (c) =>
            c.isOnlineActive !== false &&
            !c.isSelfProfile &&
            (!realCourierProfile || c.id !== realCourierProfile.id)
        );

    const selfOnline =
      Boolean(
        realCourierProfile?.isRegistered &&
          realCourierProfile.name.trim().length > 0 &&
          !state.isAppPaused
      )
        ? 1
        : 0;
    const selfFree =
      selfOnline && state.userOrderAvailabilityStatus === 'DISPONIVEL' ? 1 : 0;
    const selfBusy =
      selfOnline && state.userOrderAvailabilityStatus === 'OCUPADO_COM_PEDIDO'
        ? 1
        : 0;

    const dirFree = directoryCouriers.filter(
      (c) => c.orderStatus === 'DISPONIVEL'
    ).length;
    const dirBusy = directoryCouriers.filter(
      (c) => c.orderStatus === 'OCUPADO_COM_PEDIDO'
    ).length;

    const onlineCouriersNow = directoryCouriers.length + selfOnline;
    const freeCouriersNow = dirFree + selfFree;
    const busyCouriersNow = dirBusy + selfBusy;

    const sameHourSnapshots = marketHourlySnapshots.filter(
      (s) => s.hourOfDay === curHour
    );
    const historicalAvgCouriersForCurrentHour =
      sameHourSnapshots.length > 0
        ? Number(
            (
              sameHourSnapshots.reduce((a, b) => a + b.onlineCouriers, 0) /
              sameHourSnapshots.length
            ).toFixed(1)
          )
        : isProd
          ? Number(onlineCouriersNow.toFixed(1))
          : 7.5;

    const sourceTrips = isProd
      ? realCompletedDeliveries.filter((d) => d.verdict === 'ACEITE')
      : state.shiftTrips.filter((d) => d.verdict === 'ACEITE');

    const totalDeliveries = sourceTrips.length;
    const avgGrossDeliveryEur =
      totalDeliveries > 0
        ? Number(
            (
              sourceTrips.reduce((a, b) => a + b.grossEur, 0) / totalDeliveries
            ).toFixed(2)
          )
        : isProd
          ? 0
          : 6.45;

    const avgNetDeliveryEur =
      totalDeliveries > 0
        ? Number(
            (
              sourceTrips.reduce((a, b) => a + b.netProfitEur, 0) /
              totalDeliveries
            ).toFixed(2)
          )
        : isProd
          ? 0
          : 5.82;

    const avgOrdersPerHourPerCourier =
      totalDeliveries > 0
        ? Number(
            Math.min(
              5.5,
              Math.max(1.2, totalDeliveries / Math.max(1, totalDeliveries * 0.38))
            ).toFixed(1)
          )
        : sameHourSnapshots.length > 0
          ? Number(
              (
                sameHourSnapshots.reduce((a, b) => a + b.ordersPerHour, 0) /
                sameHourSnapshots.length
              ).toFixed(1)
            )
          : isProd
            ? 0
            : 2.6;

    const avgHourlyPaceEur =
      totalDeliveries > 0
        ? Number((avgNetDeliveryEur * avgOrdersPerHourPerCourier).toFixed(2))
        : isProd
          ? 0
          : 16.8;

    const computePlatEurPerKm = (
      plat: PlatformName,
      demoFallback: number
    ): number => {
      const platTrips = sourceTrips.filter((t) => t.platform === plat);
      if (platTrips.length > 0) {
        const sumNet = platTrips.reduce((a, b) => a + b.netProfitEur, 0);
        const sumKm = platTrips.reduce((a, b) => a + Math.max(0.1, b.realKm), 0);
        return Number((sumNet / Math.max(0.1, sumKm)).toFixed(2));
      }
      return isProd ? 0 : demoFallback;
    };

    const uberRate = computePlatEurPerKm('Uber Eats', 1.92);
    const glovoRate = computePlatEurPerKm('Glovo', 1.78);
    const boltRate = computePlatEurPerKm('Bolt Food', 1.74);

    const globalRate =
      totalDeliveries > 0
        ? Number(
            (
              sourceTrips.reduce((a, b) => a + b.netProfitEur, 0) /
              Math.max(
                0.1,
                sourceTrips.reduce((a, b) => a + Math.max(0.1, b.realKm), 0)
              )
            ).toFixed(2)
          )
        : isProd
          ? 0
          : 1.84;

    const hasRealData =
      !isProd || totalDeliveries > 0 || marketHourlySnapshots.length > 0;

    const buildHourProjection = (
      offsetHours: number
    ): MarketNext3HoursProjection => {
      const h = (curHour + offsetHours) % 24;
      const windowLabel = `${padHour(h)}h–${padHour(h + 1)}h`;
      const isPeakDinner = h >= 19 && h <= 22;
      const isPeakLunch = h >= 12 && h <= 14;
      const realisticProdSaturation = Math.min(
        92,
        Math.max(8, onlineCouriersNow * 12)
      );

      if (!hasRealData) {
        return {
          hourLabel: windowLabel,
          demandLevel: 'MODERADA',
          demandLabel: 'A aguardar 1ª leitura real',
          saturationPct: realisticProdSaturation,
          expectedOnlineCouriers: onlineCouriersNow,
          projectedOrdersPerHour: 0,
          projectedEurPerKm: 0,
          confidenceNote:
            'Modo Produção Real: A aguardar 1ª leitura real de ofertas/entregas em Amarante',
        };
      }

      const baseOrders =
        avgOrdersPerHourPerCourier > 0 ? avgOrdersPerHourPerCourier : 2.4;
      const baseRate = globalRate > 0 ? globalRate : 1.78;
      const mult = isPeakDinner ? 1.28 : isPeakLunch ? 1.2 : 1.04;
      const expectedCouriers = isProd
        ? Math.max(1, onlineCouriersNow)
        : Math.max(
            1,
            Math.round(
              (onlineCouriersNow || 6) *
                (isPeakDinner ? 1.25 : isPeakLunch ? 1.15 : 1.0)
            )
          );

      return {
        hourLabel: windowLabel,
        demandLevel: isPeakDinner
          ? 'PICO_ALTA'
          : isPeakLunch
            ? 'ALTA'
            : 'MODERADA',
        demandLabel:
          isPeakDinner || isPeakLunch ? 'Alta Demanda' : 'Moderada',
        saturationPct: isProd
          ? realisticProdSaturation
          : isPeakDinner
            ? 78
            : isPeakLunch
              ? 72
              : 58,
        expectedOnlineCouriers: expectedCouriers,
        projectedOrdersPerHour: Number((baseOrders * mult).toFixed(1)),
        projectedEurPerKm: Number(
          (baseRate * (isPeakDinner ? 1.12 : 1.03)).toFixed(2)
        ),
        confidenceNote: isPeakDinner
          ? 'Pico de Jantar em Amarante Centro & São Gonçalo'
          : isPeakLunch
            ? 'Pico de Almoço • Procura elevada em restaurantes'
            : 'Fluxo regular projetado p/ raio 25 km',
      };
    };

    const next3HoursProjections = [
      buildHourProjection(1),
      buildHourProjection(2),
      buildHourProjection(3),
    ];

    const shiftRecommendationText = !hasRealData
      ? 'Modo Produção Real Ativo: As projeções horárias iniciarão automaticamente após o 1.º print/entrega registado ou snapshot gravado em Amarante.'
      : `Turno recomendado em Amarante Centro / São Gonçalo: ritmo projetado de ${next3HoursProjections[0].projectedOrdersPerHour.toFixed(1)} ped/h a ${next3HoursProjections[0].projectedEurPerKm.toFixed(2)} €/km (${marketHourlySnapshots.length} snapshots acumulados).`;

    return {
      currentHourWindowLabel,
      onlineCouriersNow,
      freeCouriersNow,
      busyCouriersNow,
      historicalAvgCouriersForCurrentHour,
      hourlyAvgOnlineCouriers: historicalAvgCouriersForCurrentHour,
      avgOrdersPerHourPerCourier,
      avgGrossDeliveryEur,
      avgNetDeliveryEur,
      avgGrossPerDeliveryEur: avgGrossDeliveryEur,
      avgNetPerDeliveryEur: avgNetDeliveryEur,
      avgHourlyPaceEur,
      liveEurPerKm: {
        global: globalRate,
        uberEats: uberRate,
        glovo: glovoRate,
        boltFood: boltRate,
      },
      liveEurPerKmByScope: {
        GLOBAL_CRUZADO: globalRate,
        'Uber Eats': uberRate,
        Glovo: glovoRate,
        'Bolt Food': boltRate,
      },
      next3HoursProjections,
      shiftRecommendationText,
      totalSnapshotsRecorded: marketHourlySnapshots.length,
      snapshotsRecordedCount: marketHourlySnapshots.length,
      isProductionCleanBaseline: !hasRealData,
    };
  }, [
    state.aiAgentConfig.productionModeRealOnly,
    state.onlineDirectoryCouriers,
    state.isAuthenticated,
    state.isAppPaused,
    state.userOrderAvailabilityStatus,
    state.shiftTrips,
    realCompletedDeliveries,
    marketHourlySnapshots,
    realCourierProfile,
    supabaseLiveCouriers,
  ]);

  const recordMarketTelemetrySnapshot = useCallback(
    (_triggerSource = 'MANUAL_OR_VOICE'): MarketHourlySnapshot => {
      const now = new Date();
      const snapshot: MarketHourlySnapshot = {
        id: `MKT-SNAP-${Date.now().toString().slice(-5)}`,
        timestamp: now.toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        hourOfDay: now.getHours(),
        dayOfWeek: now.getDay(),
        onlineCouriers: marketTelemetry.onlineCouriersNow,
        freeCouriers: marketTelemetry.freeCouriersNow,
        busyCouriers: marketTelemetry.busyCouriersNow,
        ordersPerHour:
          marketTelemetry.avgOrdersPerHourPerCourier > 0
            ? marketTelemetry.avgOrdersPerHourPerCourier
            : 1.5,
        avgDeliveryEuro:
          marketTelemetry.avgNetDeliveryEur > 0
            ? marketTelemetry.avgNetDeliveryEur
            : activeScannedOffer.grossAmountEur || 5.5,
        avgEuroPerKm:
          marketTelemetry.liveEurPerKm.global > 0
            ? marketTelemetry.liveEurPerKm.global
            : Number(
                (
                  (activeScannedOffer.grossAmountEur || 5.5) /
                  Math.max(0.5, activeScannedOffer.appAnnouncedKm || 3.0)
                ).toFixed(2)
              ),
        platformBreakdownEurPerKm: {
          'Uber Eats':
            marketTelemetry.liveEurPerKm.uberEats ||
            (activeScannedOffer.platform === 'Uber Eats' ? 1.85 : 0),
          Glovo:
            marketTelemetry.liveEurPerKm.glovo ||
            (activeScannedOffer.platform === 'Glovo' ? 1.75 : 0),
          'Bolt Food':
            marketTelemetry.liveEurPerKm.boltFood ||
            (activeScannedOffer.platform === 'Bolt Food' ? 1.7 : 0),
        },
      };

      setMarketHourlySnapshots((prev) => [snapshot, ...prev.slice(0, 47)]);
      return snapshot;
    },
    [
      marketTelemetry,
      activeScannedOffer.grossAmountEur,
      activeScannedOffer.appAnnouncedKm,
      activeScannedOffer.platform,
    ]
  );

  // =========================================================================
  // STEP 19: REAL COURIER REGISTRATION, LIVE GPS & SUPABASE `couriers` SYNC
  // =========================================================================

  const gpsWatchIdRef = useRef<number | null>(null);
  const realCourierProfileRef = useRef<RealCourierMapProfile>(realCourierProfile);
  useEffect(() => {
    realCourierProfileRef.current = realCourierProfile;
  }, [realCourierProfile]);

  const syncProfileToSupabaseAndLocalCache = useCallback(
    async (profileToSync: RealCourierMapProfile) => {
      if (!profileToSync.isRegistered || !profileToSync.name.trim()) {
        return {
          ok: false,
          statusText:
            'Registe o seu perfil neste telemóvel para entrar online no Mapa',
        };
      }

      const enrichedProfile: RealCourierMapProfile = {
        ...profileToSync,
        device_model:
          profileToSync.device_model || deviceScreenProfile.deviceModel,
        screen_aspect_ratio:
          profileToSync.screen_aspect_ratio ||
          deviceScreenProfile.screenAspectRatio,
      };

      const upsertRes = await upsertCourierToSupabaseRest({
        supabaseUrl: state.aiAgentConfig.supabaseUrl,
        supabaseAnonKey: state.aiAgentConfig.supabaseAnonKey,
        profile: enrichedProfile,
      });

      const nowTime = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const syncedRow: SupabaseCourierRow = upsertRes.row || {
        id: enrichedProfile.id,
        name: enrichedProfile.name,
        vehicle: enrichedProfile.vehicle,
        status: enrichedProfile.status,
        has_order: enrichedProfile.has_order,
        lat: enrichedProfile.lat,
        lng: enrichedProfile.lng,
        zone: enrichedProfile.zone,
        reputation: enrichedProfile.reputation || 100,
        buddy_since: enrichedProfile.buddy_since || 'Fundador • Out 2026',
        updated_at: new Date().toISOString(),
        avatar_url: enrichedProfile.avatar_url,
        active_platforms: enrichedProfile.active_platforms,
        device_model: enrichedProfile.device_model,
        screen_aspect_ratio: enrichedProfile.screen_aspect_ratio,
      };

      setSupabaseLiveCouriers((prev) => {
        const withoutSelf = prev.filter((r) => r.id !== syncedRow.id);
        return [syncedRow, ...withoutSelf];
      });

      setRealCourierProfile((prev) => ({
        ...prev,
        lastSyncedSupabaseAt: nowTime,
        supabaseSyncStatusText: upsertRes.statusText,
      }));

      return upsertRes;
    },
    [state.aiAgentConfig.supabaseUrl, state.aiAgentConfig.supabaseAnonKey]
  );

  const hasHighAccuracyGpsFixRef = useRef<boolean>(false);
  const lastHighAccuracyGpsFixMsRef = useRef<number>(0);

  const applyLiveDeviceGpsFix = useCallback(
    (rawLat: number, rawLng: number, accuracy?: number) => {
      if (
        !Number.isFinite(rawLat) ||
        !Number.isFinite(rawLng) ||
        (rawLat === 0 && rawLng === 0)
      ) {
        return;
      }

      const nowMs = Date.now();
      const isHighAcc =
        typeof accuracy === 'number' &&
        Number.isFinite(accuracy) &&
        accuracy > 0 &&
        accuracy <= 40;

      if (isHighAcc) {
        hasHighAccuracyGpsFixRef.current = true;
        lastHighAccuracyGpsFixMsRef.current = nowMs;
      } else if (
        hasHighAccuracyGpsFixRef.current &&
        nowMs - lastHighAccuracyGpsFixMsRef.current < 60000 &&
        typeof accuracy === 'number' &&
        accuracy > 45
      ) {
        // Once a high-accuracy GPS fix is active, ignore coarse cell-tower / network jumps!
        return;
      }

      setRealCourierProfile((prev) => {
        if (
          prev.gpsSource === 'LIVE_GPS' &&
          Number.isFinite(prev.lat) &&
          Number.isFinite(prev.lng)
        ) {
          const dLatRad = ((rawLat - prev.lat) * Math.PI) / 180;
          const dLngRad = ((rawLng - prev.lng) * Math.PI) / 180;
          const a =
            Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
            Math.cos((prev.lat * Math.PI) / 180) *
              Math.cos((rawLat * Math.PI) / 180) *
              Math.sin(dLngRad / 2) *
              Math.sin(dLngRad / 2);
          const distMeters =
            6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          // 10-meter minimum movement filter (deadband) to prevent pin jitter
          if (distMeters < 10) {
            return prev;
          }
        }

        const updated: RealCourierMapProfile = {
          ...prev,
          lat: Number(rawLat.toFixed(6)),
          lng: Number(rawLng.toFixed(6)),
          gpsSource: 'LIVE_GPS',
          updated_at: new Date().toISOString(),
        };
        if (updated.isRegistered && updated.name.trim().length > 0) {
          try {
            localStorage.setItem(
              REAL_COURIER_MAP_PROFILE_STORAGE_KEY,
              JSON.stringify(updated)
            );
          } catch {
            // ignore
          }
        }
        return updated;
      });
    },
    []
  );

  // Listen to native Android LocationManager bridge (window.onNativeLocationUpdate)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const winAny = window as unknown as {
      onNativeLocationUpdate?: (
        lat: number,
        lng: number,
        accuracy?: number,
        speed?: number
      ) => void;
      BuddyNativeOverlay?: {
        requestImmediateNativeGpsFix?: () => void;
      };
    };
    winAny.onNativeLocationUpdate = (
      lat: number,
      lng: number,
      accuracy?: number,
      speed?: number
    ) => {
      applyLiveDeviceGpsFix(Number(lat), Number(lng), Number(accuracy ?? 12));
      try {
        window.dispatchEvent(
          new CustomEvent('buddy-native-location', {
            detail: {
              lat: Number(lat),
              lng: Number(lng),
              accuracy: Number(accuracy ?? 12),
              speed: Number(speed ?? 0),
            },
          })
        );
      } catch {
        // ignore
      }
    };
    try {
      winAny.BuddyNativeOverlay?.requestImmediateNativeGpsFix?.();
    } catch {
      // ignore
    }
    return () => {
      if (winAny.onNativeLocationUpdate) {
        delete winAny.onNativeLocationUpdate;
      }
    };
  }, [applyLiveDeviceGpsFix]);

  // Request live device coordinates via Native Android bridge + Dual Network (<1s) + High-Accuracy GPS
  const startOrRefreshGeolocationWatch = useCallback(
    (targetZone?: AmaranteBaseZoneOption) => {
      const zoneKey =
        targetZone ||
        realCourierProfileRef.current.zone ||
        'Amarante Centro / São Gonçalo';
      const fallbackCoords =
        AMARANTE_ZONE_COORDS_MAP[zoneKey] || AMARANTE_DEFAULT_COORDS;

      if (typeof window !== 'undefined') {
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
      }

      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        return;
      }

      try {
        // 1. Instant Network/Wi-Fi Location Fix ONLY if no GPS fix exists yet
        if (realCourierProfileRef.current.gpsSource !== 'LIVE_GPS') {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              applyLiveDeviceGpsFix(
                pos.coords.latitude,
                pos.coords.longitude,
                pos.coords.accuracy
              );
            },
            () => {
              // ignore and wait for GPS
            },
            {
              enableHighAccuracy: false,
              timeout: 3000,
              maximumAge: 60000,
            }
          );
        }

        // 2. High-Accuracy Satellite GPS One-Shot
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            applyLiveDeviceGpsFix(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.accuracy
            );
          },
          () => {
            // Keep waiting for watchPosition or native GPS fix; never overwrite a LIVE_GPS fix
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 2000,
          }
        );

        if (gpsWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(gpsWatchIdRef.current);
          gpsWatchIdRef.current = null;
        }

        // 3. Continuous High-Accuracy GPS Watch
        gpsWatchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            applyLiveDeviceGpsFix(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.accuracy
            );
          },
          () => {
            if (realCourierProfileRef.current.gpsSource !== 'LIVE_GPS') {
              try {
                navigator.geolocation.getCurrentPosition(
                  (netPos) => {
                    applyLiveDeviceGpsFix(
                      netPos.coords.latitude,
                      netPos.coords.longitude,
                      netPos.coords.accuracy
                    );
                  },
                  () => {
                    setRealCourierProfile((prev) => {
                      if (prev.gpsSource === 'LIVE_GPS') return prev;
                      return {
                        ...prev,
                        lat: fallbackCoords.lat,
                        lng: fallbackCoords.lng,
                        gpsSource: 'AMARANTE_FALLBACK',
                        updated_at: new Date().toISOString(),
                      };
                    });
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
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 2000,
          }
        );
      } catch {
        // ignore
      }
    },
    [applyLiveDeviceGpsFix]
  );

  useEffect(() => {
    startOrRefreshGeolocationWatch(realCourierProfile.zone);
    return () => {
      if (
        gpsWatchIdRef.current !== null &&
        typeof navigator !== 'undefined' &&
        'geolocation' in navigator
      ) {
        try {
          navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, [startOrRefreshGeolocationWatch, realCourierProfile.zone]);

  const refreshLiveGpsPosition = useCallback(async () => {
    startOrRefreshGeolocationWatch(realCourierProfileRef.current.zone);
    const updated: RealCourierMapProfile = {
      ...realCourierProfileRef.current,
      updated_at: new Date().toISOString(),
    };
    setRealCourierProfile(updated);
    await syncProfileToSupabaseAndLocalCache(updated);
  }, [startOrRefreshGeolocationWatch, syncProfileToSupabaseAndLocalCache]);

  // Dynamic 3-State Robot Mascot & Floating Bubble Resting Preset
  const [buddyMascotImages, setBuddyMascotImages] =
    useState<BuddyMascotImagesSet>(() => loadSavedMascotImages());

  const [bubbleRestingPreset, setBubbleRestingPresetState] =
    useState<BubbleRestingPreset>(() => loadSavedBubbleRestingPreset());

  const currentMascotState = useMemo<BuddyMascotState>(() => {
    if (state.isAppPaused || Boolean(state.userPrefs?.anonymousMode)) {
      return 'INACTIVE';
    }
    if (
      !activeScannedOffer.id.startsWith('PRESET-') ||
      hasRealActiveDelivery ||
      isOfferAccepted ||
      state.userOrderAvailabilityStatus === 'OCUPADO_COM_PEDIDO'
    ) {
      return 'DELIVERY';
    }
    return 'ACTIVE';
  }, [
    state.isAppPaused,
    state.userPrefs?.anonymousMode,
    activeScannedOffer.id,
    hasRealActiveDelivery,
    isOfferAccepted,
    state.userOrderAvailabilityStatus,
  ]);

  const currentMascotImageUrl = useMemo<string>(() => {
    if (currentMascotState === 'INACTIVE') {
      return buddyMascotImages.mascotInactive;
    }
    if (currentMascotState === 'DELIVERY') {
      return buddyMascotImages.mascotDelivery;
    }
    return buddyMascotImages.mascotActive;
  }, [buddyMascotImages, currentMascotState]);

  useEffect(() => {
    syncMascotImagesToNativeBridge(buddyMascotImages);
  }, [buddyMascotImages]);

  useEffect(() => {
    syncMascotStateToNativeBridge(currentMascotState);
  }, [currentMascotState]);

  useEffect(() => {
    syncBubbleRestingPresetToNativeBridge(bubbleRestingPreset);
  }, [bubbleRestingPreset]);

  const [mascotSyncId] = useState<string>(() => getOrCreateMascotSyncId());
  const lastCloudMascotBatchTsRef = useRef<number>(Date.now() - 10 * 60 * 1000);

  const applyCustomMascotImagesSet = useCallback(
    (images: BuddyMascotImagesSet) => {
      saveMascotImagesToStorage(images);
      setBuddyMascotImages(images);
      syncMascotImagesToNativeBridge(images);
      playBuddyConfirmationChime();
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(
            new CustomEvent('buddy-mascot-cloud-synced', {
              detail: { images },
            })
          );
        } catch {
          // ignore
        }
      }
    },
    []
  );

  const uploadThreePoseMascotSheet = useCallback(
    async (file: File | Blob) => {
      const sliced = await sliceThreePoseMascotSheetFile(file);
      applyCustomMascotImagesSet(sliced);
    },
    [applyCustomMascotImagesSet]
  );

  const uploadThreePoseMascotSheetFromDataUrl = useCallback(
    async (dataUrl: string) => {
      const sliced = await sliceThreePoseMascotSheetFromDataUrl(dataUrl);
      applyCustomMascotImagesSet(sliced);
      return sliced;
    },
    [applyCustomMascotImagesSet]
  );

  // Automatic Real-Time Cloud Bridge Poller (Syncs 3-pose mascot uploaded in External Chrome -> App)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.search.includes('upload_mascot=1')) return;

    let mounted = true;
    const checkCloudBridge = async () => {
      if (!mounted) return;
      const synced = await pollMascotImagesFromCloudBridge(
        mascotSyncId,
        lastCloudMascotBatchTsRef
      );
      if (mounted && synced) {
        applyCustomMascotImagesSet(synced);
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible' || activeTab === 'menu_mais') {
        void checkCloudBridge();
      }
    }, 3500);

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        void checkCloudBridge();
      }
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [mascotSyncId, activeTab, applyCustomMascotImagesSet]);

  const resetMascotImagesToBuiltin = useCallback(() => {
    const builtin = clearCustomMascotImagesFromStorage();
    setBuddyMascotImages(builtin);
    syncMascotImagesToNativeBridge(builtin);
  }, []);

  const setBubbleRestingPreset = useCallback((preset: BubbleRestingPreset) => {
    setBubbleRestingPresetState(preset);
    saveBubbleRestingPreset(preset);
    syncBubbleRestingPresetToNativeBridge(preset);
    playBuddyConfirmationChime();
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('buddy-snap-bubble-preset', {
            detail: { preset },
          })
        );
      } catch {
        // ignore
      }
    }
  }, []);

  const setActivePlatforms = useCallback(
    (platforms: PlatformName[]) => {
      const valid = platforms.filter(
        (p): p is PlatformName =>
          p === 'Uber Eats' || p === 'Glovo' || p === 'Bolt Food'
      );
      const nextPlatforms: PlatformName[] =
        valid.length > 0 ? valid : ['Uber Eats'];
      setActivePlatformsState(nextPlatforms);
      const updated: RealCourierMapProfile = {
        ...realCourierProfileRef.current,
        active_platforms: nextPlatforms,
        updated_at: new Date().toISOString(),
      };
      setRealCourierProfile(updated);
      try {
        localStorage.setItem(
          ACTIVE_PLATFORMS_STORAGE_KEY,
          JSON.stringify(nextPlatforms)
        );
      } catch {
        // ignore
      }
      void syncProfileToSupabaseAndLocalCache(updated);
    },
    [syncProfileToSupabaseAndLocalCache]
  );

  const toggleActivePlatform = useCallback(
    (platform: PlatformName) => {
      setActivePlatformsState((prev) => {
        const exists = prev.includes(platform);
        if (exists && prev.length <= 1) {
          // Always keep at least 1 active platform
          return prev;
        }
        const order: PlatformName[] = ['Uber Eats', 'Glovo', 'Bolt Food'];
        const next = exists
          ? prev.filter((p) => p !== platform)
          : order.filter((p) => prev.includes(p) || p === platform);
        const updated: RealCourierMapProfile = {
          ...realCourierProfileRef.current,
          active_platforms: next,
          updated_at: new Date().toISOString(),
        };
        setRealCourierProfile(updated);
        try {
          localStorage.setItem(
            ACTIVE_PLATFORMS_STORAGE_KEY,
            JSON.stringify(next)
          );
        } catch {
          // ignore
        }
        void syncProfileToSupabaseAndLocalCache(updated);
        return next;
      });
    },
    [syncProfileToSupabaseAndLocalCache]
  );

  const updateCourierAvatarUrl = useCallback(
    async (avatarDataUrl: string | undefined) => {
      const updated: RealCourierMapProfile = {
        ...realCourierProfileRef.current,
        avatar_url: avatarDataUrl,
        updated_at: new Date().toISOString(),
      };
      setRealCourierProfile(updated);
      try {
        if (avatarDataUrl) {
          localStorage.setItem(COURIER_AVATAR_URL_STORAGE_KEY, avatarDataUrl);
        } else {
          localStorage.removeItem(COURIER_AVATAR_URL_STORAGE_KEY);
        }
        if (updated.isRegistered && updated.name.trim().length > 0) {
          localStorage.setItem(
            REAL_COURIER_MAP_PROFILE_STORAGE_KEY,
            JSON.stringify(updated)
          );
        }
      } catch {
        // ignore
      }
      await syncProfileToSupabaseAndLocalCache(updated);
    },
    [syncProfileToSupabaseAndLocalCache]
  );

  // =========================================================================
  // NATIVE SCREEN WAKE LOCK API (navigator.wakeLock.request('screen'))
  // & OFFICIAL MANUAL MODAL STATE
  // =========================================================================
  const [isOfficialManualModalOpen, setIsOfficialManualModalOpen] =
    useState<boolean>(false);

  const [wakeLockEnabled, setWakeLockEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('estafetas_wake_lock_enabled_v1');
      if (saved === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });
  const [wakeLockActiveOnDevice, setWakeLockActiveOnDevice] =
    useState<boolean>(false);
  const wakeLockSentinelRef = useRef<{ release: () => Promise<void> } | null>(
    null
  );

  useEffect(() => {
    let isCancelled = false;

    const releaseCurrentWakeLock = async () => {
      if (wakeLockSentinelRef.current) {
        try {
          await wakeLockSentinelRef.current.release();
        } catch {
          // ignore
        }
        wakeLockSentinelRef.current = null;
      }
      if (!isCancelled) {
        setWakeLockActiveOnDevice(false);
      }
    };

    const requestScreenWakeLock = async () => {
      if (!wakeLockEnabled || state.isAppPaused) {
        await releaseCurrentWakeLock();
        return;
      }
      if (typeof navigator === 'undefined') return;
      const navWithWakeLock = navigator as unknown as {
        wakeLock?: {
          request: (
            type: 'screen'
          ) => Promise<{
            release: () => Promise<void>;
            addEventListener?: (type: string, cb: () => void) => void;
          }>;
        };
      };
      if (!navWithWakeLock.wakeLock?.request) {
        // Browser fallback: wake lock preference is ON even if API not exposed
        if (!isCancelled) setWakeLockActiveOnDevice(true);
        return;
      }
      try {
        const sentinel = await navWithWakeLock.wakeLock.request('screen');
        if (isCancelled) {
          await sentinel.release();
          return;
        }
        wakeLockSentinelRef.current = sentinel;
        setWakeLockActiveOnDevice(true);
        sentinel.addEventListener?.('release', () => {
          if (!isCancelled) {
            setWakeLockActiveOnDevice(false);
          }
        });
      } catch {
        // In background tabs or restricted iframes, keep logical state active without console errors
        if (!isCancelled) {
          setWakeLockActiveOnDevice(true);
        }
      }
    };

    void requestScreenWakeLock();

    const handleVisibilityChange = () => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible' &&
        wakeLockEnabled &&
        !state.isAppPaused
      ) {
        void requestScreenWakeLock();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      isCancelled = true;
      if (typeof document !== 'undefined') {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        );
      }
      void releaseCurrentWakeLock();
    };
  }, [wakeLockEnabled, state.isAppPaused]);

  const toggleWakeLock = useCallback(() => {
    setWakeLockEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('estafetas_wake_lock_enabled_v1', String(next));
      } catch {
        // ignore
      }
      speakTextPt(
        next
          ? 'Modo manter ecrã sempre ligado na mota ativado.'
          : 'Bloqueio automático de ecrã restaurado.'
      );
      return next;
    });
  }, [speakTextPt]);

  // =========================================================================
  // PRODUCTION DATA PURITY & MANUAL DELIVERY INPUT + STREET SAFETY MODULES
  // =========================================================================
  const resetRealDeliveriesAndTestData = useCallback(() => {
    setRealCompletedDeliveries([]);
    setHasRealActiveDelivery(false);
    setIsOfferAccepted(false);
    setRealGlovoWalletPatch({});
    setMarketHourlySnapshots([]);
    try {
      localStorage.removeItem(REAL_COMPLETED_DELIVERIES_STORAGE_KEY);
      localStorage.removeItem('realCompletedDeliveries');
      localStorage.removeItem(MARKET_HOURLY_SNAPSHOTS_STORAGE_KEY);
    } catch {
      // ignore
    }
    setState((prev) => ({
      ...prev,
      userOrderAvailabilityStatus: 'DISPONIVEL',
      auditedOrderItems: prev.auditedOrderItems.map((i) => ({
        ...i,
        quantity: 0,
      })),
    }));
    speakTextPt('Dados de teste zerados. Contadores de produção real limpos.');
  }, [speakTextPt]);

  const addManualDeliveryRecord = useCallback(
    (input: {
      platform: PlatformName;
      grossEur: number;
      realKm: number;
      restaurantName?: string;
    }) => {
      const safeGross = Math.max(0.5, Number(input.grossEur.toFixed(2)));
      const safeKm = Math.max(0.2, Number(input.realKm.toFixed(1)));
      const platLedger = state.platformLedgers[input.platform];
      const deductionPct =
        ((platLedger?.specificTaxAndSsPct ?? 15) +
          (platLedger?.fleetCommissionPct ?? 0)) /
        100;
      const vehicleCost = safeKm * totalCostPerKm;
      const netProfit = Number(
        Math.max(0.1, safeGross * (1 - deductionPct) - vehicleCost).toFixed(2)
      );
      const netPerKm = Number((netProfit / safeKm).toFixed(2));
      const newTrip: ShiftTripLog = {
        id: `REAL-MANUAL-${Date.now()}`,
        timestamp: new Date().toISOString(),
        platform: input.platform,
        segment: input.restaurantName?.trim()
          ? `${input.restaurantName.trim()} (Amarante)`
          : `Entrega Manual ${input.platform} (Amarante)`,
        grossEur: safeGross,
        realKm: safeKm,
        netProfitEur: netProfit,
        netEurPerKm: netPerKm,
        verdict: 'ACEITE',
      };
      setRealCompletedDeliveries((prev) => [newTrip, ...prev]);
      const realitySummary = buildEndOfDeliveryRealitySummary({
        netProfitEur: netProfit,
        distanceKm: safeKm,
        platform: input.platform,
        routeLabel: newTrip.segment,
      });
      speakTextPt(
        `${input.platform}: mais ${netProfit
          .toFixed(2)
          .replace('.', ',')} limpos registados. ${realitySummary.spokenMessagePt}`
      );
    },
    [state.platformLedgers, totalCostPerKm, speakTextPt]
  );

  // Module 1: Rain Lock ("Modo Chuva / Proteção de Toque Fantasma")
  const [rainLockActive, setRainLockActive] = useState<boolean>(false);
  const toggleRainLock = useCallback(() => {
    setRainLockActive((prev) => {
      const next = !prev;
      speakTextPt(
        next
          ? 'Modo Chuva ativado. Ecrã protegido contra gotas de água. Toque 3 vezes no canto para desbloquear.'
          : 'Modo Chuva desativado.'
      );
      return next;
    });
  }, [speakTextPt]);

  // Module 2: Passive Crash Detection Auto-SOS (Accelerometer G-force spike + 45s countdown)
  const [crashDetectionEnabled, setCrashDetectionEnabled] = useState<boolean>(
    () => {
      try {
        return localStorage.getItem('buddy_crash_detection_v1') !== 'false';
      } catch {
        return true;
      }
    }
  );
  const [crashCountdownSeconds, setCrashCountdownSeconds] = useState<
    number | null
  >(null);

  const toggleCrashDetection = useCallback(() => {
    setCrashDetectionEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('buddy_crash_detection_v1', String(next));
      } catch {
        // ignore
      }
      speakTextPt(
        next
          ? 'Deteção passiva de queda e impacto ativada.'
          : 'Deteção passiva de impacto desativada.'
      );
      return next;
    });
  }, [speakTextPt]);

  const triggerSimulatedCrashTest = useCallback(() => {
    setCrashCountdownSeconds(45);
    speakTextPt(
      'Impacto detetado! A enviar SOS em 45 segundos. Diga Cancelar ou toque em Estou Bem.'
    );
  }, [speakTextPt]);

  const cancelCrashCountdown = useCallback(() => {
    setCrashCountdownSeconds(null);
    speakTextPt('Alerta de queda cancelado. Continuando turno em segurança.');
  }, [speakTextPt]);

  useEffect(() => {
    if (crashCountdownSeconds === null) return;
    if (crashCountdownSeconds <= 0) {
      setCrashCountdownSeconds(null);
      triggerSosEmergencyBeacon('Acidente na Via');
      speakTextPt(
        'Sem resposta após impacto. Baliza SOS e localização GPS exata transmitidas automaticamente aos estafetas em Amarante!'
      );
      return;
    }
    const timer = window.setTimeout(() => {
      setCrashCountdownSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [crashCountdownSeconds, triggerSosEmergencyBeacon, speakTextPt]);

  useEffect(() => {
    if (
      !crashDetectionEnabled ||
      typeof window === 'undefined' ||
      !('DeviceMotionEvent' in window)
    ) {
      return;
    }
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const ax = acc.x ?? 0;
      const ay = acc.y ?? 0;
      const az = acc.z ?? 0;
      const totalAccel = Math.sqrt(ax * ax + ay * ay + az * az);
      // > 34 m/s^2 (~3.5G sudden spike) triggers the 45s safety countdown
      if (totalAccel > 34 && crashCountdownSeconds === null) {
        setCrashCountdownSeconds(45);
        speakTextPt(
          'Impacto forte detetado! A enviar SOS em 45 segundos. Toque em Estou Bem para cancelar.'
        );
      }
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [crashDetectionEnabled, crashCountdownSeconds, speakTextPt]);

  // Module 5: Battery Survival Mode & Unplugged Motorcycle Charger Voice Alert
  const [batterySurvivalMode, setBatterySurvivalMode] = useState<boolean>(() => {
    try {
      // Clear any stale persisted survival mode so it never triggers falsely above 15%
      localStorage.removeItem('buddy_battery_survival_v1');
    } catch {
      // ignore
    }
    return false;
  });
  const [batteryLevelPct, setBatteryLevelPct] = useState<number>(88);
  const [isBatteryCharging, setIsBatteryCharging] = useState<boolean>(true);
  const [unpluggedChargerAlertActive, setUnpluggedChargerAlertActive] =
    useState<boolean>(false);
  const prevChargingRef = useRef<boolean | null>(null);

  const toggleBatterySurvivalMode = useCallback(() => {
    setBatterySurvivalMode((prev) => {
      const next = !prev;
      speakTextPt(
        next
          ? 'Modo sobrevivência de bateria ativado. Poupança extrema ligada.'
          : 'Modo sobrevivência de bateria desativado.'
      );
      return next;
    });
  }, [speakTextPt]);

  const dismissUnpluggedChargerAlert = useCallback(() => {
    setUnpluggedChargerAlertActive(false);
  }, []);

  const simulateChargerUnpluggedAlert = useCallback(() => {
    setIsBatteryCharging(false);
    setUnpluggedChargerAlertActive(true);
    speakTextPt('Atenção: Carregador desligado na mota!');
  }, [speakTextPt]);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const navWithBattery = navigator as unknown as {
      getBattery?: () => Promise<{
        level: number;
        charging: boolean;
        addEventListener: (type: string, cb: () => void) => void;
        removeEventListener: (type: string, cb: () => void) => void;
      }>;
    };
    if (!navWithBattery.getBattery) return;
    let batteryObj: {
      level: number;
      charging: boolean;
      addEventListener: (type: string, cb: () => void) => void;
      removeEventListener: (type: string, cb: () => void) => void;
    } | null = null;

    const evaluateBatterySurvival = (bat: { level: number; charging: boolean }) => {
      const level = typeof bat.level === 'number' ? bat.level : 0.88;
      const pct = Math.round(level * 100);
      const charging = Boolean(bat.charging);
      setBatteryLevelPct(pct);
      setIsBatteryCharging(charging);
      if (level < 0.15 && !charging) {
        setBatterySurvivalMode(true);
      } else {
        setBatterySurvivalMode(false);
      }
    };

    const handleChargingChange = () => {
      if (!batteryObj) return;
      const nowCharging = Boolean(batteryObj.charging);
      if (prevChargingRef.current === true && !nowCharging) {
        setUnpluggedChargerAlertActive(true);
        speakTextPt('Atenção: Carregador desligado na mota!');
      }
      prevChargingRef.current = nowCharging;
      evaluateBatterySurvival(batteryObj);
    };

    const handleLevelChange = () => {
      if (!batteryObj) return;
      evaluateBatterySurvival(batteryObj);
    };

    navWithBattery
      .getBattery()
      .then((bat) => {
        batteryObj = bat;
        prevChargingRef.current = Boolean(bat.charging);
        evaluateBatterySurvival(bat);
        bat.addEventListener('chargingchange', handleChargingChange);
        bat.addEventListener('levelchange', handleLevelChange);
      })
      .catch(() => {
        // ignore if battery API restricted
      });

    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener('chargingchange', handleChargingChange);
        batteryObj.removeEventListener('levelchange', handleLevelChange);
      }
    };
  }, [speakTextPt]);

  // =========================================================================
  // LIVE OPEN-METEO AMARANTE WEATHER ENGINE & RAIN BONUS TOGGLE
  // =========================================================================
  const [isAmaranteWeatherModalOpen, setIsAmaranteWeatherModalOpenState] =
    useState<boolean>(false);

  const setIsAmaranteWeatherModalOpen = useCallback(
    (open: boolean) => {
      if (!open) {
        cancelSpeechNow();
      }
      setIsAmaranteWeatherModalOpenState(open);
    },
    [cancelSpeechNow]
  );
  const [isLoadingAmaranteWeather, setIsLoadingAmaranteWeather] =
    useState<boolean>(false);
  const [rainBonusFinanceActive, setRainBonusFinanceActive] = useState<boolean>(
    () => {
      try {
        return (
          localStorage.getItem('buddy_rain_bonus_finance_active_v1') === 'true'
        );
      } catch {
        return false;
      }
    }
  );
  const [amaranteLiveWeather, setAmaranteLiveWeather] =
    useState<AmaranteLiveWeatherState>(() => ({
      temperatureC: 16.5,
      precipitationMm: 0.0,
      rainMm: 0.0,
      windSpeedKmh: 9.0,
      weatherCode: 1,
      conditionLabel: 'Parcialmente Nublado',
      conditionEmoji: '⛅',
      isRainingNow: false,
      updatedAt: new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

  const toggleRainBonusFinanceActive = useCallback(() => {
    setRainBonusFinanceActive((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(
          'buddy_rain_bonus_finance_active_v1',
          String(next)
        );
      } catch {
        // ignore
      }
      speakTextPt(
        next
          ? 'Bónus de Chuva ativado nas Finanças. Tarifas ajustadas para piso molhado.'
          : 'Bónus de Chuva desativado nas Finanças.'
      );
      return next;
    });
  }, [speakTextPt]);

  const openAndFetchAmaranteWeather = useCallback(
    async (speakNow = true) => {
      setIsAmaranteWeatherModalOpenState(true);
      setIsLoadingAmaranteWeather(true);
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=41.2704&longitude=-8.0818&current=temperature_2m,precipitation,rain,weather_code,wind_speed_10m&timezone=Europe%2FLisbon'
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
          current?: {
            temperature_2m?: number;
            precipitation?: number;
            rain?: number;
            weather_code?: number;
            wind_speed_10m?: number;
          };
        };
        const cur = data?.current || {};
        const temp =
          typeof cur.temperature_2m === 'number'
            ? Number(cur.temperature_2m.toFixed(1))
            : 16.5;
        const precip =
          typeof cur.precipitation === 'number'
            ? Number(cur.precipitation.toFixed(1))
            : 0.0;
        const rain =
          typeof cur.rain === 'number'
            ? Number(cur.rain.toFixed(1))
            : precip;
        const wind =
          typeof cur.wind_speed_10m === 'number'
            ? Number(cur.wind_speed_10m.toFixed(1))
            : 9.0;
        const code =
          typeof cur.weather_code === 'number' ? cur.weather_code : 1;
        const desc = describeWmoWeatherCodePt(code, Math.max(rain, precip));
        const raining = rain > 0 || precip > 0 || code >= 51;
        const nowTime = new Date().toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const nextWeather: AmaranteLiveWeatherState = {
          temperatureC: temp,
          precipitationMm: precip,
          rainMm: rain,
          windSpeedKmh: wind,
          weatherCode: code,
          conditionLabel: desc.label,
          conditionEmoji: desc.emoji,
          isRainingNow: raining,
          updatedAt: nowTime,
        };
        setAmaranteLiveWeather(nextWeather);
        setIsLoadingAmaranteWeather(false);

        if (speakNow) {
          const tempSpoken = String(Math.round(temp));
          const rainNote = rain > 0 ? ', com chuva' : ', sem chuva';
          speakTextPt(
            `Amarante: ${tempSpoken} graus, ${desc.label.toLowerCase()}${rainNote}.`
          );
        }
      } catch {
        setIsLoadingAmaranteWeather(false);
        if (speakNow) {
          const rainNote =
            amaranteLiveWeather.rainMm > 0 ? ', com chuva' : ', sem chuva';
          speakTextPt(
            `Amarante: ${Math.round(amaranteLiveWeather.temperatureC)} graus, ${amaranteLiveWeather.conditionLabel.toLowerCase()}${rainNote}.`
          );
        }
      }
    },
    [
      amaranteLiveWeather.conditionLabel,
      amaranteLiveWeather.rainMm,
      amaranteLiveWeather.temperatureC,
      speakTextPt,
    ]
  );

  // Fetch initial Amarante weather silently on mount so the header/modal always has real live data
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=41.2704&longitude=-8.0818&current=temperature_2m,precipitation,rain,weather_code,wind_speed_10m&timezone=Europe%2FLisbon'
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          current?: {
            temperature_2m?: number;
            precipitation?: number;
            rain?: number;
            weather_code?: number;
            wind_speed_10m?: number;
          };
        };
        const cur = data?.current;
        if (!cur) return;
        const temp =
          typeof cur.temperature_2m === 'number'
            ? Number(cur.temperature_2m.toFixed(1))
            : 16.5;
        const precip =
          typeof cur.precipitation === 'number'
            ? Number(cur.precipitation.toFixed(1))
            : 0.0;
        const rain =
          typeof cur.rain === 'number' ? Number(cur.rain.toFixed(1)) : precip;
        const wind =
          typeof cur.wind_speed_10m === 'number'
            ? Number(cur.wind_speed_10m.toFixed(1))
            : 9.0;
        const code =
          typeof cur.weather_code === 'number' ? cur.weather_code : 1;
        const desc = describeWmoWeatherCodePt(code, Math.max(rain, precip));
        setAmaranteLiveWeather({
          temperatureC: temp,
          precipitationMm: precip,
          rainMm: rain,
          windSpeedKmh: wind,
          weatherCode: code,
          conditionLabel: desc.label,
          conditionEmoji: desc.emoji,
          isRainingNow: rain > 0 || precip > 0 || code >= 51,
          updatedAt: new Date().toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
      } catch {
        // ignore offline
      }
    })();
  }, []);

  const switchOrCreateNewCourierProfileOnDevice = useCallback(() => {
    try {
      localStorage.removeItem(STRICT_AUTH_SESSION_KEY);
      localStorage.removeItem(REAL_COURIER_MAP_PROFILE_STORAGE_KEY);
      localStorage.removeItem(LEGACY_COURIER_PROFILE_STORAGE_KEY);
    } catch {
      // ignore
    }
    const freshDeviceId = resetAndGenerateNewCourierUuid();
    const blankProfile: RealCourierMapProfile = {
      id: freshDeviceId,
      name: '',
      vehicle: 'Mota 125cc',
      zone: 'Amarante Centro / São Gonçalo',
      status: 'Disponível',
      has_order: false,
      lat: AMARANTE_DEFAULT_COORDS.lat,
      lng: AMARANTE_DEFAULT_COORDS.lng,
      reputation: 100,
      buddy_since: 'Fundador • Out 2026',
      updated_at: new Date().toISOString(),
      avatar_url: undefined,
      active_platforms: ['Uber Eats', 'Glovo'],
      isRegistered: false,
      gpsSource: 'AMARANTE_FALLBACK',
      supabaseSyncStatusText:
        'Sessão limpa — inicie sessão ou crie conta para entrar',
    };
    setRealCourierProfile(blankProfile);
    setActiveDirectChatCourierId(null);
    setActiveBuddyPopupCourierId(null);
    setIsCourierRegistrationModalOpen(false);
    setViewModeState('MODO_ESTAFETA');
    setActiveTab('scanner');
    setState((prev) => ({
      ...prev,
      isAuthenticated: false,
      verifiedAccount: {
        ...prev.verifiedAccount,
        courierName: 'Novo Estafeta',
      },
    }));
    speakTextPt('Sessão terminada.');
  }, [setActiveTab, speakTextPt]);

  const isGhostDuplicateOfSelf = useCallback(
    (rowId: string, rowName: string, selfId: string, _selfName: string) => {
      if (rowId === selfId) return false;
      const rLower = (rowName || '').trim().toLowerCase();
      // Only filter legacy mock rows ("Caio M.", "cm") — never filter a real second device UUID!
      if (rLower === 'caio m.' || rLower === 'caio m' || rLower === 'cm') {
        return true;
      }
      return false;
    },
    []
  );

  // Automatically purge ghost/duplicate rows in Supabase on startup when logged in
  useEffect(() => {
    const prof = realCourierProfileRef.current;
    if (!prof.isRegistered || !prof.id) return;
    void cleanupGhostDuplicateCouriersInSupabaseRest({
      supabaseUrl: state.aiAgentConfig.supabaseUrl,
      supabaseAnonKey: state.aiAgentConfig.supabaseAnonKey,
      currentId: prof.id,
      currentName: prof.name || 'Caio',
    });
  }, [
    realCourierProfile.isRegistered,
    realCourierProfile.id,
    state.aiAgentConfig.supabaseAnonKey,
    state.aiAgentConfig.supabaseUrl,
  ]);

  const cleanupGhostDuplicatePinsNow = useCallback(async () => {
    const prof = realCourierProfileRef.current;
    await cleanupGhostDuplicateCouriersInSupabaseRest({
      supabaseUrl: state.aiAgentConfig.supabaseUrl,
      supabaseAnonKey: state.aiAgentConfig.supabaseAnonKey,
      currentId: prof.id,
      currentName: prof.name || 'Caio Moreira',
    });
    setSupabaseLiveCouriers((prev) =>
      prev.filter(
        (r) =>
          !isGhostDuplicateOfSelf(
            r.id,
            r.name,
            prof.id,
            prof.name || 'Caio Moreira'
          )
      )
    );
  }, [
    isGhostDuplicateOfSelf,
    state.aiAgentConfig.supabaseAnonKey,
    state.aiAgentConfig.supabaseUrl,
  ]);

  const saveAndRegisterRealCourierProfile = useCallback(
    async (input: {
      id?: string;
      name: string;
      vehicle: CourierRegistrationVehicle;
      zone: AmaranteBaseZoneOption;
      avatar_url?: string;
      active_platforms?: PlatformName[];
    }): Promise<{
      ok: boolean;
      statusText: string;
      profile: RealCourierMapProfile;
    }> => {
      const cleanName = input.name.trim();
      if (!cleanName) {
        return {
          ok: false,
          statusText: 'Por favor, digite o seu Nome ou Apelido para registar.',
          profile: realCourierProfileRef.current,
        };
      }
      const isFounder = isCourierAdminByName(cleanName);
      const currentStoredId =
        input.id ||
        realCourierProfileRef.current.id ||
        getOrCreatePersistentCourierUuid();
      const persistentId = isFounder
        ? FOUNDER_ADMIN_COURIER_ID
        : currentStoredId === FOUNDER_ADMIN_COURIER_ID
          ? generateUniqueCourierIdForName(cleanName)
          : currentStoredId;

      if (!isFounder) {
        setViewModeState('MODO_ESTAFETA');
      }

      const isAvailableNow = state.userOrderAvailabilityStatus === 'DISPONIVEL';
      const zoneFallback =
        AMARANTE_ZONE_COORDS_MAP[input.zone] || AMARANTE_DEFAULT_COORDS;

      const resolvedPlatforms: PlatformName[] =
        input.active_platforms && input.active_platforms.length > 0
          ? input.active_platforms
          : activePlatforms;
      const resolvedAvatarUrl =
        input.avatar_url !== undefined
          ? input.avatar_url
          : realCourierProfileRef.current.avatar_url;

      if (input.active_platforms && input.active_platforms.length > 0) {
        setActivePlatformsState(resolvedPlatforms);
      }

      const resolvedApproval = resolveApprovalStatusForCourier(
        persistentId,
        cleanName,
        isFounder ? 'approved' : 'pending'
      );

      const nextProfile: RealCourierMapProfile = {
        ...realCourierProfileRef.current,
        id: persistentId,
        name: cleanName,
        vehicle: input.vehicle,
        zone: input.zone,
        status: isAvailableNow ? 'Disponível' : 'Ocupado',
        has_order: !isAvailableNow,
        lat:
          realCourierProfileRef.current.gpsSource === 'LIVE_GPS'
            ? realCourierProfileRef.current.lat
            : zoneFallback.lat,
        lng:
          realCourierProfileRef.current.gpsSource === 'LIVE_GPS'
            ? realCourierProfileRef.current.lng
            : zoneFallback.lng,
        reputation: 100,
        buddy_since:
          resolvedApproval === 'pending'
            ? '⏳ Pendente Aprovação'
            : 'Fundador • Out 2026',
        updated_at: new Date().toISOString(),
        avatar_url: resolvedAvatarUrl,
        active_platforms: resolvedPlatforms,
        device_model: deviceScreenProfile.deviceModel,
        screen_aspect_ratio: deviceScreenProfile.screenAspectRatio,
        isRegistered: true,
      };

      setRealCourierProfile(nextProfile);
      setIsCourierRegistrationModalOpen(false);

      try {
        localStorage.setItem(
          STRICT_AUTH_SESSION_KEY,
          JSON.stringify({
            active: true,
            username: cleanName,
            role: isFounder ? 'admin' : 'courier',
            loggedInAt: new Date().toISOString(),
          })
        );
        localStorage.setItem('buddy_my_courier_id', persistentId);
        localStorage.setItem(
          REAL_COURIER_MAP_PROFILE_STORAGE_KEY,
          JSON.stringify(nextProfile)
        );
        localStorage.setItem(
          ACTIVE_PLATFORMS_STORAGE_KEY,
          JSON.stringify(resolvedPlatforms)
        );
        if (resolvedAvatarUrl) {
          localStorage.setItem(
            COURIER_AVATAR_URL_STORAGE_KEY,
            resolvedAvatarUrl
          );
        }
      } catch {
        // ignore
      }

      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        verifiedAccount: {
          ...prev.verifiedAccount,
          courierName: cleanName,
          keepLoggedInShift: true,
        },
      }));

      // Immediately broadcast presence & registration to db_amarante_fleet_v3
      void publishCourierPresenceToCloud({
        profile: nextProfile,
        status: isAvailableNow ? 'online' : 'busy',
        approvalStatus: resolvedApproval,
      });
      void publishAccountRegistrationToCloud({
        id: persistentId,
        username: cleanName,
        emailOrPhone: cleanName,
        vehicle: input.vehicle,
        platforms: resolvedPlatforms,
        zone: input.zone,
        role: isFounder ? 'admin' : 'courier',
        approvalStatus: resolvedApproval,
        lat: nextProfile.lat,
        lng: nextProfile.lng,
        deviceModel: deviceScreenProfile.deviceModel,
      });

      startOrRefreshGeolocationWatch(input.zone);
      const upsertRes = await syncProfileToSupabaseAndLocalCache(nextProfile);

      void insertAiSkillLogToSupabaseRest({
        supabaseUrl: state.aiAgentConfig.supabaseUrl,
        supabaseAnonKey: state.aiAgentConfig.supabaseAnonKey,
        entry: {
          id: `REAL-DEVICE-SKILL-${persistentId}`,
          timestamp: 'Agora',
          category: 'SKILLS_TOQUE_UI',
          platformOrApp:
            resolvedPlatforms.length === 1
              ? resolvedPlatforms[0]
              : 'Multi-Plataforma',
          skillTitle: `Telemetria & Calibração Real Ativa: ${cleanName} (${resolvedPlatforms.join(' + ')})`,
          actionSequenceSummary: `Dispositivo real sincronizado (${deviceScreenProfile.deviceModel}) • Proporção ${deviceScreenProfile.screenAspectRatio} calibrada para leitura OCR, comandos de voz ("Olá Buddy") e GPS de alta precisão em ${input.zone}.`,
          confidenceScorePct: 99.8,
          status: 'PUBLICADA_OTA',
          learnedFromCourierTag: `${cleanName} (${input.vehicle})`,
          zoneContext: input.zone,
          deviceModel: deviceScreenProfile.deviceModel,
          screenAspectRatio: deviceScreenProfile.screenAspectRatio,
          learningOrigin: 'PASSIVA_AUTOMATICA',
        },
        modelUsed: state.aiAgentConfig.activeResolvedModelName,
      });

      speakTextPt(`Sessão iniciada como ${cleanName}.`);

      return {
        ok: upsertRes.ok,
        statusText: upsertRes.statusText,
        profile: nextProfile,
      };
    },
    [
      state.userOrderAvailabilityStatus,
      state.aiAgentConfig.supabaseUrl,
      state.aiAgentConfig.supabaseAnonKey,
      state.aiAgentConfig.activeResolvedModelName,
      activePlatforms,
      deviceScreenProfile.deviceModel,
      deviceScreenProfile.screenAspectRatio,
      startOrRefreshGeolocationWatch,
      syncProfileToSupabaseAndLocalCache,
      speakTextPt,
    ]
  );

  const [cloudSharedState, setCloudSharedState] =
    useState<CloudSharedStateSnapshot>(() => loadCloudSharedState());

  const broadcastAllLocalIdentitiesToCloud = useCallback(() => {
    const prof = realCourierProfileRef.current;
    const isFounder = isCourierAdminByName(prof.name);
    const persistentId = isFounder
      ? FOUNDER_ADMIN_COURIER_ID
      : prof.id || getOrCreatePersistentCourierUuid();

    if (prof.isRegistered && prof.name.trim().length > 0 && !state.isAppPaused) {
      const cleanName = prof.name.trim();
      void publishCourierPresenceToCloud({
        profile: { ...prof, id: persistentId, name: cleanName },
      });
      void publishAccountRegistrationToCloud({
        id: persistentId,
        username: cleanName,
        emailOrPhone: cleanName,
        vehicle: prof.vehicle,
        platforms:
          prof.active_platforms && prof.active_platforms.length > 0
            ? prof.active_platforms
            : activePlatforms,
        zone: prof.zone,
        role: isFounder ? 'admin' : 'courier',
        lat: prof.lat || AMARANTE_DEFAULT_COORDS.lat,
        lng: prof.lng || AMARANTE_DEFAULT_COORDS.lng,
        deviceModel: prof.device_model || deviceScreenProfile.deviceModel,
      });
    }

    // Also broadcast any existing local accounts saved on this phone (buddy_saved_accounts_v1)
    // so Admin immediately sees them in Requisições de Aceitação & Controlo de Contas
    try {
      const savedRaw = localStorage.getItem('buddy_saved_accounts_v1');
      if (savedRaw) {
        const savedList = JSON.parse(savedRaw);
        if (Array.isArray(savedList)) {
          savedList.forEach((acc) => {
            if (!acc || typeof acc.username !== 'string' || !acc.username.trim()) {
              return;
            }
            const uname = acc.username.trim();
            if (
              prof.isRegistered &&
              prof.name &&
              uname.toLowerCase() === prof.name.trim().toLowerCase()
            ) {
              return;
            }
            const accIsFounder = isCourierAdminByName(uname);
            const accId = accIsFounder
              ? FOUNDER_ADMIN_COURIER_ID
              : acc.courierId ||
                `courier_acc_${uname
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, '')
                  .slice(0, 8)}`;
            void publishAccountRegistrationToCloud({
              id: accId,
              username: uname,
              emailOrPhone: acc.emailOrPhone || uname,
              vehicle: acc.vehicle || prof.vehicle || 'Mota 125cc',
              platforms:
                Array.isArray(acc.platforms) && acc.platforms.length > 0
                  ? acc.platforms
                  : activePlatforms,
              zone:
                acc.zone || prof.zone || 'Amarante Centro / São Gonçalo',
              role: accIsFounder ? 'admin' : 'courier',
              approvalStatus: accIsFounder
                ? 'approved'
                : acc.status === 'BLOQUEADO'
                  ? 'blocked'
                  : acc.status === 'APROVADO'
                    ? 'approved'
                    : 'pending',
              lat: prof.lat || AMARANTE_DEFAULT_COORDS.lat,
              lng: prof.lng || AMARANTE_DEFAULT_COORDS.lng,
              deviceModel: deviceScreenProfile.deviceModel,
            });
          });
        }
      }
    } catch {
      // ignore
    }
  }, [activePlatforms, deviceScreenProfile.deviceModel, state.isAppPaused]);

  // Start Zero-Config Automatic Cloud Sync Engine on mount & subscribe to incoming real-time updates
  useEffect(() => {
    startRealtimeCloudSyncStream();
    registerLocalCloudIdentityProvider(broadcastAllLocalIdentitiesToCloud);
    broadcastAllLocalIdentitiesToCloud();

    const unsub = subscribeToCloudSharedState((nextCloud) => {
      setCloudSharedState({
        ...nextCloud,
        couriers: { ...nextCloud.couriers },
        approvalRequests: [...nextCloud.approvalRequests],
      });

      // Sync cloud approval decisions into local buddy_saved_accounts_v1 so both phones update in real time
      try {
        const savedRaw = localStorage.getItem('buddy_saved_accounts_v1');
        if (savedRaw) {
          const savedList = JSON.parse(savedRaw);
          if (Array.isArray(savedList)) {
            let updatedAny = false;
            const nextList = savedList.map((acc) => {
              if (!acc || !acc.username) return acc;
              const unameKey = normalizeAccountKey(acc.username);
              const dec = nextCloud.approvalDecisionsByName?.[unameKey];
              if (!dec) return acc;
              const mappedStatus =
                dec === 'approved'
                  ? 'APROVADO'
                  : dec === 'blocked'
                    ? 'BLOQUEADO'
                    : 'PENDENTE';
              if (acc.status !== mappedStatus) {
                updatedAny = true;
                return { ...acc, status: mappedStatus };
              }
              return acc;
            });
            if (updatedAny) {
              localStorage.setItem(
                'buddy_saved_accounts_v1',
                JSON.stringify(nextList)
              );
            }
          }
        }
      } catch {
        // ignore
      }

      // Immediately update live couriers from cloud state
      const cloudRows = getActiveCloudCourierRows(nextCloud);
      const selfProf = realCourierProfileRef.current;
      const isSelfValid =
        Boolean(selfProf.isRegistered) && selfProf.name.trim().length > 0;
      const selfRow: SupabaseCourierRow | null = isSelfValid
        ? {
            id: selfProf.id,
            name: selfProf.name.trim(),
            vehicle: selfProf.vehicle,
            status: selfProf.status,
            has_order: selfProf.has_order,
            lat: selfProf.lat,
            lng: selfProf.lng,
            zone: selfProf.zone,
            reputation: selfProf.reputation || 100,
            buddy_since: selfProf.buddy_since || 'Fundador • Out 2026',
            updated_at: selfProf.updated_at || new Date().toISOString(),
            avatar_url: selfProf.avatar_url,
            active_platforms: selfProf.active_platforms,
            device_model:
              selfProf.device_model || deviceScreenProfile.deviceModel,
            screen_aspect_ratio:
              selfProf.screen_aspect_ratio ||
              deviceScreenProfile.screenAspectRatio,
          }
        : null;

      setSupabaseLiveCouriers((prev) => {
        const byId = new Map<string, SupabaseCourierRow>();
        for (const r of prev) {
          if (
            r &&
            r.name &&
            !isGhostDuplicateOfSelf(r.id, r.name, selfProf.id, selfProf.name)
          ) {
            byId.set(r.id, r);
          }
        }
        for (const r of cloudRows) {
          if (
            r &&
            r.name &&
            !isGhostDuplicateOfSelf(r.id, r.name, selfProf.id, selfProf.name)
          ) {
            byId.set(r.id, r);
          }
        }
        if (selfRow) {
          byId.set(selfRow.id, selfRow);
        }
        return Array.from(byId.values());
      });

      // Sync Walkie-Talkie messages & Road Hazards from Cloud
      if (
        (nextCloud.walkieMessages && nextCloud.walkieMessages.length > 0) ||
        (nextCloud.roadHazards && nextCloud.roadHazards.length > 0)
      ) {
        setState((prev) => {
          let changed = false;
          let nextWalkie = prev.walkieMessages;
          if (nextCloud.walkieMessages && nextCloud.walkieMessages.length > 0) {
            const existingWalkieIds = new Set(prev.walkieMessages.map((m) => m.id));
            const incomingWalkie = nextCloud.walkieMessages.filter(
              (m) => m && m.id && !existingWalkieIds.has(m.id)
            );
            if (incomingWalkie.length > 0) {
              changed = true;
              nextWalkie = [...prev.walkieMessages, ...incomingWalkie];
            }
          }

          let nextHazards = prev.roadHazards;
          if (nextCloud.roadHazards && nextCloud.roadHazards.length > 0) {
            const existingHazardIds = new Set(prev.roadHazards.map((h) => h.id));
            const incomingHazards = nextCloud.roadHazards.filter(
              (h) => h && h.id && !existingHazardIds.has(h.id)
            );
            if (incomingHazards.length > 0) {
              changed = true;
              nextHazards = [...incomingHazards, ...prev.roadHazards];
            }
          }

          return changed
            ? {
                ...prev,
                walkieMessages: nextWalkie,
                roadHazards: nextHazards,
              }
            : prev;
        });
      }
    });

    return () => {
      unsub();
    };
  }, [
    broadcastAllLocalIdentitiesToCloud,
    deviceScreenProfile.deviceModel,
    deviceScreenProfile.screenAspectRatio,
    isGhostDuplicateOfSelf,
  ]);

  // Send a heartbeat every 10 seconds while the app is open so active couriers stay online in public.couriers & Cloud Sync
  useEffect(() => {
    const heartbeatTimer = window.setInterval(() => {
      const prof = realCourierProfileRef.current;
      if (prof.isRegistered && prof.name.trim().length > 0 && !state.isAppPaused) {
        const updated: RealCourierMapProfile = {
          ...prof,
          updated_at: new Date().toISOString(),
        };
        void syncProfileToSupabaseAndLocalCache(updated);
      }
      broadcastAllLocalIdentitiesToCloud();
    }, 10000);
    return () => window.clearInterval(heartbeatTimer);
  }, [
    state.isAppPaused,
    syncProfileToSupabaseAndLocalCache,
    broadcastAllLocalIdentitiesToCloud,
  ]);

  // Immediately broadcast GPS coordinate updates whenever realCourierProfile.lat / lng changes
  useEffect(() => {
    if (
      realCourierProfile.isRegistered &&
      realCourierProfile.name.trim().length > 0 &&
      !state.isAppPaused
    ) {
      void publishCourierPresenceToCloud({ profile: realCourierProfile });
    }
  }, [
    realCourierProfile.lat,
    realCourierProfile.lng,
    realCourierProfile.status,
    realCourierProfile.has_order,
    realCourierProfile.isRegistered,
    realCourierProfile.name,
    state.isAppPaused,
  ]);

  // Poll & subscribe via WebSockets (postgres_changes) to public.couriers and public.direct_messages
  useEffect(() => {
    let isMounted = true;

    const pollCouriersAndMessages = async () => {
      const res = await fetchCouriersFromSupabaseRest({
        supabaseUrl: state.aiAgentConfig.supabaseUrl,
        supabaseAnonKey: state.aiAgentConfig.supabaseAnonKey,
      });

      if (!isMounted) return;

      const selfProf = realCourierProfileRef.current;
      const isSelfValid =
        Boolean(selfProf.isRegistered) && selfProf.name.trim().length > 0;

      const selfRow: SupabaseCourierRow | null = isSelfValid
        ? {
            id: selfProf.id,
            name: selfProf.name.trim(),
            vehicle: selfProf.vehicle,
            status: selfProf.status,
            has_order: selfProf.has_order,
            lat: selfProf.lat,
            lng: selfProf.lng,
            zone: selfProf.zone,
            reputation: selfProf.reputation || 100,
            buddy_since: selfProf.buddy_since || 'Fundador • Out 2026',
            updated_at: selfProf.updated_at || new Date().toISOString(),
            avatar_url: selfProf.avatar_url,
            active_platforms: selfProf.active_platforms,
            device_model:
              selfProf.device_model || deviceScreenProfile.deviceModel,
            screen_aspect_ratio:
              selfProf.screen_aspect_ratio ||
              deviceScreenProfile.screenAspectRatio,
          }
        : null;

      // Also sync remote AI skill logs from public.ai_skill_logs
      const remoteSkillLogs = await fetchAiSkillLogsFromSupabaseRest({
        supabaseUrl: state.aiAgentConfig.supabaseUrl,
        supabaseAnonKey: state.aiAgentConfig.supabaseAnonKey,
      });
      if (isMounted && remoteSkillLogs.length > 0) {
        setState((prev) => {
          const existingIds = new Set(prev.aiSkillLogs.map((l) => l.id));
          const newRemote = remoteSkillLogs.filter(
            (r) => !existingIds.has(r.id)
          );
          if (newRemote.length === 0) return prev;
          return {
            ...prev,
            aiSkillLogs: [...newRemote, ...prev.aiSkillLogs],
          };
        });
      }

      if (res.ok && res.rows.length > 0) {
        const validRemoteRows = res.rows.filter(
          (r) =>
            r.name &&
            r.name.trim().length > 0 &&
            !isGhostDuplicateOfSelf(r.id, r.name, selfProf.id, selfProf.name)
        );
        if (selfRow) {
          const hasSelfInRemote = validRemoteRows.some(
            (r) => r.id === selfRow.id
          );
          const merged = hasSelfInRemote
            ? validRemoteRows.map((r) =>
                r.id === selfRow.id
                  ? {
                      ...r,
                      ...selfRow,
                      avatar_url: selfRow.avatar_url || r.avatar_url,
                      active_platforms:
                        selfRow.active_platforms || r.active_platforms,
                    }
                  : r
              )
            : [selfRow, ...validRemoteRows];
          setSupabaseLiveCouriers(merged);
        } else {
          setSupabaseLiveCouriers(validRemoteRows);
        }
      } else if (selfRow) {
        setSupabaseLiveCouriers((prev) => {
          const others = prev.filter(
            (r) =>
              r.id !== selfRow.id &&
              r.name &&
              r.name.trim().length > 0 &&
              !isGhostDuplicateOfSelf(r.id, r.name, selfProf.id, selfProf.name)
          );
          return [selfRow, ...others];
        });
      }

      // Also sync 1-on-1 direct messages from public.direct_messages when registered
      if (isSelfValid) {
        const dms = await fetchDirectMessagesFromSupabaseRest({
          supabaseUrl: state.aiAgentConfig.supabaseUrl,
          supabaseAnonKey: state.aiAgentConfig.supabaseAnonKey,
          myCourierId: selfProf.id,
        });
        if (isMounted && dms.length > 0) {
          setState((prev) => {
            let dmChanged = false;
            const updatedCouriers = prev.onlineDirectoryCouriers.map((c) => {
              const relevantDms = dms.filter(
                (m) =>
                  m.channel_type === 'DIRECT_1ON1' &&
                  ((m.sender_id === selfProf.id && m.recipient_id === c.id) ||
                    (m.sender_id === c.id && m.recipient_id === selfProf.id))
              );
              if (relevantDms.length === 0) return c;
              const existingIds = new Set(c.directMessages.map((dm) => dm.id));
              const newItems = relevantDms
                .filter((m) => !existingIds.has(m.id))
                .map((m) => ({
                  id: m.id,
                  sender: (m.sender_id === selfProf.id ? 'EU' : 'COLEGA') as
                    | 'EU'
                    | 'COLEGA',
                  text: m.message_body,
                  timestamp: new Date(m.created_at).toLocaleTimeString(
                    'pt-PT',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  ),
                }));
              if (newItems.length === 0) return c;
              dmChanged = true;
              return {
                ...c,
                contactPermission: 'APROVADO' as const,
                directMessages: [...c.directMessages, ...newItems],
              };
            });
            return dmChanged
              ? { ...prev, onlineDirectoryCouriers: updatedCouriers }
              : prev;
          });
        }
      }
    };

    void pollCouriersAndMessages();
    connectSupabaseRealtimeSocket(
      state.aiAgentConfig.supabaseUrl,
      state.aiAgentConfig.supabaseAnonKey,
      () => {
        if (isMounted) {
          void pollCouriersAndMessages();
        }
      }
    );
    const intervalId = window.setInterval(pollCouriersAndMessages, 3000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [state.aiAgentConfig.supabaseUrl, state.aiAgentConfig.supabaseAnonKey]);

  // =========================================================================
  // AUTOMATIC INCOMING ORDER DETECTION & INSTANT CALCULATION ENGINE
  // =========================================================================
  const dismissAutoDetectedOfferBanner = useCallback(() => {
    setLastAutoDetectedOfferBanner(null);
    if (autoOfferBannerTimerRef.current !== null) {
      window.clearTimeout(autoOfferBannerTimerRef.current);
      autoOfferBannerTimerRef.current = null;
    }
  }, []);

  const openAndroidAccessibilitySettings = useCallback(() => {
    setAutoOfferDetectorEnabled(true);
    if (typeof window !== 'undefined') {
      const winAny = window as unknown as {
        BuddyNativeOverlay?: {
          openAccessibilitySettings?: () => void;
        };
      };
      if (
        typeof winAny.BuddyNativeOverlay?.openAccessibilitySettings ===
        'function'
      ) {
        try {
          winAny.BuddyNativeOverlay.openAccessibilitySettings();
          speakTextPt(
            'A abrir definições de Acessibilidade do Android. Ative o Auto-Detetor Delivery Buddy.'
          );
          return;
        } catch {
          // ignore
        }
      }
    }
    speakTextPt(
      'Auto-Detetor de Pedidos Uber e Glovo ativo em segundo plano.'
    );
  }, [speakTextPt]);

  const triggerAutoDetectedOffer = useCallback(
    (euros: number, km: number, platformRaw = 'Glovo') => {
      const safeEuros = Number(
        Math.max(1.5, Math.min(150, Number(euros) || 5.5)).toFixed(2)
      );
      const safeKm = Number(
        Math.max(0.3, Math.min(90, Number(km) || 3.1)).toFixed(1)
      );
      const rawPlatLower = (platformRaw || '').toLowerCase();
      const normalizedPlatform: PlatformName = rawPlatLower.includes('uber')
        ? 'Uber Eats'
        : rawPlatLower.includes('bolt')
          ? 'Bolt Food'
          : 'Glovo';

      // Fuel + wear + tax/fleet cost so 5.50€ for 3.1km yields ~4.70€ net (1.51€/km)
      const effectiveCostPerKm = Math.max(0.258, totalCostPerKm);
      const netProfitEur = Number(
        Math.max(0.2, safeEuros - safeKm * effectiveCostPerKm).toFixed(2)
      );
      const netEurPerKm = Number((netProfitEur / safeKm).toFixed(2));
      const minTargetPerKm = Math.max(
        1.0,
        state.userPrefs.minNetProfitPerKmEur || 1.15
      );
      const minTargetGross = Math.max(
        3.5,
        state.userPrefs.minGrossOrderValueEur || 4.0
      );
      const passes =
        netEurPerKm >= minTargetPerKm && safeEuros >= minTargetGross;
      const verdictLabel: 'COMPENSA ACEITAR' | 'RECUSAR OFERTA' = passes
        ? 'COMPENSA ACEITAR'
        : 'RECUSAR OFERTA';

      const spokenPlat =
        normalizedPlatform === 'Uber Eats'
          ? 'Uber Eats'
          : normalizedPlatform === 'Bolt Food'
            ? 'Bolt Food'
            : 'Glovo';

      const eurosSpoken = safeEuros.toFixed(2).replace('.', ',');
      const kmSpoken = safeKm.toFixed(1).replace('.', ',');
      const netSpoken = netProfitEur.toFixed(2).replace('.', ',');
      const perKmSpoken = netEurPerKm.toFixed(2).replace('.', ',');

      const spokenSummary = `Nova oferta ${spokenPlat}: ${eurosSpoken}€ para ${kmSpoken} km. Lucro líquido: ${netSpoken}€ (${perKmSpoken}€/km). ${
        passes ? 'Compensa aceitar!' : 'Abaixo da meta, recusar!'
      }`;

      const nowTime = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const autoOrderId = `#AUTO-${Date.now().toString().slice(-4)}`;

      setActiveScannedOffer((prev) => ({
        ...prev,
        id: `SCAN-AUTO-${Date.now()}`,
        orderId: autoOrderId,
        platform: normalizedPlatform,
        grossAmountEur: safeEuros,
        appAnnouncedKm: safeKm,
        estimatedMinutes: Math.max(6, Math.round(safeKm * 3.8)),
        originName: `${normalizedPlatform} • Amarante Centro`,
        destinationName: 'Cliente Amarante (Deteção Automática)',
        segmentText: `${normalizedPlatform} (${safeEuros.toFixed(2)} € / ${safeKm.toFixed(1)} km)`,
      }));

      const bannerObj: AutoDetectedOfferBannerState = {
        id: `AUTO-BANNER-${Date.now()}`,
        platform: normalizedPlatform,
        grossEur: safeEuros,
        realKm: safeKm,
        netProfitEur,
        netEurPerKm,
        verdictLabel,
        passes,
        spokenSummary,
        detectedAt: nowTime,
      };
      setLastAutoDetectedOfferBanner(bannerObj);
      if (autoOfferBannerTimerRef.current !== null) {
        window.clearTimeout(autoOfferBannerTimerRef.current);
      }
      autoOfferBannerTimerRef.current = window.setTimeout(() => {
        setLastAutoDetectedOfferBanner(null);
        autoOfferBannerTimerRef.current = null;
      }, 9500);

      showLiveMicTranscriptFeedback(
        `⚡ Auto-Oferta ${normalizedPlatform}: ${safeEuros.toFixed(2)}€ / ${safeKm.toFixed(1)}km → Líq: ${netProfitEur.toFixed(2)}€ (${netEurPerKm.toFixed(2)}€/km)`,
        `Oferta ${normalizedPlatform} (${safeEuros.toFixed(2)}€ • ${safeKm.toFixed(1)} km)`,
        `${verdictLabel} • Lucro Líquido: +${netProfitEur.toFixed(2)}€ (${netEurPerKm.toFixed(2)}€/km)`
      );

      speakTextPt(spokenSummary);
    },
    [
      totalCostPerKm,
      state.userPrefs.minNetProfitPerKmEur,
      state.userPrefs.minGrossOrderValueEur,
      showLiveMicTranscriptFeedback,
      speakTextPt,
    ]
  );

  // Register global window.onAutoOfferDetected(euros, km, platform) from Android AccessibilityService / Screenshot Watcher
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const winAny = window as unknown as {
      onAutoOfferDetected?: (
        euros: number,
        km: number,
        platform: string
      ) => void;
    };
    winAny.onAutoOfferDetected = (
      euros: number,
      km: number,
      platform: string
    ) => {
      triggerAutoDetectedOffer(euros, km, platform);
    };
    return () => {
      if (winAny.onAutoOfferDetected) {
        delete winAny.onAutoOfferDetected;
      }
    };
  }, [triggerAutoDetectedOffer]);

  // =========================================================================
  // STEP 12 & 13 COMPLETE VOICE COMMAND TREE ("COMANDOS BUDDY" VS "COMANDOS UBER / GLOVO / BOLT")
  // =========================================================================
  const executeVoiceCommandPt = useCallback(
    (
      spokenPhrase: string
    ): { commandMatched: string; actionSummary: string } => {
      const clean = spokenPhrase.trim();
      const rawLower = clean
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const triggerLower = (
        state.voiceActivationConfig.customTriggerWord || 'Buddy'
      )
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      // Normalize custom trigger word & Portuguese/Android phonetic aliases ("badi", "budi", "body", "bady", "bode", "bad", "bade", "bud", "bandi", "buney", "buni", "boni", "bunny", "bani", "bari", "pare") to "buddy"
      let lower =
        triggerLower && triggerLower !== 'buddy' && rawLower.includes(triggerLower)
          ? rawLower.replace(triggerLower, 'buddy')
          : rawLower;
      lower = lower
        .replace(
          /\b(badi|budi|body|bady|bode|bad|bade|bud|bandi|buney|buni|boni|bunny|bani|bari|pare)\b/gi,
          'buddy'
        )
        .replace(/\bminimizer\b/gi, 'minimizar')
        .replace(/\bmaximizer\b/gi, 'maximizar');

      // Strip leading wake-word so no "Buddy" wake-word is ever required
      const intentLower = lower
        .replace(/^(ei\s+|oi\s+|ola\s+|hey\s+)?(buddy\s*)+/i, '')
        .trim();

      const nowStr = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      let commandMatched = 'Comando Geral Reconhecido';
      let actionSummary = '';

      // ---------------------------------------------------------------------
      // 0A. VOICE OFFER CALCULATION WHEN NUMBERS ARE SPOKEN (e.g. "5 euros 3 km" or "oferta 6 por 4")
      // ---------------------------------------------------------------------
      const numberMatches = intentLower.match(/\d+(?:[.,]\d+)?/g);
      if (
        numberMatches &&
        numberMatches.length >= 2 &&
        (intentLower.includes('euro') ||
          intentLower.includes('km') ||
          intentLower.includes('quilometro') ||
          intentLower.includes('oferta') ||
          intentLower.includes('calcul') ||
          intentLower.includes('por') ||
          intentLower.includes('para'))
      ) {
        const parsedEuros = parseFloat(numberMatches[0].replace(',', '.'));
        const parsedKm = parseFloat(numberMatches[1].replace(',', '.'));
        if (
          Number.isFinite(parsedEuros) &&
          Number.isFinite(parsedKm) &&
          parsedEuros > 0 &&
          parsedKm > 0
        ) {
          const plat = lower.includes('uber')
            ? 'Uber Eats'
            : lower.includes('bolt')
              ? 'Bolt Food'
              : lower.includes('glovo')
                ? 'Glovo'
                : activeScannedOffer.platform;
          triggerAutoDetectedOffer(parsedEuros, parsedKm, plat);
          commandMatched = `"Calcular Oferta (${parsedEuros.toFixed(2)}€ / ${parsedKm.toFixed(1)}km)"`;
          actionSummary = `Oferta calculada automaticamente: ${parsedEuros.toFixed(2)}€ para ${parsedKm.toFixed(1)} km.`;
          const resultObj = {
            phrase: clean,
            commandMatched,
            actionSummary,
            timestamp: nowStr,
          };
          setLastVoiceCommandResult(resultObj);
          return { commandMatched, actionSummary };
        }
      }

      // ---------------------------------------------------------------------
      // 0B. MODO NOTURNO / ESCURO / CLARO VOICE COMMAND
      // ---------------------------------------------------------------------
      if (
        /noturno|escuro|noite|modo claro|tema claro|modo dia/.test(lower)
      ) {
        const wantLight =
          lower.includes('claro') || lower.includes('modo dia');
        const nextMode: AppThemeMode = wantLight
          ? 'DAYLIGHT'
          : lower.includes('noturno') ||
              lower.includes('escuro') ||
              lower.includes('noite')
            ? 'NIGHT'
            : state.themeMode === 'DAYLIGHT'
              ? 'NIGHT'
              : 'DAYLIGHT';
        try {
          sessionStorage.setItem('buddy_manual_theme_choice', nextMode);
        } catch {
          // ignore
        }
        setState((prev) => ({ ...prev, themeMode: nextMode }));
        const tts =
          nextMode === 'NIGHT'
            ? 'Modo noturno ativado.'
            : 'Modo claro ativado.';
        commandMatched =
          nextMode === 'NIGHT' ? '"Modo Noturno"' : '"Modo Claro"';
        actionSummary = tts;
        showLiveMicTranscriptFeedback(
          `✅ Comando: "${clean}" → ${tts}`,
          clean,
          tts
        );
        speakTextPt(tts);
        const resultObj = {
          phrase: clean,
          commandMatched,
          actionSummary,
          timestamp: nowStr,
        };
        setLastVoiceCommandResult(resultObj);
        return { commandMatched, actionSummary };
      }

      // ---------------------------------------------------------------------
      // 0. INSTANT ALERT & AUDIO DISMISSAL ("Cancelar alerta" / "Cancelar" / "Limpar")
      // ---------------------------------------------------------------------
      if (
        lower.includes('cancelar alerta') ||
        lower === 'cancelar' ||
        lower.includes('fechar alerta') ||
        lower.includes('parar áudio') ||
        lower.includes('parar audio')
      ) {
        stopAllLiveVoiceTimersAndRec();
        cancelSpeechNow();
        setEphemeralVoiceOverlay(null);
        setLiveVoiceTranscription(null);
        commandMatched = '"Cancelar alerta" (Pop-up e Áudio Interrompidos)';
        actionSummary =
          'Alerta e transcrição fechados, e leitura de voz (TTS) interrompida imediatamente.';
        const resultObj = {
          phrase: clean,
          commandMatched,
          actionSummary,
          timestamp: nowStr,
        };
        setLastVoiceCommandResult(resultObj);
        return { commandMatched, actionSummary };
      }

      if (lower === 'limpar' || lower.includes('limpar texto')) {
        if (wordStreamTimerRef.current !== null) {
          window.clearInterval(wordStreamTimerRef.current);
          wordStreamTimerRef.current = null;
        }
        if (sendCountdownTimerRef.current !== null) {
          window.clearInterval(sendCountdownTimerRef.current);
          sendCountdownTimerRef.current = null;
        }
        setLiveVoiceTranscription((prev) =>
          prev
            ? {
                ...prev,
                transcriptText: '',
                fullTargetText: '',
                isEditingText: true,
                phase: 'LISTENING_STREAMING',
              }
            : null
        );
        commandMatched = '"Limpar" (Texto da Transcrição Limpo)';
        actionSummary =
          'Texto da transcrição ao vivo limpo. Pronto para ditar ou editar novamente.';
        const resultObj = {
          phrase: clean,
          commandMatched,
          actionSummary,
          timestamp: nowStr,
        };
        setLastVoiceCommandResult(resultObj);
        return { commandMatched, actionSummary };
      }

      // ---------------------------------------------------------------------
      // 0C. HIGHEST-PRIORITY MINIMIZE & MAXIMIZE / RESTORE APP SCREEN COMMANDS
      // ---------------------------------------------------------------------
      const isSpecificSubPageOpenCommand =
        lower.includes('mapa') ||
        lower.includes('zona') ||
        lower.includes('radar') ||
        lower.includes('estatistica') ||
        lower.includes('chat') ||
        lower.includes('social') ||
        lower.includes('radio') ||
        lower.includes('buddys') ||
        lower.includes('comunidade') ||
        lower.includes('colega') ||
        lower.includes('ajust') ||
        lower.includes('config') ||
        lower.includes('defin') ||
        lower.includes('inicio') ||
        lower.includes('início') ||
        lower.includes('home') ||
        lower.includes('oferta') ||
        lower.includes('clima') ||
        lower.includes('tempo') ||
        lower.includes('meteorologia') ||
        lower.includes('temperatura') ||
        lower.includes('graus') ||
        lower.includes('chuva') ||
        lower.includes('acordo') ||
        lower.includes('prova') ||
        lower.includes('dossie') ||
        lower.includes('scanner') ||
        lower.includes('finan') ||
        lower.includes('ganho') ||
        lower.includes('lucro') ||
        lower.includes('dinheiro') ||
        lower.includes('carteira') ||
        lower.includes('predefini') ||
        lower.includes('calculadora') ||
        lower.includes('traduz') ||
        lower.includes('tradutor') ||
        lower.includes('libras') ||
        lower.includes('gestual') ||
        lower.includes('maos do buddy') ||
        lower.includes('passadeira') ||
        lower.includes('travessia');

      if (
        (lower.includes('maximizar') ||
          lower.includes('maximizer') ||
          lower.includes('maximiz') ||
          lower.includes('restaurar') ||
          lower.includes('voltar') ||
          lower.includes('mostrar') ||
          lower.includes('sair do modo invisivel') ||
          lower.includes('sair modo invisivel') ||
          lower.includes('ecra') ||
          lower.includes('tela') ||
          lower.includes('abrir')) &&
        !isSpecificSubPageOpenCommand &&
        !lower.includes('bloquear') &&
        !lower.includes('desbloquear')
      ) {
        stopAllLiveVoiceTimersAndRec();
        setEphemeralVoiceOverlay(null);
        setLiveVoiceTranscription(null);
        setIsBubbleMinimized(false);
        if (state.isAppPaused) {
          toggleAppPauseMode();
        }
        commandMatched = '"Maximizar"';
        actionSummary = 'Aplicação em primeiro plano.';
        playBuddyConfirmationChime();
        const resultObj = {
          phrase: clean,
          commandMatched,
          actionSummary,
          timestamp: nowStr,
        };
        setLastVoiceCommandResult(resultObj);
        return { commandMatched, actionSummary };
      }

      if (
        lower.includes('minimizar') ||
        lower.includes('minimizer') ||
        lower.includes('minimiz') ||
        lower.includes('fechar') ||
        lower.includes('modo invisivel') ||
        lower.includes('esconder') ||
        lower.includes('ocultar') ||
        lower.includes('bolinha') ||
        lower.includes('bolha')
      ) {
        stopAllLiveVoiceTimersAndRec();
        setEphemeralVoiceOverlay(null);
        setLiveVoiceTranscription(null);
        showLiveMicTranscriptFeedback(
          `✅ Comando: "${clean}" → A minimizar.`,
          clean,
          'Minimizar → A minimizar para Bolha DB.'
        );
        setIsBubbleMinimized(true);
        if (typeof window !== 'undefined') {
          const winAny = window as unknown as {
            BuddyNativeOverlay?: {
              minimizeToFloatingBubble?: () => void;
            };
          };
          try {
            winAny.BuddyNativeOverlay?.minimizeToFloatingBubble?.();
          } catch {
            // ignore
          }
        }
        commandMatched = '"Minimizar" (Modo Minimizado Ativo)';
        actionSummary = 'A minimizar.';
        speakTextPt('A minimizar.');
        const resultObj = {
          phrase: clean,
          commandMatched,
          actionSummary,
          timestamp: nowStr,
        };
        setLastVoiceCommandResult(resultObj);
        return { commandMatched, actionSummary };
      }

      // Check custom user-configured auto-messages (excluding "dividir pedido" which triggers the 4-step macro)
      const matchedAutoMsg = state.customAutoMessages.find((m) => {
        const trig = m.voiceTriggerPhrase.trim().toLowerCase();
        if (!trig || trig === 'dividir pedido') return false;
        return (
          rawLower === trig ||
          lower === trig ||
          (trig.length > 5 && (rawLower.includes(trig) || lower.includes(trig)))
        );
      });

      if (matchedAutoMsg) {
        commandMatched = `Mensagem Automática (${matchedAutoMsg.category}): "${matchedAutoMsg.title}"`;
        try {
          navigator.clipboard?.writeText(matchedAutoMsg.messageBody);
        } catch {
          // ignore clipboard error
        }
        const catLabel =
          matchedAutoMsg.category === 'CLIENTE'
            ? 'Cliente da Entrega'
            : matchedAutoMsg.category === 'SUPORTE'
              ? `Suporte ${activeScannedOffer.platform}`
              : 'Comunidade Estafetas (Buddys)';
        const tts = `Mensagem rápida para ${catLabel} copiada e pronta: ${matchedAutoMsg.messageBody}`;
        triggerEphemeralOverlayCard({
          cardCategory:
            matchedAutoMsg.category === 'SUPORTE'
              ? 'SUPORTE_PLATAFORMA'
              : 'MENSAGEM_AMIZADE',
          commandSpoken: clean,
          title: `Auto-Mensagem • ${catLabel}`,
          subtitle: matchedAutoMsg.title,
          primaryMetricLabel: 'Texto Copiado / Pronto p/ Envio',
          primaryMetricValue: matchedAutoMsg.messageBody,
          secondaryDetails: [
            `Categoria: ${catLabel}`,
            `Comando de Voz: "${matchedAutoMsg.voiceTriggerPhrase}"`,
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
        const resultObj = {
          phrase: clean,
          commandMatched,
          actionSummary,
          timestamp: nowStr,
        };
        setLastVoiceCommandResult(resultObj);
        return { commandMatched, actionSummary };
      }

      // ---------------------------------------------------------------------
      // 1. MANDATORY 2-STEP SOS CONFIRMATION ("Ativar SOS" -> "Confirmar SOS")
      // ---------------------------------------------------------------------
      if (lower.includes('confirmar sos') || lower.includes('confirmar emergência')) {
        commandMatched = '"Confirmar SOS" (2.ª Etapa Confirmada)';
        setSosPendingConfirmation({ isPending: false, secondsRemaining: 0 });
        triggerSosEmergencyBeacon('Acidente na Via');
        actionSummary =
          'SOS de Emergência confirmado em 2 etapas! Microfone aberto mãos-livres e GPS exato transmitido.';
        triggerEphemeralOverlayCard({
          cardCategory: 'SOS_CONFIRMACAO',
          commandSpoken: clean,
          title: 'SOS de Emergência Ativo (2/2 Confirmado)',
          subtitle: 'Microfone aberto mãos-livres e GPS exato transmitido',
          primaryMetricLabel: 'Estado da Baliza SOS',
          primaryMetricValue: 'Transmitindo em Direto (Raio 3 km)',
          secondaryDetails: [
            'Áudio ambiente e localização exata partilhados na zona',
            'Prova legal registada automaticamente no sistema',
          ],
          spokenTextPtBr:
            'SOS confirmado! Microfone de emergência aberto e localização exata enviada aos colegas.',
        });
      } else if (
        lower.includes('ativar sos') ||
        lower.includes('emergência sos') ||
        lower.includes('emergencia') ||
        lower.includes('emerg') ||
        lower.includes('socorro') ||
        lower.includes('acidente') ||
        lower.includes('ajuda') ||
        lower === 'sos' ||
        lower.includes('sos')
      ) {
        commandMatched = '"Ativar SOS" (1.ª Etapa — Aguardando Confirmação)';
        requestOrConfirmSosActivation('Acidente na Via');
        actionSummary =
          "Janela de segurança de 5s aberta: Diga 'Confirmar SOS' ou toque novamente para abrir o microfone de emergência.";
      }
      // ---------------------------------------------------------------------
      // 1B. CLIMA / TEMPO / CHUVA / METEOROLOGIA / TEMPERATURA / GRAUS (HIGH PRIORITY)
      // ---------------------------------------------------------------------
      else if (
        lower.includes('modo chuva') ||
        lower.includes('proteção chuva') ||
        lower.includes('protecao chuva') ||
        lower.includes('bloquear ecrã') ||
        lower.includes('bloquear tela')
      ) {
        commandMatched = '"Modo Chuva" (Escudo Anti-Gotas Ativo)';
        setRainLockActive(true);
        const tts =
          'Modo Chuva ativado. Ecrã bloqueado contra toques de água. Toque 3 vezes no canto superior direito para desbloquear.';
        speakTextPt(tts);
        actionSummary = tts;
      } else if (
        /clima|tempo|chuva|meteorologia|temperatura|graus/.test(lower)
      ) {
        commandMatched = '"Clima de Amarante"';
        actionSummary = `A abrir Clima de Amarante (${amaranteLiveWeather.temperatureC.toFixed(1)} °C, ${amaranteLiveWeather.conditionLabel}, chuva ${amaranteLiveWeather.rainMm.toFixed(1)} mm).`;
        showLiveMicTranscriptFeedback(
          `✅ Comando: "${clean}" → A abrir Clima de Amarante`,
          clean,
          `Clima de Amarante → ${amaranteLiveWeather.temperatureC.toFixed(1)}°C, ${amaranteLiveWeather.conditionLabel}`
        );
        void openAndFetchAmaranteWeather(true);
      }
      // ---------------------------------------------------------------------
      // 1C. DIVIDIR PEDIDO / PESO / QUILOS / KG / SUPORTE (HIGH PRIORITY)
      // ---------------------------------------------------------------------
      else if (
        /dividir|peso|pesado|quilos|\bkg\b|suporte/.test(lower) &&
        !lower.includes('reportar problema')
      ) {
        const targetPlatform: PlatformName = lower.includes('uber')
          ? 'Uber Eats'
          : lower.includes('glovo')
            ? 'Glovo'
            : activeScannedOffer.platform ||
              state.activeDeliveryLifecycle.platform ||
              'Glovo';

        commandMatched = '"Dividir Pedido & Peso"';
        setIsBubbleMinimized(false);
        setCourierWorkspaceSection('AREA_PRIVADA');
        setActiveTab('scanner');
        setScannerActiveMainView('DIVIDIDO_PESO');
        if (totalAuditedWeightKg <= state.backpackWeightLimitKg) {
          setAuditedOrderItemsPreset('OVERWEIGHT_27KG');
        }
        triggerSupportSplitOrderMacro(targetPlatform);

        const realOrderId =
          activeScannedOffer.orderId ||
          state.activeDeliveryLifecycle.orderId ||
          `#410${activeScannedOffer.presetNumber || 1}`;
        const realKg = Number(Math.max(14.8, totalAuditedWeightKg).toFixed(1));

        actionSummary = `A calcular peso do pedido (${realKg.toFixed(1)} kg). Mensagem de divisão (${targetPlatform} ${realOrderId}) copiada para o suporte.`;
        showLiveMicTranscriptFeedback(
          `✅ Comando: "${clean}" → Dividido & Peso (${realKg.toFixed(1)} kg)`,
          clean,
          actionSummary
        );
      }
      // ---------------------------------------------------------------------
      // 1D. SIMULTANEOUS TRANSLATOR & LIBRAS ("MÃOS DO BUDDY") VOICE TRIGGER
      // ---------------------------------------------------------------------
      else if (
        /traduz|tradutor|libras|lingua gestual|maos do buddy|surdo|ingles|frances|espanhol|alemao|italiano|ucraniano|hindi|mandarim|chines/.test(
          lower
        )
      ) {
        const wantLibras =
          lower.includes('libras') ||
          lower.includes('gestual') ||
          lower.includes('maos do buddy') ||
          lower.includes('surdo');

        const detectedLang:
          | 'en-US'
          | 'fr-FR'
          | 'es-ES'
          | 'de-DE'
          | 'it-IT'
          | 'uk-UA'
          | 'hi-IN'
          | 'zh-CN' = lower.includes('frances')
          ? 'fr-FR'
          : lower.includes('espanhol')
            ? 'es-ES'
            : lower.includes('alemao')
              ? 'de-DE'
              : lower.includes('italiano')
                ? 'it-IT'
                : lower.includes('ucraniano')
                  ? 'uk-UA'
                  : lower.includes('hindi')
                    ? 'hi-IN'
                    : lower.includes('mandarim') || lower.includes('chines')
                      ? 'zh-CN'
                      : 'en-US';

        openTranslatorModal(
          wantLibras ? 'LIBRAS' : 'TRADUTOR',
          detectedLang
        );

        commandMatched = wantLibras
          ? '"Abrir Libras — Mãos do Buddy"'
          : '"Abrir Tradutor Simultâneo"';
        actionSummary = wantLibras
          ? 'Ecrã Libras (Mãos do Buddy) aberto para comunicação visual com o cliente.'
          : 'Tradutor simultâneo Estafeta e Cliente aberto.';
        showLiveMicTranscriptFeedback(
          `✅ Comando: "${clean}" → ${actionSummary}`,
          clean,
          actionSummary
        );
        speakTextPt(actionSummary);
      }
      // ---------------------------------------------------------------------
      // 2. DEEP-LINK VOICE OPENING ("Mapa", "Finanças", "Buddys", "Ajustes", "Início")
      // ---------------------------------------------------------------------
      else if (
        lower.includes('abrir buddy no mapa') ||
        lower.includes('abrir no mapa') ||
        lower.includes('abrir mapa') ||
        lower.includes('radar') ||
        lower === 'mapa' ||
        lower === 'buddy mapa' ||
        (lower.includes('mapa') && !lower.includes('perigo'))
      ) {
        commandMatched = '"Abrir Mapa de Amarante"';
        setIsBubbleMinimized(false);
        setCourierWorkspaceSection('AREA_PUBLICA_SOCIAL');
        setActiveTab('radar');
        actionSummary = 'A abrir Mapa de Amarante (25 km).';
        speakTextPt('A abrir Mapa de Amarante.');
      } else if (
        lower.includes('abrir buddy nas estatísticas') ||
        lower.includes('abrir buddy nas estatisticas') ||
        lower.includes('abrir estatísticas') ||
        lower.includes('abrir estatisticas')
      ) {
        commandMatched = '"Abrir Buddy nas Estatísticas"';
        setIsBubbleMinimized(false);
        setCourierWorkspaceSection('AREA_PRIVADA');
        setActiveTab('financas');
        actionSummary =
          'Interface completa aberta diretamente em Área Privada -> Minhas Estatísticas & Metas.';
        triggerEphemeralOverlayCard({
          cardCategory: 'MINHAS_ESTATISTICAS',
          commandSpoken: clean,
          title: 'Minhas Estatísticas & Metas Abertas',
          subtitle: 'Navegação por Voz Mãos-Livres',
          primaryMetricLabel: 'Meta Diária Líquida',
          primaryMetricValue: `${state.personalGoals.currentDailyNetEarnedEur.toFixed(2)} € / ${state.personalGoals.dailyNetGoalEur.toFixed(0)} €`,
          secondaryDetails: [
            'Comparativo Global, Uber Eats, Glovo e Bolt Food disponível',
            'Dados financeiros 100% privados',
          ],
          spokenTextPtBr:
            'Abrindo o Delivery Buddy nas suas Estatísticas Privadas.',
        });
      } else if (
        lower.includes('abrir buddy no chat') ||
        lower.includes('abrir no chat') ||
        lower.includes('abrir chat') ||
        lower.includes('abrir social') ||
        lower.includes('abrir rádio') ||
        lower.includes('abrir radio') ||
        lower.includes('colega')
      ) {
        commandMatched = '"Abrir Social Buddys & Chat"';
        setIsBubbleMinimized(false);
        setCourierWorkspaceSection('AREA_PUBLICA_SOCIAL');
        setActiveTab('walkietalkie');
        actionSummary = 'A abrir Comunidade Buddys e Rádio.';
        speakTextPt('A abrir Comunidade Buddys.');
      } else if (
        lower.includes('acordos de zona') ||
        lower.includes('acordo de zona') ||
        lower.includes('abrir acordos')
      ) {
        commandMatched = '"Abrir Acordos de Zona"';
        setIsBubbleMinimized(false);
        setActiveTab('menu_mais');
        actionSummary =
          'Abrindo Ajustes -> Acordos de Zona (Regras coletivas de piso mínimo em Amarante).';
        triggerEphemeralOverlayCard({
          cardCategory: 'DEMANDA_ZONA',
          commandSpoken: clean,
          title: 'Acordos de Zona (Amarante)',
          subtitle: 'Regras Coletivas de Piso Mínimo',
          primaryMetricLabel: 'Acordo Ativo na Zona',
          primaryMetricValue: '>= 5,00 € e >= 1,25 €/km',
          secondaryDetails: [
            'Disponível em Ajustes -> Acordos de Zona',
            '34 estafetas aderiram em Amarante Centro / São Gonçalo',
          ],
          spokenTextPtBr: 'Abrindo Acordos de Zona nos Ajustes.',
        });
      } else if (
        lower.includes('arquivo de provas') ||
        lower.includes('dossiê de provas') ||
        lower.includes('dossie de provas') ||
        lower.includes('abrir provas')
      ) {
        commandMatched = '"Abrir Arquivo de Provas"';
        setIsBubbleMinimized(false);
        setActiveTab('reclamacoes');
        actionSummary =
          'Abrindo Arquivo de Provas (Dossiê de 5 categorias com histórico de reincidência).';
        triggerEphemeralOverlayCard({
          cardCategory: 'ESTADO_ROTA',
          commandSpoken: clean,
          title: 'Arquivo de Provas Aberto',
          subtitle: 'Dossiê Legal de 5 Categorias & Reincidência',
          primaryMetricLabel: 'Provas Arquivadas',
          primaryMetricValue: `${state.evidentiaryVaultRecords.length} Registos Verificados`,
          secondaryDetails: [
            'Autoridades, Plataformas, Entregadores, Lojas e Locais Zero-PII',
            'Exportação formal em 1 toque disponível',
          ],
          spokenTextPtBr:
            'Abrindo Arquivo de Provas e Dossiê de Evidências.',
        });
      } else if (
        lower.includes('iniciar sessão') ||
        lower.includes('iniciar sessao') ||
        lower === 'abrir buddy'
      ) {
        commandMatched = '"Abrir Buddy" / "Iniciar sessão"';
        setIsBubbleMinimized(false);
        setCourierWorkspaceSection('AREA_PRIVADA');
        setActiveTab('scanner');
        if (state.isAppPaused) {
          toggleAppPauseMode();
        }
        actionSummary =
          'Sessão ativa e interface principal aberta na Área Privada (Scanner de Ofertas).';
        speakTextPt('Sessão iniciada. Painel principal do Delivery Buddy aberto.');
      } else if (
        lower.includes('finalizar dia') ||
        lower.includes('encerrar turno') ||
        lower.includes('fechar dia')
      ) {
        commandMatched = '"Finalizar dia"';
        closeGlovoDailyAudit();
        const earned = state.personalGoals.currentDailyNetEarnedEur;
        const deliveries = state.personalGoals.completedDeliveriesToday;
        const kmToday = state.personalGoals.completedKmToday ?? 34.5;
        const tts = `Dia finalizado! Você concluiu ${deliveries} entregas hoje, percorreu ${kmToday
          .toFixed(1)
          .replace('.', ' vírgula ')} quilômetros e acumulou ${earned
          .toFixed(2)
          .replace('.', ' e ')} euros líquidos. Bom descanso!`;
        triggerEphemeralOverlayCard({
          cardCategory: 'MINHAS_ESTATISTICAS',
          commandSpoken: '"Finalizar dia"',
          title: 'Resumo de Fecho do Dia',
          subtitle: `Turno encerrado • Auditoria Glovo fechada`,
          primaryMetricLabel: 'Lucro Líquido do Dia',
          primaryMetricValue: `+${earned.toFixed(2)} € (${deliveries} entregas)`,
          secondaryDetails: [
            `Distância percorrida hoje: ${kmToday.toFixed(1)} km`,
            `Ritmo médio positivo: +18.40 €/h`,
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      }
      // ---------------------------------------------------------------------
      // 3. CATEGORY A: DIRECT "COMANDOS BUDDY" ("Buddy como está...")
      // ---------------------------------------------------------------------
      else if (
        lower.includes('trânsito') ||
        lower.includes('transito')
      ) {
        commandMatched = '"Buddy como está o trânsito hoje / agora"';
        const activeHazards = state.roadHazards.filter((h) => !h.resolved);
        const topHazard =
          activeHazards[0]?.streetLocation ||
          'Ponte de São Gonçalo / Rotunda N15';
        const tts = `Trânsito moderado em ${state.selectedRegionName} com ${activeHazards.length} alertas ativos na via. Atenção redobrada em ${topHazard}.`;
        triggerEphemeralOverlayCard({
          cardCategory: 'TRANSITO',
          commandSpoken: '"O trânsito hoje / agora"',
          title: `Trânsito Agora • ${state.selectedRegionName}`,
          subtitle: 'Resumo em tempo real da zona ativa',
          primaryMetricLabel: 'Estado da Via',
          primaryMetricValue: `Moderado (${activeHazards.length} alertas ativos)`,
          secondaryDetails: [
            `Ponto crítico: ${topHazard}`,
            `Rota alternativa limpa via Av. General Silveira / Ponte Nova (Amarante)`,
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      } else if (
        lower.includes('entregas na localização') ||
        lower.includes('entregas na localizacao') ||
        lower.includes('demanda') ||
        lower.includes('movimento na zona')
      ) {
        commandMatched = '"As entregas na localização"';
        const dataset =
          SEED_REGIONAL_EXPLORER_DATA.find(
            (r) => r.regionName === state.selectedRegionName
          ) || SEED_REGIONAL_EXPLORER_DATA[0];
        const hotCell = dataset.cells[0];
        const tts = `Alta procura em ${dataset.topHotspotZone}. Média atual de ${dataset.avgEurPerKm
          .toFixed(2)
          .replace('.', ' e ')} euros por quilômetro e ${
          hotCell?.avgWaitOrdersCount ?? 15
        } pedidos aguardando coleta.`;
        triggerEphemeralOverlayCard({
          cardCategory: 'DEMANDA_ZONA',
          commandSpoken: '"As entregas na localização"',
          title: `Volume de Entregas • ${state.selectedRegionName}`,
          subtitle: `Hotspot: ${dataset.topHotspotZone}`,
          primaryMetricLabel: 'Rentabilidade & Procura',
          primaryMetricValue: `${dataset.avgEurPerKm.toFixed(2)} €/km • Alta Demanda`,
          secondaryDetails: [
            `Pedidos em fila na zona: ${hotCell?.avgWaitOrdersCount ?? 15} pedidos`,
            `Estafetas online na região: ${dataset.activeCouriersTotal}`,
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      } else if (
        lower.includes('estatísticas entrega atual') ||
        lower.includes('estatisticas entrega atual') ||
        lower.includes('última entrega') ||
        lower.includes('ultima entrega')
      ) {
        commandMatched = '"Estatísticas entrega atual / última entrega"';
        const cur = state.activeDeliveryLifecycle;
        const lastTrip = state.shiftTrips[0];
        const curPerKm = Number(
          (cur.netProfitEur / Math.max(0.1, cur.realKm)).toFixed(2)
        );
        const tts = `Entrega atual ${cur.orderId}: lucro líquido de ${cur.netProfitEur
          .toFixed(2)
          .replace('.', ' e ')} euros, pagando ${curPerKm
          .toFixed(2)
          .replace('.', ' e ')} por quilômetro em ${cur.estimatedMinutes} minutos. Última entrega concluída rendeu ${(
          lastTrip?.netProfitEur ?? 7.48
        )
          .toFixed(2)
          .replace('.', ' e ')} euros.`;
        triggerEphemeralOverlayCard({
          cardCategory: 'ENTREGA_ATUAL_ULTIMA',
          commandSpoken: '"Estatísticas entrega atual / última entrega"',
          title: `Entrega Atual (${cur.orderId}) vs. Última Entrega`,
          subtitle: `${cur.platform} • ${cur.originName}`,
          primaryMetricLabel: 'Lucro Líquido Atual',
          primaryMetricValue: `+${cur.netProfitEur.toFixed(2)} € (${curPerKm.toFixed(2)} €/km)`,
          secondaryDetails: [
            `Tempo estimado atual: ${cur.estimatedMinutes} min (${cur.realKm.toFixed(1)} km)`,
            `Última entrega (${lastTrip?.platform || 'Uber Eats'}): +${(lastTrip?.netProfitEur ?? 7.48).toFixed(2)} € (${(lastTrip?.netEurPerKm ?? 2.34).toFixed(2)} €/km)`,
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      } else if (
        lower.includes('minhas estatísticas') ||
        lower.includes('minhas estatisticas') ||
        lower.includes('estatísticas atuais') ||
        lower.includes('estatisticas atuais') ||
        lower.includes('quanto falta') ||
        lower.includes('meta')
      ) {
        commandMatched = '"Minhas estatísticas atuais" (Privado)';
        const g = state.personalGoals;
        const dailyPct = Math.min(
          100,
          Math.round((g.currentDailyNetEarnedEur / Math.max(1, g.dailyNetGoalEur)) * 100)
        );
        const weeklyPct = Math.min(
          100,
          Math.round((g.currentWeeklyNetEarnedEur / Math.max(1, g.weeklyNetGoalEur)) * 100)
        );
        const monthlyPct = Math.min(
          100,
          Math.round((g.currentMonthlyNetEarnedEur / Math.max(1, g.monthlyNetGoalEur)) * 100)
        );
        const tts = `Suas estatísticas privadas: Hoje você soma ${g.currentDailyNetEarnedEur
          .toFixed(2)
          .replace('.', ' e ')} euros líquidos, ${dailyPct} por cento da meta diária. Na semana: ${weeklyPct} por cento. No mês: ${monthlyPct} por cento.`;
        triggerEphemeralOverlayCard({
          cardCategory: 'MINHAS_ESTATISTICAS',
          commandSpoken: '"Minhas estatísticas atuais"',
          title: 'Minhas Estatísticas Privadas (Zero Exposição Pública)',
          subtitle: `${g.completedDeliveriesToday} entregas hoje • ${(g.completedKmToday ?? 34.5).toFixed(1)} km`,
          primaryMetricLabel: 'Meta Diária Líquida',
          primaryMetricValue: `${g.currentDailyNetEarnedEur.toFixed(2)} € / ${g.dailyNetGoalEur.toFixed(0)} € (${dailyPct}%)`,
          secondaryDetails: [
            `Semanal: ${g.currentWeeklyNetEarnedEur.toFixed(0)} € / ${g.weeklyNetGoalEur.toFixed(0)} € (${weeklyPct}%)`,
            `Mensal: ${g.currentMonthlyNetEarnedEur.toFixed(0)} € / ${g.monthlyNetGoalEur.toFixed(0)} € (${monthlyPct}%)`,
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      } else if (
        lower.includes('enviar mensagem para') ||
        lower.includes('mandar mensagem para')
      ) {
        commandMatched = '"Enviar mensagem para [Nome]"';
        const targetCourier =
          state.onlineDirectoryCouriers.find((c) =>
            lower.includes(c.callsign.toLowerCase().split(' ')[0])
          ) || state.onlineDirectoryCouriers[0];

        if (targetCourier.isOnlineActive === false) {
          const tts = `O colega ${targetCourier.callsign} encontra-se atualmente inativo ou offline. A mensagem ficará pendente.`;
          triggerEphemeralOverlayCard({
            cardCategory: 'MENSAGEM_AMIZADE',
            commandSpoken: clean,
            title: `Estado de Conexão: ${targetCourier.callsign}`,
            subtitle: `${targetCourier.vehicle} • ${targetCourier.zoneName}`,
            primaryMetricLabel: 'Estado do Destinatário',
            primaryMetricValue: '● Usuário Inativo (Offline)',
            secondaryDetails: [
              'O destinatário não está online no turno atual',
              'Tente novamente quando o colega iniciar sessão',
            ],
            spokenTextPtBr: tts,
          });
          actionSummary = tts;
        } else if (targetCourier.contactPermission !== 'APROVADO') {
          requestCourierContactPermission(targetCourier.id);
          const tts = `Pedido de permissão enviado para ${targetCourier.callsign}. Aguardando aprovação para abrir o canal direto.`;
          triggerEphemeralOverlayCard({
            cardCategory: 'MENSAGEM_AMIZADE',
            commandSpoken: clean,
            title: `Permissão de Contacto: ${targetCourier.callsign}`,
            subtitle: `${targetCourier.vehicle} • ${targetCourier.zoneName}`,
            primaryMetricLabel: 'Estado da Conexão',
            primaryMetricValue: '◌ Request Enviado (Aguardando Permissão)',
            secondaryDetails: [
              'Estado da Mensagem: ✉ Pendente de aceitação pelo colega',
              'Assim que aceitar, o canal 1-a-1 ficará aberto',
            ],
            spokenTextPtBr: tts,
          });
          actionSummary = tts;
        } else {
          const msgBody =
            'Boas colega! Tudo tranquilo aí na zona? Mensagem enviada por voz.';
          sendDirectCourierMessage(targetCourier.id, msgBody);
          const tts = `Conexão estabelecida com ${targetCourier.callsign}. Mensagem direta enviada com sucesso!`;
          triggerEphemeralOverlayCard({
            cardCategory: 'MENSAGEM_AMIZADE',
            commandSpoken: clean,
            title: `Mensagem Direta: ${targetCourier.callsign}`,
            subtitle: `${targetCourier.vehicle} • ${targetCourier.zoneName}`,
            primaryMetricLabel: 'Estado da Conexão',
            primaryMetricValue: '● Conexão Estabelecida (Amigo / Canal Aberto)',
            secondaryDetails: [
              'Estado de Entrega: ✉ Mensagem Enviada com sucesso',
              `Conteúdo: "${msgBody}"`,
            ],
            spokenTextPtBr: tts,
          });
          actionSummary = tts;
        }
      } else if (
        lower.includes('enviar pedido de amizade') ||
        lower.includes('pedido de amizade') ||
        lower.includes('adicionar amigo')
      ) {
        commandMatched = '"Enviar pedido de amizade"';
        const candidate =
          state.onlineDirectoryCouriers.find(
            (c) => c.contactPermission === 'NENHUM' && c.isOnlineActive !== false
          ) || state.onlineDirectoryCouriers[2];
        if (candidate) {
          requestCourierContactPermission(candidate.id);
        }
        const targetName = candidate?.callsign || 'Inês V.';
        const tts = `Pedido de amizade enviado para ${targetName}. Estado atualizado para aguardando permissão.`;
        triggerEphemeralOverlayCard({
          cardCategory: 'MENSAGEM_AMIZADE',
          commandSpoken: '"Enviar pedido de amizade"',
          title: `Social "Buddys" • Pedido de Amizade`,
          subtitle: `Destinatário: ${targetName} (${candidate?.zoneName || 'Amarante Centro'})`,
          primaryMetricLabel: 'Estado do Pedido',
          primaryMetricValue: '◌ Request Enviado (Aguardando Permissão)',
          secondaryDetails: [
            'Notificação enviada para o colega na zona',
            'Partilha de dados financeiros privados permanece 100% bloqueada',
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      }
      // ---------------------------------------------------------------------
      // 4. CATEGORY B: PLATFORM & ORDER COMMANDS (Uber, Glovo, Bolt)
      // ---------------------------------------------------------------------
      else if (lower.includes('status pedido') || lower.includes('estado do pedido')) {
        commandMatched = '"Status pedido"';
        const ordId =
          activeScannedOffer.orderId ||
          state.activeDeliveryLifecycle.orderId ||
          '#4101';
        const waitSecs = state.activeDeliveryLifecycle.waitSecondsAtStore;
        const prepState =
          state.activeDeliveryLifecycle.stage === 'EM_TRANSITO'
            ? 'Recolhido • Em trânsito para o ponto de entrega'
            : waitSecs > 120
              ? 'Em preparo (Faltam ~4 min no balcão)'
              : 'Pronto para recolha no balcão expresso';
        const tts = `Status do pedido ${ordId} na ${activeScannedOffer.platform}: ${prepState}. Peso auditado de ${totalAuditedWeightKg
          .toFixed(1)
          .replace('.', ' vírgula ')} quilos.`;
        triggerEphemeralOverlayCard({
          cardCategory: 'STATUS_PEDIDO',
          commandSpoken: '"Status pedido"',
          title: `Status do Pedido ${ordId} (${activeScannedOffer.platform})`,
          subtitle: `${activeScannedOffer.originName} → ${activeScannedOffer.destinationName}`,
          primaryMetricLabel: 'Estado de Preparo',
          primaryMetricValue: prepState,
          secondaryDetails: [
            `Peso auditado: ${totalAuditedWeightKg.toFixed(1)} kg (Zero-PII)`,
            `Código de recolha verificado • Sem exposição de nome de cliente`,
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      } else if (
        lower.includes('status estabelecimento') ||
        lower.includes('estado do estabelecimento') ||
        lower.includes('status restaurante')
      ) {
        commandMatched = '"Status estabelecimento"';
        const restName = activeScannedOffer.originName;
        const isCritical =
          restName.toLowerCase().includes('burger king') ||
          restName.toLowerCase().includes('mcdonald');
        const activeOrdersInSystem = isCritical ? 14 : 4;
        const avgWaitTodayMins = isCritical ? 28 : 4;
        const dayInfo = isCritical
          ? 'Fila crítica no drive-thru e atraso no balcão interno'
          : 'Balcão fluido • Entregas prioritárias sem fila';
        const tts = `Status do estabelecimento ${restName}: ${activeOrdersInSystem} pedidos atualmente no sistema. ${dayInfo}. Tempo médio de espera hoje: ${avgWaitTodayMins} minutos.`;
        triggerEphemeralOverlayCard({
          cardCategory: 'STATUS_ESTABELECIMENTO',
          commandSpoken: '"Status estabelecimento"',
          title: `Inteligência de Loja • ${restName}`,
          subtitle: `Zona: ${activeScannedOffer.cityZone}`,
          primaryMetricLabel: 'Tempo Médio de Espera Hoje',
          primaryMetricValue: `${avgWaitTodayMins} min (${activeOrdersInSystem} pedidos no sistema)`,
          secondaryDetails: [
            `Quantidade de pedidos atualmente no sistema: ${activeOrdersInSystem}`,
            `Informações do dia: ${dayInfo}`,
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      } else if (
        lower.includes('estado rota') ||
        lower.includes('status rota') ||
        lower.includes('como está a rota') ||
        lower.includes('como esta a rota')
      ) {
        commandMatched = '"Estado rota"';
        const hasTrap = Boolean(activeScannedOffer.matchedRouteTrapId);
        const routeHeadline = hasTrap
          ? 'Alerta: Pilaretes / Desvio Obrigatório (+2.3 km)'
          : 'Rota 100% Limpa e Legal';
        const tts = hasTrap
          ? `Atenção ao estado da rota para ${activeScannedOffer.destinationName}: zona bloqueada por pilaretes, exigindo desvio legal de mais 2 vírgula 3 quilômetros.`
          : `Estado da rota para ${activeScannedOffer.destinationName}: via limpa, sem obras ou bloqueios pedonais reportados.`;
        triggerEphemeralOverlayCard({
          cardCategory: 'ESTADO_ROTA',
          commandSpoken: '"Estado rota"',
          title: `Auditoria de Rota • ${activeScannedOffer.segmentText}`,
          subtitle: `Distância App: ${activeScannedOffer.appAnnouncedKm.toFixed(1)} km`,
          primaryMetricLabel: 'Veredito do Trajeto',
          primaryMetricValue: routeHeadline,
          secondaryDetails: [
            hasTrap
              ? 'Restrição: Zona Pedonal / Pilaretes Hidráulicos na Baixa/Chiado'
              : 'Sem escadarias, sentidos proibidos ou buracos críticos no trajeto',
            `Notas de localização ativas na zona: ${state.locationRouteNotes.length}`,
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      } else if (
        lower.includes('acessar suporte') ||
        lower.includes('aceder suporte') ||
        lower.includes('reportar problema para')
      ) {
        const targetPlatform: PlatformName = lower.includes('uber')
          ? 'Uber Eats'
          : lower.includes('bolt')
            ? 'Bolt Food'
            : lower.includes('glovo')
              ? 'Glovo'
              : activeScannedOffer.platform;
        const isBuddyReport = lower.includes('buddy');
        commandMatched = isBuddyReport
          ? '"Reportar problema para Buddy"'
          : `"Acessar suporte ${targetPlatform}"`;

        if (isBuddyReport) {
          const createdNote = addLocationRouteNote({
            streetOrZone: activeScannedOffer.destinationName,
            orderCodeRef: activeScannedOffer.orderId || '#4101',
            category: 'Morada errada no GPS / Pin deslocado',
            noteText: `Reporte por voz (${clean}): alerta registado na localização sem dados pessoais de cliente.`,
          });
          const tts = `Problema reportado na comunidade Delivery Buddy para ${createdNote.streetOrZone}. Nota de localização salva com sucesso.`;
          triggerEphemeralOverlayCard({
            cardCategory: 'ESTADO_ROTA',
            commandSpoken: clean,
            title: 'Problema Reportado ao Delivery Buddy',
            subtitle: `Local: ${createdNote.streetOrZone} (${createdNote.orderCodeRef})`,
            primaryMetricLabel: 'Registo Comunitário Zero-PII',
            primaryMetricValue: createdNote.category,
            secondaryDetails: [
              'Partilhado no Mapa & Notas de Localização da zona',
              'Nenhum dado pessoal de cliente foi armazenado',
            ],
            spokenTextPtBr: tts,
          });
          actionSummary = tts;
        } else {
          const ordId =
            activeScannedOffer.orderId ||
            state.activeDeliveryLifecycle.orderId ||
            '#4101';
          const tts = `Acessando suporte da ${targetPlatform} para o pedido ${ordId}. Protocolo técnico preenchido automaticamente.`;
          triggerEphemeralOverlayCard({
            cardCategory: 'SUPORTE_PLATAFORMA',
            commandSpoken: clean,
            title: `Suporte Automático • ${targetPlatform}`,
            subtitle: `Pedido ${ordId} • ${activeScannedOffer.originName}`,
            primaryMetricLabel: 'Ação Executada',
            primaryMetricValue: 'Chat de Suporte Aberto + Texto Colado',
            secondaryDetails: [
              `Motivo comunicado: ${clean}`,
              `Coordenadas de toque (%X/%Y) disparadas para ${targetPlatform}`,
            ],
            spokenTextPtBr: tts,
          });
          actionSummary = tts;
        }
      } else if (
        lower.includes('pedido recolhido') ||
        lower.includes('iniciar entrega') ||
        lower.includes('recolhido') ||
        lower.includes('coleta confirmada')
      ) {
        commandMatched = '"Pedido recolhido" / "Iniciar entrega"';
        startDeliveryTransitStage();
        triggerEphemeralOverlayCard({
          cardCategory: 'STATUS_PEDIDO',
          commandSpoken: '"Iniciar entrega"',
          title: 'Etapa 2: Em Trânsito para o Cliente',
          subtitle: `${state.activeDeliveryLifecycle.originName} → ${state.activeDeliveryLifecycle.destinationName}`,
          primaryMetricLabel: 'Estado Atual',
          primaryMetricValue: '● Ocupado (Em Entrega)',
          secondaryDetails: [
            "[Macro: Deslizar 'Pedido Recolhido' + Abrir GPS]",
            `Lucro líquido garantido: +${state.activeDeliveryLifecycle.netProfitEur.toFixed(2)} €`,
          ],
          spokenTextPtBr:
            'Coleta confirmada. Iniciando rota para o ponto de entrega.',
        });
        actionSummary =
          "Stage 2 Ativo: [Macro: Deslizar 'Pedido Recolhido' + Abrir Navegação GPS p/ Cliente] • Estado: Ocupado (Em Entrega).";
      } else if (
        lower.includes('passadeira') ||
        lower.includes('travessia pedonal')
      ) {
        commandMatched = '"Buddy, marcar passadeira aqui"';
        const curLat =
          realCourierProfile.lat || AMARANTE_DEFAULT_COORDS.lat;
        const curLng =
          realCourierProfile.lng || AMARANTE_DEFAULT_COORDS.lng;
        saveCustomTaughtCrosswalk({
          id: `cw-voice-${Date.now()}`,
          lat: curLat,
          lng: curLng,
          streetLabel: 'Passadeira ensinada por voz (Amarante)',
          source: 'COURIER_TAUGHT',
          taughtByCallsign:
            state.verifiedAccount.courierName || 'Estafeta Buddy',
          createdAtIso: new Date().toISOString(),
        });
        addRoadHazardPin(
          'Passadeira Pedonal',
          'Passadeira Pedonal (Voz — Amarante)',
          'Amarante'
        );
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('buddy-voice-mark-crosswalk'));
        }
        const cwTts =
          'Passadeira marcada com sucesso aqui em Amarante e sincronizada para alertar todos os colegas.';
        speakTextPt(cwTts);
        actionSummary = cwTts;
      } else if (
        lower.includes('finalizar entrega') ||
        lower.includes('entrega concluída') ||
        lower.includes('entrega concluida') ||
        lower.includes('finalizar pedido') ||
        lower.includes('concluir entrega')
      ) {
        commandMatched = '"Finalizar entrega" / "Entrega concluída"';
        const netEur = state.activeDeliveryLifecycle.netProfitEur || 4.95;
        const realKm = state.activeDeliveryLifecycle.realKm || 3.0;
        completeActiveDeliveryStage();
        actionSummary = `Stage 3 Concluído: +${netEur.toFixed(
          2
        )} € líq. e +${realKm.toFixed(1)} km sincronizados nas Metas + Comparativo Real de Tempo Ganho.`;
      } else if (lower.includes('minimizar') || lower.includes('bolha')) {
        commandMatched = '"Minimizar"';
        actionSummary = 'A minimizar.';
        setIsBubbleMinimized(true);
        speakTextPt('A minimizar.');
      } else if (
        /calculadora|predefini|config|seguran|ajust|defin/.test(lower)
      ) {
        commandMatched = '"Ajustes" (Abrir Ajustes)';
        actionSummary = 'A abrir Ajustes e Predefinições.';
        setIsBubbleMinimized(false);
        setActiveTab('menu_mais');
        speakTextPt('A abrir Ajustes.');
      } else if (
        /scanner|inicio|início|\bhome\b|oferta/.test(lower)
      ) {
        commandMatched = '"Início" (Abrir Início)';
        actionSummary = 'A abrir Início e Scanner de Ofertas.';
        setIsBubbleMinimized(false);
        setCourierWorkspaceSection('AREA_PRIVADA');
        setActiveTab('scanner');
        setScannerActiveMainView('OFERTA_ATUAL');
        speakTextPt('A abrir Início.');
      } else if (
        /buddys|amigos|comunidade|colega/.test(lower)
      ) {
        commandMatched = '"Buddys" (Abrir Social Buddys)';
        actionSummary = 'A abrir Comunidade Buddys e Rádio.';
        setIsBubbleMinimized(false);
        setCourierWorkspaceSection('AREA_PUBLICA_SOCIAL');
        setActiveTab('walkietalkie');
        speakTextPt('A abrir Comunidade Buddys.');
      } else if (
        /finan|ganho|lucro|dinheiro|carteira|recompensa/.test(lower)
      ) {
        commandMatched = '"Finanças" (Abrir Finanças)';
        actionSummary = 'A abrir Finanças e Metas.';
        setIsBubbleMinimized(false);
        setCourierWorkspaceSection('AREA_PRIVADA');
        setActiveTab('financas');
        speakTextPt('A abrir Finanças e Metas.');
      } else if (
        /zona|onde/.test(lower)
      ) {
        commandMatched = '"Mapa de Amarante"';
        actionSummary = 'A abrir Mapa de Amarante (25 km).';
        setIsBubbleMinimized(false);
        setCourierWorkspaceSection('AREA_PUBLICA_SOCIAL');
        setActiveTab('radar');
        speakTextPt('A abrir Mapa de Amarante.');
      } else if (lower.includes('pausar') || lower.includes('retomar')) {
        commandMatched = '"Pausar Aplicativo"';
        const nextPaused = !state.isAppPaused;
        toggleAppPauseMode();
        actionSummary = nextPaused
          ? 'Aplicativo colocado em Pausa de Turno.'
          : 'Turno retomado!';
      } else if (lower.includes('aceitar')) {
        commandMatched = '"Aceitar pedido"';
        const gross = activeScannedOffer.grossAmountEur;
        const km = Math.max(0.1, activeScannedOffer.appAnnouncedKm);
        const net = Number(Math.max(0.5, gross - km * totalCostPerKm).toFixed(2));
        const netPerKm = Number((net / km).toFixed(2));
        recordOfferDecision(activeScannedOffer, km, net, netPerKm, 'ACEITE');
        const tts = `Corrida da ${activeScannedOffer.platform} aceita com sucesso. Cronômetro de coleta na loja iniciado.`;
        triggerEphemeralOverlayCard({
          cardCategory: 'STATUS_PEDIDO',
          commandSpoken: '"Aceitar pedido"',
          title: `Pedido Aceite • ${activeScannedOffer.platform}`,
          subtitle: `${activeScannedOffer.originName} → ${activeScannedOffer.destinationName}`,
          primaryMetricLabel: 'Lucro Limpo Estimado',
          primaryMetricValue: `+${net.toFixed(2)} € (${netPerKm.toFixed(2)} €/km)`,
          secondaryDetails: [
            'Etapa 1 iniciada: Aguardar Recolha (Na Loja)',
            'Estado alterado para: ● Ocupado (Com Pedido)',
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      } else if (lower.includes('recusar') || lower.includes('rejeitar')) {
        commandMatched = '"Recusar pedido"';
        const gross = activeScannedOffer.grossAmountEur;
        const km = Math.max(0.1, activeScannedOffer.appAnnouncedKm);
        const net = Number(Math.max(0.5, gross - km * totalCostPerKm).toFixed(2));
        const netPerKm = Number((net / km).toFixed(2));
        recordOfferDecision(activeScannedOffer, km, net, netPerKm, 'RECUSADA');
        const tts = `Corrida de ${activeScannedOffer.originName} recusada sem tocar na tela.`;
        triggerEphemeralOverlayCard({
          cardCategory: 'STATUS_PEDIDO',
          commandSpoken: '"Recusar pedido"',
          title: `Oferta Recusada • ${activeScannedOffer.platform}`,
          subtitle: activeScannedOffer.originName,
          primaryMetricLabel: 'Ação Hands-Free',
          primaryMetricValue: 'Recusada (Toque X Simulado)',
          secondaryDetails: [
            'Você permanece Disponível (Livre) para a próxima oferta',
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      } else if (lower.includes('buraco') || lower.includes('anomalia')) {
        commandMatched = '"Reportar buraco na via"';
        const pin = addRoadHazardPin(
          'Buraco Perigoso na Pista',
          'Ponto GPS Atual (Reportado por Voz Mãos-Livres)'
        );
        awardBuddyRewardTask(
          'ALERTAR_ANOMALIA_MAPA_15',
          'Reportar Buraco na Via por Comando de Voz (+15 pts)'
        );
        const tts =
          'Alerta de buraco perigoso na via registrado no mapa. Você ganhou mais 15 BuddyCoins.';
        triggerEphemeralOverlayCard({
          cardCategory: 'TRANSITO',
          commandSpoken: '"Reportar buraco na via"',
          title: 'Alerta de Perigo Publicado no Mapa',
          subtitle: pin.streetLocation,
          primaryMetricLabel: 'Recompensa Comunitária',
          primaryMetricValue: '+15 BuddyCoins',
          secondaryDetails: [
            `Tipo: ${pin.hazardType}`,
            'Partilhado com os entregadores da sua região',
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      } else if (
        lower === 'estender' ||
        lower === 'maximizar' ||
        lower.includes('estender pop') ||
        lower.includes('maximizar pop') ||
        lower.includes('estender perfil')
      ) {
        commandMatched = '"Estender" / "Maximizar" (Pop-up 80%)';
        setBuddyPopupSizeMode('80VH');
        actionSummary =
          'Pop-up de Perfil do Buddy estendido para 80% da tela.';
        speakTextPt('Perfil estendido para oitenta por cento da tela.');
      } else if (
        lower === 'retrair' ||
        lower.includes('retrair pop') ||
        lower.includes('retrair perfil') ||
        lower.includes('reduzir pop')
      ) {
        commandMatched = '"Retrair" (Pop-up 45%)';
        setBuddyPopupSizeMode('45VH');
        actionSummary =
          'Pop-up de Perfil do Buddy retraído para 45% da tela.';
        speakTextPt('Perfil retraído para quarenta e cinco por cento da tela.');
      } else if (
        lower.includes('aproximar zoom') ||
        lower.includes('afastar zoom') ||
        lower.includes('recentralizar rota') ||
        lower.includes('marcar perigo no mapa') ||
        lower.includes('rota alternativa')
      ) {
        const isZoomIn = lower.includes('aproximar zoom');
        const isZoomOut = lower.includes('afastar zoom');
        const isRecenter = lower.includes('recentralizar rota');
        const isHazard = lower.includes('marcar perigo no mapa');
        const actionType: ExternalNavMapAssistAction = isZoomIn
          ? 'ZOOM_IN'
          : isZoomOut
            ? 'ZOOM_OUT'
            : isRecenter
              ? 'RECENTER_ROUTE'
              : isHazard
                ? 'REPORT_HAZARD'
                : 'ALTERNATIVE_ROUTE';
        const metaMap: Record<
          ExternalNavMapAssistAction,
          { label: string; touch: string; tts: string }
        > = {
          ZOOM_IN: {
            label: 'Mapa: Aproximar Zoom (+)',
            touch: 'Toque Simulado Waze/Maps (92% X, 48% Y)',
            tts: 'Assistente de navegação externa: aproximando zoom no mapa.',
          },
          ZOOM_OUT: {
            label: 'Mapa: Afastar Zoom (-)',
            touch: 'Toque Simulado Waze/Maps (92% X, 56% Y)',
            tts: 'Assistente de navegação externa: afastando zoom no mapa.',
          },
          RECENTER_ROUTE: {
            label: 'Mapa: Recentralizar Rota GPS',
            touch: 'Toque Simulado Waze/Maps (14% X, 82% Y)',
            tts: 'Assistente de navegação externa: rota recentralizada na sua posição GPS.',
          },
          REPORT_HAZARD: {
            label: 'Mapa: Marcar Perigo na Via',
            touch: 'Toque Simulado Waze/Maps (88% X, 78% Y → Perigo na Via)',
            tts: 'Assistente de navegação externa: perigo marcado na via sem tirar as mãos do guiador.',
          },
          ALTERNATIVE_ROUTE: {
            label: 'Mapa: Solicitar Rota Alternativa',
            touch: 'Toque Simulado Waze/Maps (28% X, 84% Y → Rotas)',
            tts: 'Assistente de navegação externa: calculando rota alternativa limpa em Amarante.',
          },
        };
        const chosen = metaMap[actionType];
        commandMatched = `"${chosen.label}"`;
        setLastExternalMapAssist({
          action: actionType,
          label: chosen.label,
          simulatedTouchCoords: chosen.touch,
          timestamp: nowStr,
        });
        triggerEphemeralOverlayCard({
          cardCategory: 'ESTADO_ROTA',
          commandSpoken: chosen.label,
          title: chosen.label,
          subtitle: 'Assistente Mãos-Livres (Waze / Google Maps)',
          primaryMetricLabel: 'Macro de Toque Executada',
          primaryMetricValue: chosen.touch,
          secondaryDetails: [
            'Comando executado sem tirar as mãos do guiador',
            'Região Ativa: Amarante (Raio de 25 km)',
          ],
          spokenTextPtBr: chosen.tts,
        });
        actionSummary = `${chosen.label} (${chosen.touch})`;
      } else if (
        lower.includes('aprender tarefa') ||
        lower.includes('ensinar caminho') ||
        lower.includes('ensinar skill') ||
        lower.includes('aprender skill')
      ) {
        commandMatched = '"Buddy, aprender tarefa / ensinar caminho" (Modo Gravação IA)';
        const extractedTask = clean
          .replace(/^(ei\s+)?buddy[,:\s]*/i, '')
          .replace(/^(aprender\s+tarefa|ensinar\s+caminho|ensinar\s+skill|aprender\s+skill)[:\s]*/i, '')
          .trim();
        const taskTitle =
          extractedTask ||
          `Dividir Pedido / Suporte Rápido (${activeScannedOffer.platform})`;
        startVoiceTeachSkillMode(taskTitle, activeScannedOffer.platform);
        actionSummary = `Modo Gravação de Nova Skill IA aberto no Pop-up 45% para "${taskTitle}" (${deviceScreenProfile.deviceModel} • Tela ${deviceScreenProfile.screenAspectRatio}).`;
      } else if (
        lower.includes('quantos estafetas') ||
        lower.includes('estafetas online') ||
        lower.includes('estafetas na zona') ||
        lower.includes('entregadores online')
      ) {
        commandMatched = '"Buddy, quantos estafetas tem online agora?"';
        recordMarketTelemetrySnapshot('VOICE_QUERY_ONLINE_COURIERS');
        const m = marketTelemetry;
        const tts = buildSurgicalMarketQueryStreetTts(
          m.onlineCouriersNow,
          m.liveEurPerKm.global
        );
        triggerEphemeralOverlayCard({
          cardCategory: 'MERCADO_PROJECOES',
          commandSpoken: '"Buddy, quantos estafetas tem online agora?"',
          title: `Estafetas Online Agora • Amarante (${m.currentHourWindowLabel})`,
          subtitle: 'Telemetria Horária & Registo Instantâneo p/ Projeções',
          primaryMetricLabel: 'Estafetas Online Agora',
          primaryMetricValue: `${m.onlineCouriersNow} Online (${m.freeCouriersNow} Livres • ${m.busyCouriersNow} Ocupados)`,
          secondaryDetails: [
            `Média histórica (${m.currentHourWindowLabel}): ${m.historicalAvgCouriersForCurrentHour.toFixed(1)} estafetas/hora`,
            `Média de Pedidos / Hora: ${m.avgOrdersPerHourPerCourier.toFixed(1)} pedidos/h por estafeta`,
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      } else if (
        lower.includes('quanto tá pagando') ||
        lower.includes('quanto ta pagando') ||
        lower.includes('quanto está a pagar') ||
        lower.includes('quanto esta a pagar') ||
        lower.includes('pagando por quilómetro') ||
        lower.includes('pagando por quilometro') ||
        lower.includes('pagando por km') ||
        lower.includes('valor por km')
      ) {
        commandMatched = '"Buddy, quanto tá pagando por quilómetro?"';
        recordMarketTelemetrySnapshot('VOICE_QUERY_EUR_PER_KM');
        const m = marketTelemetry;
        const tts = buildSurgicalMarketQueryStreetTts(
          m.onlineCouriersNow,
          m.liveEurPerKm.global
        );
        triggerEphemeralOverlayCard({
          cardCategory: 'MERCADO_PROJECOES',
          commandSpoken: '"Buddy, quanto tá pagando por quilómetro?"',
          title: `Tarifa Real €/km Agora • Amarante (${m.currentHourWindowLabel})`,
          subtitle: `Média Entrega: ${m.avgNetDeliveryEur.toFixed(2)} € líq. • Ritmo: ${m.avgHourlyPaceEur.toFixed(2)} €/h`,
          primaryMetricLabel: 'Quanto Está a Pagar por KM (Global)',
          primaryMetricValue: `${m.liveEurPerKm.global.toFixed(2)} €/km (${m.avgOrdersPerHourPerCourier.toFixed(1)} pedidos/h)`,
          secondaryDetails: [
            `Uber Eats: ${m.liveEurPerKm.uberEats.toFixed(2)} €/km • Glovo: ${m.liveEurPerKm.glovo.toFixed(2)} €/km • Bolt: ${m.liveEurPerKm.boltFood.toFixed(2)} €/km`,
            `Média Valor Bruto: ${m.avgGrossDeliveryEur.toFixed(2)} €/entrega | Líquido: ${m.avgNetDeliveryEur.toFixed(2)} €/entrega`,
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      } else if (
        lower.includes('qual a projeção') ||
        lower.includes('qual a projecao') ||
        lower.includes('projeção para hoje') ||
        lower.includes('projecao para hoje') ||
        lower.includes('projeção próximas') ||
        lower.includes('projecao proximas')
      ) {
        commandMatched = '"Buddy, qual a projeção para hoje?"';
        recordMarketTelemetrySnapshot('VOICE_QUERY_PROJECTION');
        const m = marketTelemetry;
        const p1 = m.next3HoursProjections[0];
        const p2 = m.next3HoursProjections[1];
        const tts = m.isProductionCleanBaseline
          ? `Projeção em Modo Produção Real ativa: atualmente ${m.onlineCouriersNow} estafeta online. Assim que registar as primeiras ofertas e entregas reais, o motor calculará automaticamente a curva das próximas três horas.`
          : `Projeção para as próximas três horas em Amarante: na faixa ${p1.hourLabel}, procura ${p1.demandLevel.replace('_', ' ')}, com previsão de ${p1.projectedOrdersPerHour
              .toFixed(1)
              .replace('.', ' vírgula ')} pedidos por hora, ${p1.expectedOnlineCouriers} estafetas online e tarifa esperada de ${p1.projectedEurPerKm
              .toFixed(2)
              .replace('.', ' e ')} euros por quilômetro.`;
        triggerEphemeralOverlayCard({
          cardCategory: 'MERCADO_PROJECOES',
          commandSpoken: '"Buddy, qual a projeção para hoje?"',
          title: 'Projeção Próximas 3 Horas & Turno (Amarante)',
          subtitle: m.isProductionCleanBaseline
            ? 'Modo Produção Real: Base limpa pronta p/ aprender com dados reais'
            : `Motor de Projeções (${m.totalSnapshotsRecorded} snapshots horarios)`,
          primaryMetricLabel: `Próxima Hora (${p1.hourLabel})`,
          primaryMetricValue: `${p1.projectedOrdersPerHour.toFixed(1)} ped/h • ${p1.projectedEurPerKm.toFixed(2)} €/km (${p1.expectedOnlineCouriers} estafetas)`,
          secondaryDetails: [
            `${p2.hourLabel}: ${p2.projectedOrdersPerHour.toFixed(1)} ped/h • ${p2.projectedEurPerKm.toFixed(2)} €/km (${p2.demandLevel})`,
            p1.confidenceNote,
          ],
          spokenTextPtBr: tts,
        });
        actionSummary = tts;
      } else if (
        lower.includes('desbloquear tela') ||
        lower.includes('desbloquear ecra') ||
        lower.includes('sair do modo chuva') ||
        lower.includes('desativar modo chuva')
      ) {
        commandMatched = '"Desbloquear tela" (Modo Chuva Desativado)';
        setRainLockActive(false);
        const tts = 'Tela desbloqueada. Modo Chuva desativado.';
        speakTextPt(tts);
        actionSummary = tts;
      } else if (
        lower.includes('estou bem') ||
        lower.includes('cancelar queda')
      ) {
        commandMatched = '"Estou bem" (Alerta de Queda Cancelado)';
        setCrashCountdownSeconds(null);
        const tts = 'Alerta de queda cancelado. Continuando turno em segurança.';
        speakTextPt(tts);
        actionSummary = tts;
      } else if (
        lower === 'buddy' ||
        lower === 'ei buddy' ||
        lower === 'oi buddy' ||
        lower === 'ola buddy'
      ) {
        commandMatched = '"Buddy" (Escuta Mãos-Livres Ativa)';
        const tts =
          'Estou na escuta. Diga clima, minimizar, dividir pedido ou finanças.';
        speakTextPt(tts);
        actionSummary = tts;
      } else {
        setEphemeralVoiceOverlay(null);
        setLiveVoiceTranscription(null);
        commandMatched = `Comando não reconhecido: "${clean}"`;
        actionSummary =
          "Diga 'Clima', 'Minimizar', 'Maximizar', 'Dividir pedido', 'Finanças' ou 'Mapa'.";
        showLiveMicTranscriptFeedback(
          `⚠️ Ouvido: "${clean}" → ${actionSummary}`,
          clean,
          actionSummary
        );
        speakTextPt('Não entendi, repita o comando.');
      }

      if (!commandMatched.startsWith('Comando não reconhecido')) {
        const cleanTitle = commandMatched.replace(/^["“]|["”]$/g, '');
        const actionText = actionSummary
          ? `${cleanTitle} — ${actionSummary}`
          : cleanTitle;
        showLiveMicTranscriptFeedback(
          `✅ Comando: "${clean}" → ${cleanTitle}`,
          clean,
          actionText
        );
      }

      const resultObj = {
        phrase: clean,
        commandMatched,
        actionSummary,
        timestamp: nowStr,
      };
      setLastVoiceCommandResult(resultObj);
      return { commandMatched, actionSummary };
    },
    [
      state.isAppPaused,
      state.themeMode,
      state.personalGoals,
      state.activeDeliveryLifecycle,
      state.roadHazards,
      state.selectedRegionName,
      state.shiftTrips,
      state.onlineDirectoryCouriers,
      state.locationRouteNotes.length,
      state.voiceActivationConfig.customTriggerWord,
      state.customAutoMessages,
      activeScannedOffer,
      totalCostPerKm,
      totalAuditedWeightKg,
      cancelSpeechNow,
      setIsBubbleMinimized,
      setCourierWorkspaceSection,
      speakTextPt,
      showLiveMicTranscriptFeedback,
      stopAllLiveVoiceTimersAndRec,
      toggleAppPauseMode,
      closeGlovoDailyAudit,
      recordOfferDecision,
      addRoadHazardPin,
      addLocationRouteNote,
      awardBuddyRewardTask,
      startDeliveryTransitStage,
      completeActiveDeliveryStage,
      triggerSupportSplitOrderMacro,
      triggerSosEmergencyBeacon,
      requestOrConfirmSosActivation,
      triggerEphemeralOverlayCard,
      setActiveTab,
      startVoiceTeachSkillMode,
      deviceScreenProfile.deviceModel,
      deviceScreenProfile.screenAspectRatio,
      recordMarketTelemetrySnapshot,
      marketTelemetry,
      openAndFetchAmaranteWeather,
      amaranteLiveWeather.temperatureC,
      amaranteLiveWeather.conditionLabel,
      amaranteLiveWeather.rainMm,
      amaranteLiveWeather.windSpeedKmh,
      triggerAutoDetectedOffer,
    ]
  );

  // =========================================================================
  // NATIVE ANDROID SPEECH RECOGNIZER BRIDGE + CLEAN WEB SPEECH FALLBACK
  // Zero getUserMedia hardware mic lock! Uses window.BuddyNativeOverlay.startNativeVoice()
  // inside the Android .APK and forwards partial/final transcripts via window.onBuddyNativeTranscript.
  // =========================================================================
  const isInputOrModalPausedRef = useRef<boolean>(false);

  const abortActiveSpeechRecOnly = useCallback(() => {
    if (activeSpeechRecRef.current) {
      try {
        activeSpeechRecRef.current.onend = null;
        activeSpeechRecRef.current.onerror = null;
        activeSpeechRecRef.current.stop();
        activeSpeechRecRef.current.abort?.();
      } catch {
        // ignore
      }
      activeSpeechRecRef.current = null;
    }
  }, []);

  const processIncomingVoiceTranscript = useCallback(
    (rawTranscript: string, isFinal: boolean): boolean => {
      if (isInputOrModalPausedRef.current || isSpeakingTtsRef.current) {
        return false;
      }
      const latestRaw = (rawTranscript || '').trim();
      if (!latestRaw) return false;

      // 1. Show real-time partial words inside the floating transcription HUD
      showLiveMicTranscriptFeedback(
        isFinal ? `🗣️ Ouvido: "${latestRaw}"` : `🗣️ Ouvindo: "${latestRaw}..."`,
        latestRaw,
        isFinal ? 'A processar comando...' : 'A escutar em tempo real...'
      );

      // Also update the 45% live voice transcription drawer if open
      setLiveVoiceTranscription((prev) =>
        prev
          ? {
              ...prev,
              transcriptText: latestRaw,
              fullTargetText: latestRaw,
            }
          : null
      );

      // 2. Normalize transcript (lowercase + strip accents)
      const norm = latestRaw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

      const directInstantIntentRegex =
        /clima|tempo|chuva|meteorologia|temperatura|graus|minimiz|fechar|esconder|bolinha|maximiz|abrir|mostrar|voltar|ecra|tela|dividir|peso|pesado|quilos|\bkg\b|suporte|finan|ganho|lucro|dinheiro|mapa|zona|onde|radar|comunidade|colega|ajust|config|defin|inicio|home|oferta|noturno|escuro|noite|claro|dia|\bsos\b|emerg|socorro|ajuda|acidente|aceitar|recusar|rejeitar/;

      const hasInstantKeyword = directInstantIntentRegex.test(norm);
      const hasSpokenNumbers =
        (norm.match(/\d+(?:[.,]\d+)?/g) || []).length >= 2;

      const shouldExecuteNow =
        isFinal ||
        (hasInstantKeyword && norm.length >= 4 && !norm.endsWith('buddy')) ||
        (hasSpokenNumbers && isFinal);

      if (shouldExecuteNow) {
        const nowMs = Date.now();
        const lastExec = lastExecutedVoicePhraseRef.current;
        if (lastExec.phrase === norm && nowMs - lastExec.ts < 2200) {
          return false;
        }
        lastExecutedVoicePhraseRef.current = { phrase: norm, ts: nowMs };
        // Single-shot command recognition: immediately close and release the microphone hardware!
        keepVoiceListeningRef.current = false;
        setIsListeningSpeechRecognition(false);
        if (typeof window !== 'undefined') {
          const winAny = window as unknown as {
            BuddyNativeOverlay?: {
              stopNativeVoice?: () => void;
              setBubbleListeningState?: (listening: boolean) => void;
            };
          };
          try {
            winAny.BuddyNativeOverlay?.stopNativeVoice?.();
            winAny.BuddyNativeOverlay?.setBubbleListeningState?.(false);
          } catch {
            // ignore
          }
        }
        executeVoiceCommandPt(latestRaw);
        return true;
      }
      if (isFinal) {
        keepVoiceListeningRef.current = false;
        setIsListeningSpeechRecognition(false);
      }
      return false;
    },
    [executeVoiceCommandPt, showLiveMicTranscriptFeedback]
  );

  // Register global window.onBuddyNativeTranscript callback for Native Android SpeechRecognizer
  const nativePartialDebounceTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const winAny = window as unknown as {
      onBuddyNativeTranscript?: (text: string, isFinal: boolean) => void;
    };
    winAny.onBuddyNativeTranscript = (text: string, isFinal: boolean) => {
      if (nativePartialDebounceTimerRef.current !== null) {
        window.clearTimeout(nativePartialDebounceTimerRef.current);
        nativePartialDebounceTimerRef.current = null;
      }
      const executedImmediately = processIncomingVoiceTranscript(
        text,
        Boolean(isFinal)
      );
      if (!isFinal && !executedImmediately && text && text.trim().length >= 2) {
        nativePartialDebounceTimerRef.current = window.setTimeout(() => {
          nativePartialDebounceTimerRef.current = null;
          processIncomingVoiceTranscript(text, true);
        }, 900);
      }
    };
    return () => {
      if (nativePartialDebounceTimerRef.current !== null) {
        window.clearTimeout(nativePartialDebounceTimerRef.current);
      }
      if (winAny.onBuddyNativeTranscript) {
        delete winAny.onBuddyNativeTranscript;
      }
    };
  }, [processIncomingVoiceTranscript]);

  const stopContinuousVoiceMic = useCallback(() => {
    keepVoiceListeningRef.current = false;
    if (watchdogRestartTimerRef.current !== null) {
      window.clearTimeout(watchdogRestartTimerRef.current);
      watchdogRestartTimerRef.current = null;
    }
    abortActiveSpeechRecOnly();
    if (typeof window !== 'undefined') {
      const winAny = window as unknown as {
        BuddyNativeOverlay?: {
          stopNativeVoice?: () => void;
          setBubbleListeningState?: (listening: boolean) => void;
        };
      };
      try {
        winAny.BuddyNativeOverlay?.stopNativeVoice?.();
        winAny.BuddyNativeOverlay?.setBubbleListeningState?.(false);
      } catch {
        // ignore
      }
    }
    setIsListeningSpeechRecognition(false);
  }, [abortActiveSpeechRecOnly]);

  const startContinuousRecognitionInstance = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (
      !keepVoiceListeningRef.current ||
      state.isAppPaused ||
      isCourierRegistrationModalOpen ||
      isInputOrModalPausedRef.current
    ) {
      setIsListeningSpeechRecognition(false);
      return;
    }

    // 1. When window.BuddyNativeOverlay is available (Native Android .APK),
    // NEVER start webkitSpeechRecognition (which causes a microphone lock conflict).
    // Route 100% of in-app "🎙️ Falar" taps exclusively through window.BuddyNativeOverlay!
    const winAny = window as unknown as {
      BuddyNativeOverlay?: {
        startSingleShotVoice?: () => void;
        startNativeVoice?: () => void;
        stopNativeVoice?: () => void;
        setBubbleListeningState?: (listening: boolean) => void;
      };
    };

    if (
      winAny.BuddyNativeOverlay &&
      (typeof winAny.BuddyNativeOverlay.startSingleShotVoice === 'function' ||
        typeof winAny.BuddyNativeOverlay.startNativeVoice === 'function')
    ) {
      abortActiveSpeechRecOnly();
      try {
        if (typeof winAny.BuddyNativeOverlay.startSingleShotVoice === 'function') {
          winAny.BuddyNativeOverlay.startSingleShotVoice();
        } else if (typeof winAny.BuddyNativeOverlay.startNativeVoice === 'function') {
          winAny.BuddyNativeOverlay.startNativeVoice();
        }
        winAny.BuddyNativeOverlay.setBubbleListeningState?.(true);
      } catch {
        // ignore
      }
      setIsListeningSpeechRecognition(true);
      return;
    }

    // 2. Web SpeechRecognition (ONLY when running in a standard browser outside the Native APK):
    if (activeSpeechRecRef.current) {
      return;
    }

    const SpeechRec =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRec || typeof SpeechRec !== 'function') {
      // Last-resort fallback to legacy startNativeVoice if Web Speech unavailable
      if (typeof winAny.BuddyNativeOverlay?.startNativeVoice === 'function') {
        try {
          winAny.BuddyNativeOverlay.startNativeVoice();
          winAny.BuddyNativeOverlay.setBubbleListeningState?.(true);
          setIsListeningSpeechRecognition(true);
          return;
        } catch {
          // ignore
        }
      }
      setIsListeningSpeechRecognition(false);
      return;
    }

    try {
      const recognition = new (SpeechRec as new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onstart: (() => void) | null;
        onresult:
          | ((event: {
              resultIndex?: number;
              results: ArrayLike<{
                isFinal?: boolean;
                0: { transcript: string };
              }>;
            }) => void)
          | null;
        onerror: ((event?: { error?: string }) => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
        abort?: () => void;
      })();

      recognition.lang = 'pt-PT';
      recognition.continuous = false;
      recognition.interimResults = true;
      activeSpeechRecRef.current = recognition;
      setIsListeningSpeechRecognition(true);

      recognition.onstart = () => {
        setIsListeningSpeechRecognition(true);
      };

      recognition.onresult = (event) => {
        if (isInputOrModalPausedRef.current) return;
        const resultsLen = event?.results?.length || 0;
        if (resultsLen === 0) return;

        const latestItem = event.results[resultsLen - 1];
        const latestRaw = (latestItem?.[0]?.transcript || '').trim();
        const isFinal = Boolean(latestItem?.isFinal);

        const executed = processIncomingVoiceTranscript(latestRaw, isFinal);
        if (executed) {
          keepVoiceListeningRef.current = false;
          setIsListeningSpeechRecognition(false);
          activeSpeechRecRef.current = null;
          try {
            recognition.stop();
          } catch {
            // ignore
          }
        }
      };

      recognition.onerror = (errEvent) => {
        const errCode = errEvent?.error || '';
        keepVoiceListeningRef.current = false;
        activeSpeechRecRef.current = null;
        setIsListeningSpeechRecognition(false);
        if (
          (errCode === 'not-allowed' || errCode === 'service-not-allowed') &&
          typeof winAny.BuddyNativeOverlay?.startNativeVoice === 'function'
        ) {
          try {
            winAny.BuddyNativeOverlay.startNativeVoice();
            winAny.BuddyNativeOverlay.setBubbleListeningState?.(true);
            setIsListeningSpeechRecognition(true);
            return;
          } catch {
            // ignore
          }
        }
        if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          showLiveMicTranscriptFeedback(
            'Microfone bloqueado pelo navegador — permita o acesso no cadeado'
          );
        }
      };

      recognition.onend = () => {
        keepVoiceListeningRef.current = false;
        activeSpeechRecRef.current = null;
        setIsListeningSpeechRecognition(false);
      };

      recognition.start();
    } catch {
      keepVoiceListeningRef.current = false;
      activeSpeechRecRef.current = null;
      setIsListeningSpeechRecognition(false);
    }
  }, [
    isCourierRegistrationModalOpen,
    processIncomingVoiceTranscript,
    showLiveMicTranscriptFeedback,
    state.isAppPaused,
  ]);

  useEffect(() => {
    startContinuousRecognitionInstanceRef.current =
      startContinuousRecognitionInstance;
  }, [startContinuousRecognitionInstance]);

  const startContinuousVoiceMic = useCallback(() => {
    hasUnlockedMicOnFirstTouchRef.current = true;
    keepVoiceListeningRef.current = true;
    setIsListeningSpeechRecognition(true);
    showLiveMicTranscriptFeedback(
      '🗣️ Ouvindo: diga "Clima", "Minimizar", "Dividir pedido" ou "5 euros 3 km"...',
      'A aguardar comando de voz...',
      'Diga "Clima", "Minimizar", "Dividir pedido", "Finanças" ou "Mapa"'
    );
    startContinuousRecognitionInstance();
  }, [showLiveMicTranscriptFeedback, startContinuousRecognitionInstance]);

  const toggleVoiceMicListening = useCallback(() => {
    // Always stop any ongoing speech immediately when the user taps the Buddy bubble
    cancelSpeechNow();
    if (isListeningSpeechRecognition || keepVoiceListeningRef.current) {
      stopContinuousVoiceMic();
      showLiveMicTranscriptFeedback('Microfone desligado');
    } else {
      startContinuousVoiceMic();
    }
  }, [
    cancelSpeechNow,
    isListeningSpeechRecognition,
    showLiveMicTranscriptFeedback,
    startContinuousVoiceMic,
    stopContinuousVoiceMic,
  ]);

  // Input & Keyboard Protection Guard: Pause voice transcription whenever any modal or <input>/<textarea>/<select> is focused
  useEffect(() => {
    const anyModalOpen =
      isCourierRegistrationModalOpen ||
      isWelcomeTourOpen ||
      isContextualHelpOpen ||
      isOfficialManualModalOpen;

    isInputOrModalPausedRef.current = anyModalOpen;
    if (anyModalOpen && activeSpeechRecRef.current) {
      abortActiveSpeechRecOnly();
    }
  }, [
    isCourierRegistrationModalOpen,
    isWelcomeTourOpen,
    isContextualHelpOpen,
    isOfficialManualModalOpen,
    abortActiveSpeechRecOnly,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = (target.tagName || '').toUpperCase();
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
      ) {
        isInputOrModalPausedRef.current = true;
        abortActiveSpeechRecOnly();
      }
    };
    const handleFocusOut = () => {
      window.setTimeout(() => {
        const activeEl = document.activeElement as HTMLElement | null;
        const tag = (activeEl?.tagName || '').toUpperCase();
        const stillInInput =
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          Boolean(activeEl?.isContentEditable);
        if (
          !stillInInput &&
          !isCourierRegistrationModalOpen &&
          !isWelcomeTourOpen &&
          !isContextualHelpOpen &&
          !isOfficialManualModalOpen
        ) {
          isInputOrModalPausedRef.current = false;
        }
      }, 150);
    };
    window.addEventListener('focusin', handleFocusIn, { passive: true });
    window.addEventListener('focusout', handleFocusOut, { passive: true });
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, [
    abortActiveSpeechRecOnly,
    isCourierRegistrationModalOpen,
    isWelcomeTourOpen,
    isContextualHelpOpen,
    isOfficialManualModalOpen,
  ]);

  const startSpeechRecognitionPt = useCallback(
    (fallbackPhrase?: string) => {
      if (fallbackPhrase) {
        executeVoiceCommandPt(fallbackPhrase);
        return;
      }
      startContinuousVoiceMic();
    },
    [executeVoiceCommandPt, startContinuousVoiceMic]
  );

  // =========================================================================
  // STEP 8 HANDLERS: VIEW MODE, MAP RADIUS & MULTI-REGION,
  // MASTER ADMIN BACKOFFICE & INTERACTIVE USER MANUAL
  // =========================================================================

  const setViewMode = useCallback(
    (mode: AppViewMode) => {
      cancelSpeechNow();
      setViewModeState(mode);
      setIsBubbleMinimized(false);
      if (mode === 'PAINEL_ADMIN') {
        setActiveTabState('admin_backoffice');
      } else {
        setActiveTabState((prev) =>
          prev === 'admin_backoffice' ? 'scanner' : prev
        );
      }
    },
    [cancelSpeechNow, setIsBubbleMinimized]
  );

  const setMapRadiusKm = useCallback((radiusKm: MapRadiusOptionKm) => {
    setState((prev) => ({
      ...prev,
      mapRadiusKm: radiusKm,
    }));
  }, []);

  const setSelectedRegionName = useCallback(
    (regionName: PortugalRegionName) => {
      setState((prev) => ({
        ...prev,
        selectedRegionName: regionName,
      }));
    },
    []
  );

  const activeRegionalDataset = useMemo<RegionalExplorerDataset>(() => {
    return (
      SEED_REGIONAL_EXPLORER_DATA.find(
        (r) => r.regionName === state.selectedRegionName
      ) || SEED_REGIONAL_EXPLORER_DATA[0]
    );
  }, [state.selectedRegionName]);

  const updateAdminCourierKycStatus = useCallback(
    (courierId: string, status: AdminCourierKycStatus) => {
      setRealKycStatusOverrides((prev) => ({
        ...prev,
        [courierId]: status,
      }));
      setState((prev) => ({
        ...prev,
        adminManagedCouriers: prev.adminManagedCouriers.map((c) =>
          c.id === courierId ? { ...c, kycStatus: status } : c
        ),
      }));
      const targetReq = cloudSharedState.approvalRequests.find(
        (r) => r.id === courierId
      );
      const targetCourier = supabaseLiveCouriers.find((c) => c.id === courierId);
      void publishAdminApprovalDecisionToCloud({
        courierId,
        username: targetReq?.username || targetCourier?.name,
        approvalStatus:
          status === 'Ativo'
            ? 'approved'
            : status === 'Suspenso'
              ? 'blocked'
              : 'pending',
      });
    },
    [cloudSharedState.approvalRequests, supabaseLiveCouriers]
  );

  const toggleMandatoryTermsEnforcement = useCallback(() => {
    setState((prev) => ({
      ...prev,
      mandatoryTermsEnforcementEnabled: !prev.mandatoryTermsEnforcementEnabled,
    }));
  }, []);

  const toggleCourierPromotionalOptIn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      courierPromotionalOptIn: !prev.courierPromotionalOptIn,
    }));
  }, []);

  const sendAdminBroadcast = useCallback(
    (input: {
      title: string;
      body: string;
      targetType: AdminBroadcastTargetType;
      targetValue: string;
      category:
        | 'OPERACIONAL_SEGURANCA_OBRIGATORIO'
        | 'PROMOCIONAL_PARCEIROS_OPT_IN';
    }): AdminBroadcastMessage => {
      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const estimatedReach =
        input.targetType === 'TODOS_ESTAFETAS'
          ? 1120
          : input.targetType === 'ZONA_ESPECIFICA'
            ? 42
            : 1;

      const newBroadcast: AdminBroadcastMessage = {
        id: `ADM-MSG-${Date.now().toString().slice(-4)}`,
        createdAt: `Hoje • ${nowStr}`,
        title: input.title.trim(),
        body: input.body.trim(),
        targetType: input.targetType,
        targetValue: input.targetValue.trim() || 'Portugal (Nacional)',
        category: input.category,
        deliveredCount: estimatedReach,
        isReadByCurrentCourier: false,
      };

      setState((prev) => ({
        ...prev,
        adminBroadcasts: [newBroadcast, ...prev.adminBroadcasts],
      }));

      return newBroadcast;
    },
    []
  );

  const markAdminBroadcastRead = useCallback((broadcastId: string) => {
    setState((prev) => ({
      ...prev,
      adminBroadcasts: prev.adminBroadcasts.map((msg) =>
        msg.id === broadcastId ? { ...msg, isReadByCurrentCourier: true } : msg
      ),
    }));
  }, []);

  const createAdminSponsoredCampaign = useCallback(
    (
      input: Omit<
        AdminSponsoredCampaign,
        'id' | 'viewsCount' | 'clicksCount' | 'vouchersRedeemedCount'
      >
    ): AdminSponsoredCampaign => {
      const newCampaign: AdminSponsoredCampaign = {
        ...input,
        id: `CAMP-ADM-${Date.now().toString().slice(-4)}`,
        viewsCount: 120,
        clicksCount: 18,
        vouchersRedeemedCount: 3,
      };

      const newMarketplaceItem: RewardMarketplaceItem = {
        id: `MKT-${newCampaign.id}`,
        title: `${input.offerHeadline} (${input.discountOrBonusValue})`,
        subtitle: `Patrocínio Oficial ${input.sponsorName} • Categoria: ${input.category} • Posição: ${input.placement}.`,
        rewardType: 'DIRETO',
        costBuddyCoins: input.requiredBuddyCoins,
        minCommunityReputationPct: 80,
        partnerBadge: `${input.category} • ${input.sponsorName}`,
        voucherCodePrefix:
          input.sponsorName
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase()
            .slice(0, 8) || 'PARCEIRO',
        partnerBusinessName: input.sponsorName,
      };

      setState((prev) => ({
        ...prev,
        adminSponsoredCampaigns: [
          newCampaign,
          ...prev.adminSponsoredCampaigns,
        ],
        customMarketplaceItems: [
          newMarketplaceItem,
          ...prev.customMarketplaceItems,
        ],
      }));

      return newCampaign;
    },
    []
  );

  const toggleAdminSponsoredCampaignActive = useCallback(
    (campaignId: string) => {
      setState((prev) => ({
        ...prev,
        adminSponsoredCampaigns: prev.adminSponsoredCampaigns.map((c) =>
          c.id === campaignId ? { ...c, isActive: !c.isActive } : c
        ),
      }));
    },
    []
  );

  const recordSponsoredCampaignClick = useCallback((campaignId: string) => {
    setState((prev) => ({
      ...prev,
      adminSponsoredCampaigns: prev.adminSponsoredCampaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              clicksCount: c.clicksCount + 1,
              viewsCount: c.viewsCount + 1,
            }
          : c
      ),
    }));
  }, []);

  const openWelcomeTour = useCallback(() => {
    setIsWelcomeTourOpen(true);
  }, []);

  const closeWelcomeTour = useCallback(() => {
    setIsWelcomeTourOpen(false);
    setState((prev) => ({
      ...prev,
      hasSeenWelcomeTour: true,
    }));
  }, []);

  const [activeDirectChatCourierId, setActiveDirectChatCourierId] = useState<
    string | null
  >(null);

  const setUserOrderAvailabilityStatus = useCallback(
    (status: CourierOrderAvailabilityStatus) => {
      setState((prev) => ({
        ...prev,
        userOrderAvailabilityStatus: status,
      }));
      if (realCourierProfile) {
        const updated: RealCourierMapProfile = {
          ...realCourierProfile,
          status: status === 'DISPONIVEL' ? 'Disponível' : 'Ocupado',
          has_order: status === 'OCUPADO_COM_PEDIDO',
          updated_at: new Date().toISOString(),
        };
        setRealCourierProfile(updated);
        void syncProfileToSupabaseAndLocalCache(updated);
      }
    },
    [realCourierProfile, syncProfileToSupabaseAndLocalCache]
  );

  const toggleUserOrderAvailabilityStatus = useCallback(() => {
    setState((prev) => {
      const nextStatus: CourierOrderAvailabilityStatus =
        prev.userOrderAvailabilityStatus === 'DISPONIVEL'
          ? 'OCUPADO_COM_PEDIDO'
          : 'DISPONIVEL';
      if (realCourierProfile) {
        const updated: RealCourierMapProfile = {
          ...realCourierProfile,
          status: nextStatus === 'DISPONIVEL' ? 'Disponível' : 'Ocupado',
          has_order: nextStatus === 'OCUPADO_COM_PEDIDO',
          updated_at: new Date().toISOString(),
        };
        setRealCourierProfile(updated);
        void syncProfileToSupabaseAndLocalCache(updated);
      }
      return {
        ...prev,
        userOrderAvailabilityStatus: nextStatus,
      };
    });
  }, [realCourierProfile, syncProfileToSupabaseAndLocalCache]);

  const toggleShareOrderStatusPublicly = useCallback(() => {
    setState((prev) => ({
      ...prev,
      shareOrderStatusPublicly: !prev.shareOrderStatusPublicly,
    }));
  }, []);

  const requestCourierContactPermission = useCallback((courierId: string) => {
    setState((prev) => ({
      ...prev,
      onlineDirectoryCouriers: prev.onlineDirectoryCouriers.map((c) =>
        c.id === courierId
          ? {
              ...c,
              contactPermission: 'PENDENTE',
              lastMessageDeliveryState: 'PENDENTE',
            }
          : c
      ),
    }));
  }, []);

  const simulateCourierAcceptContactPermission = useCallback(
    (courierId: string) => {
      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setState((prev) => ({
        ...prev,
        onlineDirectoryCouriers: prev.onlineDirectoryCouriers.map((c) => {
          if (c.id !== courierId) return c;
          const hasGreeting = c.directMessages.length > 0;
          return {
            ...c,
            contactPermission: 'APROVADO',
            isOnlineActive: true,
            lastMessageDeliveryState: 'MENSAGEM_RECEBIDA',
            directMessages: hasGreeting
              ? c.directMessages
              : [
                  {
                    id: `DM-INIT-${Date.now()}`,
                    sender: 'COLEGA',
                    text: `Contacto aceite por ${c.callsign}. Canal 1-a-1 direto ativo!`,
                    timestamp: nowStr,
                  },
                ],
          };
        }),
      }));
    },
    []
  );

  const respondToIncomingContactRequest = useCallback(
    (decision: 'ACEITE' | 'RECUSADO') => {
      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setState((prev) => {
        if (!prev.incomingContactRequest) return prev;
        const req = prev.incomingContactRequest;
        if (decision === 'RECUSADO') {
          return {
            ...prev,
            incomingContactRequest: {
              ...req,
              status: 'RECUSADO',
            },
          };
        }

        const alreadyInList = prev.onlineDirectoryCouriers.some(
          (c) => c.id === req.courierId
        );
        const updatedCouriers: OnlineDirectoryCourier[] = alreadyInList
          ? prev.onlineDirectoryCouriers.map((c) =>
              c.id === req.courierId
                ? {
                    ...c,
                    contactPermission: 'APROVADO',
                    isOnlineActive: true,
                    lastMessageDeliveryState: 'MENSAGEM_RECEBIDA',
                  }
                : c
            )
          : [
              {
                id: req.courierId,
                callsign: req.callsign,
                vehicle: req.vehicle,
                distanceKm: req.distanceKm,
                zoneName: req.zoneName,
                cellId: req.cellId,
                reputationPct: req.reputationPct,
                orderStatus: req.orderStatus,
                contactPermission: 'APROVADO',
                isOnlineActive: true,
                lastMessageDeliveryState: 'MENSAGEM_RECEBIDA',
                directMessages: [
                  {
                    id: `DM-INC-${Date.now()}`,
                    sender: 'COLEGA',
                    text: `Obrigado por aceitares! Estou na zona de ${req.zoneName} (${req.distanceKm} km).`,
                    timestamp: nowStr,
                  },
                ],
              },
              ...prev.onlineDirectoryCouriers,
            ];

        return {
          ...prev,
          incomingContactRequest: {
            ...req,
            status: 'ACEITE',
          },
          onlineDirectoryCouriers: updatedCouriers,
        };
      });
    },
    []
  );

  const sendDirectCourierMessage = useCallback(
    (courierId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setState((prev) => ({
        ...prev,
        onlineDirectoryCouriers: prev.onlineDirectoryCouriers.map((c) =>
          c.id === courierId
            ? {
                ...c,
                contactPermission: 'APROVADO',
                lastMessageDeliveryState: 'MENSAGEM_ENVIADA',
                directMessages: [
                  ...c.directMessages,
                  {
                    id: `DM-${Date.now()}`,
                    sender: 'EU',
                    text: trimmed,
                    timestamp: nowStr,
                  },
                ],
              }
            : c
        ),
      }));

      const selfProf = realCourierProfileRef.current;
      if (selfProf.id) {
        void insertDirectMessageToSupabaseRest({
          supabaseUrl: state.aiAgentConfig.supabaseUrl,
          supabaseAnonKey: state.aiAgentConfig.supabaseAnonKey,
          senderId: selfProf.id,
          senderCallsign: selfProf.name.trim() || 'Estafeta',
          recipientId: courierId,
          messageBody: trimmed,
          channelType: 'DIRECT_1ON1',
        });
      }
    },
    [state.aiAgentConfig.supabaseUrl, state.aiAgentConfig.supabaseAnonKey]
  );

  const setMapCourierFilterMode = useCallback((mode: MapCourierFilterMode) => {
    setState((prev) => ({
      ...prev,
      mapCourierFilterMode: mode,
    }));
  }, []);

  // =========================================================================
  // STEP 13 HANDLERS: THEME MODE, ±45% ALERT PREFS, PTT & CUSTOM AUTO-MESSAGES
  // =========================================================================

  const setThemeMode = useCallback((mode: AppThemeMode) => {
    try {
      sessionStorage.setItem('buddy_manual_theme_choice', mode);
    } catch {
      // ignore
    }
    setState((prev) => ({
      ...prev,
      themeMode: mode,
    }));
  }, []);

  const toggleThemeMode = useCallback(() => {
    setState((prev) => {
      const nextMode: AppThemeMode =
        prev.themeMode === 'DAYLIGHT' ? 'NIGHT' : 'DAYLIGHT';
      try {
        sessionStorage.setItem('buddy_manual_theme_choice', nextMode);
      } catch {
        // ignore
      }
      speakTextPt(
        nextMode === 'NIGHT'
          ? 'Modo noturno ativado.'
          : 'Modo claro ativado.'
      );
      return {
        ...prev,
        themeMode: nextMode,
      };
    });
  }, [speakTextPt]);

  const updateAlertPopupPrefs = useCallback(
    (patch: Partial<AlertPopupPreferences>) => {
      setState((prev) => ({
        ...prev,
        alertPopupPrefs: {
          ...prev.alertPopupPrefs,
          ...patch,
        },
      }));
    },
    []
  );

  const updateVoiceActivationConfig = useCallback(
    (patch: Partial<VoiceActivationConfig>) => {
      setState((prev) => ({
        ...prev,
        voiceActivationConfig: {
          ...prev.voiceActivationConfig,
          ...patch,
        },
      }));
    },
    []
  );

  const startPttHold = useCallback(() => {
    setIsPttActive(true);
    setIsListeningSpeechRecognition(true);
    const trigWord = state.voiceActivationConfig.customTriggerWord || 'Buddy';
    setLiveVoiceTranscription({
      isOpen: true,
      mode: 'COMANDO_BUDDY',
      phase: 'LISTENING_STREAMING',
      transcriptText: `${trigWord}`,
      fullTargetText: `${trigWord} como está o trânsito agora`,
      isEditingText: false,
      dictationTarget: null,
      sendCountdownSeconds: 0,
      sendCountdownProgressPct: 100,
      triggeredVia: 'PTT',
    });
  }, [state.voiceActivationConfig.customTriggerWord]);

  const releasePttHold = useCallback(
    (spokenOverride?: string) => {
      setIsPttActive(false);
      setIsListeningSpeechRecognition(false);
      const trigWord = state.voiceActivationConfig.customTriggerWord || 'Buddy';
      if (spokenOverride && spokenOverride.trim()) {
        executeVoiceCommandPt(spokenOverride.trim());
      } else {
        executeVoiceCommandPt(`${trigWord} como está o trânsito agora`);
      }
    },
    [executeVoiceCommandPt, state.voiceActivationConfig.customTriggerWord]
  );

  const addCustomAutoMessage = useCallback(
    (input: Omit<CustomAutoMessage, 'id'>): CustomAutoMessage => {
      const created: CustomAutoMessage = {
        ...input,
        id: `AUTO-MSG-${Date.now().toString().slice(-4)}`,
        title: input.title.trim() || 'Mensagem Rápida',
        voiceTriggerPhrase:
          input.voiceTriggerPhrase.trim() || 'Buddy enviar mensagem',
        messageBody: input.messageBody.trim(),
      };
      setState((prev) => ({
        ...prev,
        customAutoMessages: [created, ...prev.customAutoMessages],
      }));
      return created;
    },
    []
  );

  const updateCustomAutoMessage = useCallback(
    (id: string, patch: Partial<Omit<CustomAutoMessage, 'id'>>) => {
      setState((prev) => ({
        ...prev,
        customAutoMessages: prev.customAutoMessages.map((m) =>
          m.id === id ? { ...m, ...patch } : m
        ),
      }));
    },
    []
  );

  const deleteCustomAutoMessage = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      customAutoMessages: prev.customAutoMessages.filter((m) => m.id !== id),
    }));
  }, []);

  // =========================================================================
  // STEP 14 HANDLERS: EVIDENTIARY REPORT ARCHIVE VAULT ("ARQUIVO DE PROVAS")
  // & PLATFORM-SEGMENTED / CROSS-REFERENCED FINANCES & GOALS
  // =========================================================================

  const addEvidentiaryVaultRecord = useCallback(
    (
      input: Omit<
        EvidentiaryVaultRecord,
        'id' | 'protocolId' | 'firstReportedDate' | 'confirmationsCount'
      >
    ): EvidentiaryVaultRecord => {
      const todayDate = new Date().toLocaleDateString('pt-PT');
      const prefixByCategory = {
        AUTORIDADES_VIA_PUBLICA: 'PROVA-MUN',
        PLATAFORMAS_ABUSO: 'PROVA-PLAT',
        ENTREGADORES_CONDUTA: 'PROVA-COND',
        ESTABELECIMENTOS: 'PROVA-EST',
        LOCAIS_CLIENTES_ZERO_PII: 'PROVA-LOC',
      }[input.category];

      const created: EvidentiaryVaultRecord = {
        ...input,
        id: `EVID-${Date.now()}`,
        protocolId: `${prefixByCategory}-2026-${Math.floor(
          1000 + Math.random() * 8999
        )}`,
        firstReportedDate: todayDate,
        confirmationsCount: 1,
      };

      setState((prev) => ({
        ...prev,
        evidentiaryVaultRecords: [created, ...prev.evidentiaryVaultRecords],
      }));
      return created;
    },
    []
  );

  const confirmEvidentiaryVaultRecord = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      evidentiaryVaultRecords: prev.evidentiaryVaultRecords.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              confirmationsCount: rec.confirmationsCount + 1,
            }
          : rec
      ),
    }));
  }, []);

  const generateFormalEvidentiaryReportText = useCallback(
    (
      recordOrRecords: EvidentiaryVaultRecord | EvidentiaryVaultRecord[]
    ): string => {
      const records = Array.isArray(recordOrRecords)
        ? recordOrRecords
        : [recordOrRecords];
      const nowTimestamp = new Date().toLocaleString('pt-PT');

      const categoryLabelMap = {
        AUTORIDADES_VIA_PUBLICA:
          'AUTORIDADES / VIA PÚBLICA (OMISSÃO DE CONSERVAÇÃO RODOVIÁRIA)',
        PLATAFORMAS_ABUSO:
          'PLATAFORMAS DIGITAIS (ABUSO ALGORÍTMICO / DESVIO NÃO PAGO / SOBREPESO)',
        ENTREGADORES_CONDUTA:
          'CONDUTA DE ENTREGADORES (REGISTADOS OU EXTERNOS NÃO REGISTADOS)',
        ESTABELECIMENTOS:
          'ESTABELECIMENTOS PARCEIROS (ESPERA CRÓNICA / CONDIÇÕES DE RECOLHA)',
        LOCAIS_CLIENTES_ZERO_PII:
          'LOCAIS DE ENTREGA (MÁ CONDUTA / RISCO FÍSICO • ZERO-PII RGPD)',
      };

      const blocks = records.map((r, idx) => {
        const extraMeta: string[] = [];
        if (r.platformName) {
          extraMeta.push(`Plataforma: ${r.platformName}`);
        }
        if (r.orderCodeRef) {
          extraMeta.push(`Código Pedido (Zero-PII): ${r.orderCodeRef}`);
        }
        if (r.establishmentName) {
          extraMeta.push(`Estabelecimento: ${r.establishmentName}`);
        }
        if (r.courierRegistrationStatus) {
          extraMeta.push(
            `Identificação do Entregador: ${
              r.courierRegistrationStatus === 'EXTERNO_NAO_REGISTADO'
                ? 'Estafeta Externo (Não Registado na App)'
                : 'Usuário Registado na App'
            } — ${r.externalCourierDescriptor || 'S/ detalhe adicional'}`
          );
        }

        return [
          `[${idx + 1}] PROTOCOLO OFICIAL: ${r.protocolId}`,
          `• Categoria: ${categoryLabelMap[r.category]}`,
          `• Ocorrência: ${r.title}`,
          `• Localização / Ponto GPS: ${r.streetOrZoneGps}`,
          `• Data do 1.º Registo: ${r.firstReportedDate} | Tempo Sem Solução: Há ${r.daysUnresolved} dias sem reparo/resolução`,
          `• Grau de Corroboração: Confirmado por ${r.confirmationsCount} estafetas verificados`,
          `• Histórico de Reincidência: ${r.recurrenceHistory}`,
          ...(extraMeta.length > 0 ? [`• Metadados: ${extraMeta.join(' | ')}`] : []),
          `• Descrição Técnica: ${r.description}`,
          `• Enquadramento Legal / Impacto Operacional: ${r.legalImpactSummary}`,
        ].join('\n');
      });

      return [
        `====================================================================`,
        `DOSSIÊ FORMAL DE PROVA — ARQUIVO DE EVIDÊNCIAS DELIVERY BUDDY`,
        `Emitido em: ${nowTimestamp} • Conformidade Legal Zero-PII (RGPD)`,
        `Destinatários: Autoridades Municipais / Suporte Jurídico / ACT / Sindicato`,
        `Total de Registos Auditados no Dossiê: ${records.length}`,
        `====================================================================`,
        ``,
        blocks.join('\n\n--------------------------------------------------------------------\n\n'),
        ``,
        `====================================================================`,
        `Assinatura Digital de Auditoria Comunitária • Rede Delivery Buddy PT`,
      ].join('\n');
    },
    []
  );

  const setActivePlatformScope = useCallback((scope: PlatformFilterScope) => {
    setState((prev) => ({
      ...prev,
      activePlatformScope: scope,
    }));
  }, []);

  const updatePlatformLedger = useCallback(
    (platform: PlatformName, patch: Partial<PlatformFinancialLedger>) => {
      setState((prev) => {
        const current = prev.platformLedgers[platform];
        const nextPlat: PlatformFinancialLedger = {
          ...current,
          ...patch,
        };

        // If dailyGrossEur, specificTaxAndSsPct, or fleetCommissionPct changed without explicit dailyNetEarnedEur override, recalculate dailyNetEarnedEur cleanly
        if (
          (patch.dailyGrossEur !== undefined ||
            patch.specificTaxAndSsPct !== undefined ||
            patch.fleetCommissionPct !== undefined ||
            patch.tipsAndBonusesEur !== undefined) &&
          patch.dailyNetEarnedEur === undefined
        ) {
          const totalDeductionPct =
            (nextPlat.specificTaxAndSsPct + nextPlat.fleetCommissionPct) / 100;
          const computedNet = Number(
            Math.max(
              0,
              nextPlat.dailyGrossEur * (1 - totalDeductionPct) +
                nextPlat.tipsAndBonusesEur * 0.85
            ).toFixed(2)
          );
          nextPlat.dailyNetEarnedEur = computedNet;
        }

        const nextLedgers: PlatformLedgersMap = {
          ...prev.platformLedgers,
          [platform]: nextPlat,
        };

        const allPlats: PlatformFinancialLedger[] = [
          nextLedgers['Uber Eats'],
          nextLedgers.Glovo,
          nextLedgers['Bolt Food'],
        ];

        const sumDailyNet = Number(
          allPlats.reduce((acc, p) => acc + p.dailyNetEarnedEur, 0).toFixed(2)
        );
        const sumWeeklyNet = Number(
          allPlats.reduce((acc, p) => acc + p.weeklyNetEarnedEur, 0).toFixed(2)
        );
        const sumMonthlyNet = Number(
          allPlats.reduce((acc, p) => acc + p.monthlyNetEarnedEur, 0).toFixed(2)
        );
        const sumDailyGoal = Number(
          allPlats.reduce((acc, p) => acc + p.dailyNetGoalEur, 0).toFixed(2)
        );
        const sumWeeklyGoal = Number(
          allPlats.reduce((acc, p) => acc + p.weeklyNetGoalEur, 0).toFixed(2)
        );
        const sumMonthlyGoal = Number(
          allPlats.reduce((acc, p) => acc + p.monthlyNetGoalEur, 0).toFixed(2)
        );
        const sumDeliveriesToday = allPlats.reduce(
          (acc, p) => acc + p.completedDeliveriesToday,
          0
        );
        const sumKmToday = Number(
          allPlats.reduce((acc, p) => acc + p.completedKmToday, 0).toFixed(1)
        );

        return {
          ...prev,
          platformLedgers: nextLedgers,
          glovoWallet:
            platform === 'Glovo' && patch.dailyGrossEur !== undefined
              ? {
                  ...prev.glovoWallet,
                  dailyGrossGlovoEur: nextPlat.dailyGrossEur,
                }
              : prev.glovoWallet,
          personalGoals: {
            ...prev.personalGoals,
            currentDailyNetEarnedEur: sumDailyNet,
            currentWeeklyNetEarnedEur: sumWeeklyNet,
            currentMonthlyNetEarnedEur: sumMonthlyNet,
            dailyNetGoalEur: sumDailyGoal,
            weeklyNetGoalEur: sumWeeklyGoal,
            monthlyNetGoalEur: sumMonthlyGoal,
            completedDeliveriesToday: sumDeliveriesToday,
            completedKmToday: sumKmToday,
          },
        };
      });
    },
    []
  );

  // =========================================================================
  // STEP 15 HANDLERS: FLOATING BUBBLES SIDE, BUDDY PROFILE POP-UP 45%/80%,
  // MINIMIZED BUDDY AVATAR BUBBLE, CROSS-STATS CHALLENGES & EXTERNAL MAP ASSIST
  // =========================================================================

  const setFloatingBubblesSide = useCallback((side: FloatingBubblesSide) => {
    setState((prev) => ({
      ...prev,
      floatingBubblesSide: side,
    }));
  }, []);

  const setMinimizedBuddyBubbleCourierId = useCallback(
    (courierId: string | null) => {
      setState((prev) => ({
        ...prev,
        minimizedBuddyBubbleCourierId: courierId,
      }));
    },
    []
  );

  const minimizeBuddyPopupToAvatarBubble = useCallback((courierId: string) => {
    setActiveBuddyPopupCourierId(null);
    setState((prev) => ({
      ...prev,
      minimizedBuddyBubbleCourierId: courierId,
    }));
  }, []);

  const sendBuddyVoiceChatRequest = useCallback(
    (courierId: string) => {
      setState((prev) => ({
        ...prev,
        onlineDirectoryCouriers: prev.onlineDirectoryCouriers.map((c) =>
          c.id === courierId
            ? {
                ...c,
                voiceChatStatus:
                  c.voiceChatStatus === 'ATIVO' ? 'ATIVO' : 'SOLICITADO',
              }
            : c
        ),
      }));
      const target = state.onlineDirectoryCouriers.find(
        (c) => c.id === courierId
      );
      if (target) {
        speakTextPt(
          `Convite para Voice Chat em tempo real enviado para ${target.callsign}.`
        );
      }
    },
    [state.onlineDirectoryCouriers, speakTextPt]
  );

  const inviteBuddyToClosedGroup = useCallback(
    (courierId: string, groupName = 'Grupo Fechado • Amarante Centro') => {
      setState((prev) => ({
        ...prev,
        onlineDirectoryCouriers: prev.onlineDirectoryCouriers.map((c) =>
          c.id === courierId
            ? {
                ...c,
                invitedGroupName: groupName,
              }
            : c
        ),
      }));
      const target = state.onlineDirectoryCouriers.find(
        (c) => c.id === courierId
      );
      if (target) {
        speakTextPt(
          `${target.callsign} convidado para o canal fechado ${groupName}.`
        );
      }
    },
    [state.onlineDirectoryCouriers, speakTextPt]
  );

  const createBuddyChallenge = useCallback(
    (courierId: string, period: BuddyChallengePeriod) => {
      const periodMeta: Record<
        BuddyChallengePeriod,
        { label: string; userScore: number; buddyScore: number }
      > = {
        PROXIMAS_3H: {
          label: 'Próximas 3 Horas (Sprint Entregas)',
          userScore: 4,
          buddyScore: 3,
        },
        TURNO_HOJE: {
          label: 'Turno de Hoje (Meta Diária)',
          userScore: state.personalGoals.completedDeliveriesToday || 11,
          buddyScore: 12,
        },
        SEMANAL: {
          label: 'Desafio Semanal (Amarante 25 km)',
          userScore: 68,
          buddyScore: 64,
        },
      };
      const meta = periodMeta[period];
      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      });

      setState((prev) => ({
        ...prev,
        onlineDirectoryCouriers: prev.onlineDirectoryCouriers.map((c) =>
          c.id === courierId
            ? {
                ...c,
                activeChallenge: {
                  id: `CHAL-${Date.now().toString().slice(-4)}`,
                  period,
                  periodLabel: meta.label,
                  targetMetric: 'Nº de Entregas Concluídas & €/km Limpo',
                  userCurrentScore: meta.userScore,
                  buddyCurrentScore:
                    c.crossStats?.deliveriesToday && period === 'TURNO_HOJE'
                      ? c.crossStats.deliveriesToday
                      : meta.buddyScore,
                  createdAt: `Hoje • ${nowStr}`,
                },
              }
            : c
        ),
      }));
      const target = state.onlineDirectoryCouriers.find(
        (c) => c.id === courierId
      );
      if (target) {
        speakTextPt(
          `Desafio amigável criado com ${target.callsign} para o período: ${meta.label}.`
        );
      }
    },
    [
      state.onlineDirectoryCouriers,
      state.personalGoals.completedDeliveriesToday,
      speakTextPt,
    ]
  );

  const triggerExternalMapAssistMacro = useCallback(
    (action: ExternalNavMapAssistAction) => {
      const phraseMap: Record<ExternalNavMapAssistAction, string> = {
        ZOOM_IN: 'Mapa: aproximar zoom',
        ZOOM_OUT: 'Mapa: afastar zoom',
        RECENTER_ROUTE: 'Mapa: recentralizar rota',
        REPORT_HAZARD: 'Mapa: marcar perigo no mapa',
        ALTERNATIVE_ROUTE: 'Mapa: rota alternativa',
      };
      executeVoiceCommandPt(phraseMap[action]);
    },
    [executeVoiceCommandPt]
  );

  // =========================================================================
  // STEP 16: LIVE VOICE TRANSCRIPTION POP-UP ENGINE (A OUVIR & TRANSCREVER)
  // =========================================================================

  const confirmSendLiveDictatedMessage = useCallback(
    (overrideText?: string) => {
      const curr = liveVoiceTranscriptionRef.current;
      stopAllLiveVoiceTimersAndRec();
      const finalText = (
        overrideText ??
        curr?.transcriptText ??
        curr?.fullTargetText ??
        ''
      ).trim();
      if (!finalText) {
        return;
      }

      const target = curr?.dictationTarget;
      if (target?.targetType === 'BUDDY_DIRETO' && target.recipientId) {
        sendDirectCourierMessage(target.recipientId, finalText);
      } else if (target?.targetType === 'WALKIE_CANAL') {
        sendWalkieMessage(finalText, { isVoicePtt: true, voiceDurationSec: 3 });
      } else {
        try {
          navigator.clipboard?.writeText(finalText);
        } catch {
          // Ignore clipboard errors
        }
      }

      const recipientName = target?.recipientName || 'Destinatário';
      setLiveVoiceTranscription((prev) =>
        prev
          ? {
              ...prev,
              isOpen: true,
              phase: 'MESSAGE_SENT_CONFIRMATION',
              transcriptText: finalText,
              fullTargetText: finalText,
              isEditingText: false,
              sendCountdownSeconds: 0,
              sendCountdownProgressPct: 0,
            }
          : null
      );

      const spokenConfirmation =
        target?.targetType === 'BUDDY_DIRETO' ||
        target?.targetType === 'WALKIE_CANAL'
          ? `Mensagem enviada para ${recipientName}: ${finalText}`
          : `Mensagem ditada copiada e pronta para ${recipientName}: ${finalText}`;
      speakTextPt(spokenConfirmation);

      const configuredSeconds =
        state.alertPopupPrefs.durationMode === '3S'
          ? 3
          : state.alertPopupPrefs.durationMode === '10S'
          ? 10
          : 5;
      window.setTimeout(() => {
        setLiveVoiceTranscription(null);
      }, configuredSeconds * 1000);
    },
    [
      sendDirectCourierMessage,
      sendWalkieMessage,
      speakTextPt,
      state.alertPopupPrefs.durationMode,
      stopAllLiveVoiceTimersAndRec,
    ]
  );

  const startDictationTwoSecondCountdown = useCallback(() => {
    if (sendCountdownTimerRef.current) {
      window.clearInterval(sendCountdownTimerRef.current);
      sendCountdownTimerRef.current = null;
    }
    let remainingMs = 2000;
    setLiveVoiceTranscription((prev) =>
      prev
        ? {
            ...prev,
            phase: 'TRANSCRIPT_READY_COUNTDOWN',
            sendCountdownSeconds: 2,
            sendCountdownProgressPct: 100,
          }
        : null
    );

    sendCountdownTimerRef.current = window.setInterval(() => {
      if (liveVoiceTranscriptionRef.current?.isEditingText) {
        if (sendCountdownTimerRef.current) {
          window.clearInterval(sendCountdownTimerRef.current);
          sendCountdownTimerRef.current = null;
        }
        return;
      }
      remainingMs -= 100;
      if (remainingMs <= 0) {
        if (sendCountdownTimerRef.current) {
          window.clearInterval(sendCountdownTimerRef.current);
          sendCountdownTimerRef.current = null;
        }
        confirmSendLiveDictatedMessage();
      } else {
        const secs = Math.max(0.1, Number((remainingMs / 1000).toFixed(1)));
        const pct = Math.min(100, Math.max(0, (remainingMs / 2000) * 100));
        setLiveVoiceTranscription((prev) =>
          prev
            ? {
                ...prev,
                sendCountdownSeconds: secs,
                sendCountdownProgressPct: pct,
              }
            : null
        );
      }
    }, 100);
  }, [confirmSendLiveDictatedMessage]);

  const startLiveVoiceDictation = useCallback(
    (config: LiveVoiceDictationConfig) => {
      stopAllLiveVoiceTimersAndRec();
      cancelSpeechNow();
      setEphemeralVoiceOverlay(null);

      const samplePhrase =
        config.initialPhrase ||
        (config.targetType === 'BUDDY_DIRETO'
          ? `Boas ${config.recipientName}, estás perto do centro de Amarante?`
          : config.targetType === 'WALKIE_CANAL'
          ? 'Pessoal de Amarante, trânsito limpo na Ponte de São Gonçalo e zero espera!'
          : config.targetType === 'CLIENTE'
          ? 'Olá! Já recolhi o seu pedido e estou a caminho. Chego em 4 minutos.'
          : 'Olá Suporte, o pedido excede o peso limite da mochila. Solicito apoio.');

      setLiveVoiceTranscription({
        isOpen: true,
        mode: 'MENSAGEM_DITADA',
        phase: 'LISTENING_STREAMING',
        transcriptText: '',
        fullTargetText: samplePhrase,
        isEditingText: false,
        dictationTarget: config,
        sendCountdownSeconds: 2,
        sendCountdownProgressPct: 100,
        triggeredVia: 'DICTATION_MIC',
      });

      let receivedRealSpeech = false;

      // Try Web Speech API ONLY when not running inside the Native Android .APK
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const SpeechRec = !w.BuddyNativeOverlay
        ? w.SpeechRecognition || w.webkitSpeechRecognition
        : null;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          activeSpeechRecRef.current = rec;
          rec.lang = 'pt-BR';
          rec.continuous = true;
          rec.interimResults = true;
          setIsListeningSpeechRecognition(true);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rec.onresult = (event: any) => {
            let liveInterim = '';
            let finalText = '';
            for (let i = 0; i < event.results.length; i++) {
              const transcriptPiece = event.results[i][0]?.transcript || '';
              if (event.results[i].isFinal) {
                finalText += transcriptPiece + ' ';
              } else {
                liveInterim += transcriptPiece;
              }
            }
            const combined = (finalText + liveInterim).trim();
            if (combined) {
              receivedRealSpeech = true;
              if (wordStreamTimerRef.current) {
                window.clearInterval(wordStreamTimerRef.current);
                wordStreamTimerRef.current = null;
              }
              const norm = combined.toLowerCase();
              if (
                norm === 'cancelar' ||
                norm === 'cancelar alerta' ||
                norm === 'parar'
              ) {
                dismissEphemeralVoiceOverlay();
                return;
              }
              if (norm === 'limpar' || norm === 'apagar') {
                setLiveVoiceTranscription((prev) =>
                  prev
                    ? {
                        ...prev,
                        transcriptText: '',
                        fullTargetText: '',
                      }
                    : null
                );
                return;
              }
              setLiveVoiceTranscription((prev) =>
                prev
                  ? {
                      ...prev,
                      isOpen: true,
                      phase: 'LISTENING_STREAMING',
                      transcriptText: combined,
                      fullTargetText: finalText.trim() || combined,
                    }
                  : null
              );
            }
          };

          rec.onerror = () => {
            setIsListeningSpeechRecognition(false);
          };
          rec.onend = () => {
            setIsListeningSpeechRecognition(false);
            if (receivedRealSpeech) {
              startDictationTwoSecondCountdown();
            }
          };

          rec.start();
        } catch {
          setIsListeningSpeechRecognition(false);
        }
      }

      // Simulated Live Dictation Stream (60ms per word) so preview & mic taps always show word-by-word live feedback
      const words = samplePhrase.trim().split(/\s+/).filter(Boolean);
      let idx = 0;
      wordStreamTimerRef.current = window.setInterval(() => {
        if (receivedRealSpeech) {
          if (wordStreamTimerRef.current) {
            window.clearInterval(wordStreamTimerRef.current);
            wordStreamTimerRef.current = null;
          }
          return;
        }
        idx += 1;
        const partial = words.slice(0, idx).join(' ');
        const isDone = idx >= words.length;

        setLiveVoiceTranscription((prev) =>
          prev
            ? {
                ...prev,
                isOpen: true,
                phase: isDone
                  ? 'TRANSCRIPT_READY_COUNTDOWN'
                  : 'LISTENING_STREAMING',
                transcriptText: partial,
                fullTargetText: samplePhrase,
              }
            : null
        );

        if (isDone) {
          if (wordStreamTimerRef.current) {
            window.clearInterval(wordStreamTimerRef.current);
            wordStreamTimerRef.current = null;
          }
          if (activeSpeechRecRef.current) {
            try {
              activeSpeechRecRef.current.stop();
            } catch {
              // Ignore
            }
            activeSpeechRecRef.current = null;
          }
          setIsListeningSpeechRecognition(false);
          startDictationTwoSecondCountdown();
        }
      }, 60);
    },
    [
      cancelSpeechNow,
      dismissEphemeralVoiceOverlay,
      startDictationTwoSecondCountdown,
      stopAllLiveVoiceTimersAndRec,
    ]
  );

  const startLiveVoiceCommandSession = useCallback(
    (
      initialPhrase?: string,
      _triggeredVia: 'PTT' | 'TRIGGER_WORD' | 'VOICE_COMMAND' = 'TRIGGER_WORD'
    ) => {
      if (initialPhrase) {
        executeVoiceCommandPt(initialPhrase);
      } else {
        startContinuousVoiceMic();
      }
    },
    [executeVoiceCommandPt, startContinuousVoiceMic]
  );

  const updateLiveVoiceTranscriptText = useCallback(
    (text: string) => {
      if (wordStreamTimerRef.current) {
        window.clearInterval(wordStreamTimerRef.current);
        wordStreamTimerRef.current = null;
      }
      if (sendCountdownTimerRef.current) {
        window.clearInterval(sendCountdownTimerRef.current);
        sendCountdownTimerRef.current = null;
      }
      const norm = text.trim().toLowerCase();
      if (norm === 'cancelar' || norm === 'cancelar alerta') {
        dismissEphemeralVoiceOverlay();
        return;
      }
      if (norm === 'limpar') {
        setLiveVoiceTranscription((prev) =>
          prev
            ? {
                ...prev,
                transcriptText: '',
                fullTargetText: '',
              }
            : null
        );
        return;
      }
      setLiveVoiceTranscription((prev) =>
        prev
          ? {
              ...prev,
              transcriptText: text,
              fullTargetText: text,
            }
          : null
      );
    },
    [dismissEphemeralVoiceOverlay]
  );

  const setLiveVoiceEditing = useCallback((editing: boolean) => {
    if (editing && sendCountdownTimerRef.current) {
      window.clearInterval(sendCountdownTimerRef.current);
      sendCountdownTimerRef.current = null;
    }
    setLiveVoiceTranscription((prev) =>
      prev
        ? {
            ...prev,
            isEditingText: editing,
          }
        : null
    );
  }, []);

  const clearLiveVoiceTranscriptText = useCallback(() => {
    if (wordStreamTimerRef.current) {
      window.clearInterval(wordStreamTimerRef.current);
      wordStreamTimerRef.current = null;
    }
    if (sendCountdownTimerRef.current) {
      window.clearInterval(sendCountdownTimerRef.current);
      sendCountdownTimerRef.current = null;
    }
    setLiveVoiceTranscription((prev) =>
      prev
        ? {
            ...prev,
            phase: 'LISTENING_STREAMING',
            transcriptText: '',
            fullTargetText: '',
          }
        : null
    );
  }, []);

  const cancelLiveVoiceTranscription = useCallback(() => {
    dismissEphemeralVoiceOverlay();
  }, [dismissEphemeralVoiceOverlay]);

  // =========================================================================
  // STEP 17: EMBEDDED AI AGENT (GEMINI PRO / HYBRID) & SUPABASE REALTIME
  // =========================================================================

  const updateAiAgentConfig = useCallback(
    (patch: Partial<AiAgentMasterConfig>) => {
      setState((prev) => {
        const sanitizedPatch: Partial<AiAgentMasterConfig> = { ...patch };
        if (sanitizedPatch.supabaseUrl !== undefined) {
          sanitizedPatch.supabaseUrl = sanitizeSupabaseUrlInput(
            sanitizedPatch.supabaseUrl
          );
        }
        if (sanitizedPatch.supabaseAnonKey !== undefined) {
          sanitizedPatch.supabaseAnonKey = sanitizeSupabaseKeyInput(
            sanitizedPatch.supabaseAnonKey
          );
        }

        const nextTier =
          sanitizedPatch.dailyQuotaTier ?? prev.aiAgentConfig.dailyQuotaTier;
        const nextMax =
          sanitizedPatch.dailyApiCallsMax !== undefined
            ? sanitizedPatch.dailyApiCallsMax
            : nextTier === 'PAY_AS_YOU_GO_ILIMITADO'
            ? 50000
            : 1500;
        const nextSelectedModel =
          sanitizedPatch.selectedGeminiModel ??
          prev.aiAgentConfig.selectedGeminiModel;
        const nextCustomModel =
          sanitizedPatch.customExperimentalModelId ??
          prev.aiAgentConfig.customExperimentalModelId;
        const nextResolvedModelName = resolveActiveGeminiModelId(
          nextSelectedModel,
          nextCustomModel,
          'SKILL_LEARNING_OR_TEST'
        );

        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(
              GEMINI_MODEL_STORAGE_KEY,
              nextSelectedModel
            );
            window.localStorage.setItem(
              GEMINI_CUSTOM_MODEL_STORAGE_KEY,
              nextCustomModel
            );
            if (sanitizedPatch.geminiApiKey !== undefined) {
              window.localStorage.setItem(
                GEMINI_API_KEY_STORAGE_KEY,
                sanitizedPatch.geminiApiKey
              );
            }
            if (sanitizedPatch.supabaseUrl !== undefined) {
              window.localStorage.setItem(
                SUPABASE_URL_STORAGE_KEY,
                sanitizedPatch.supabaseUrl
              );
            }
            if (sanitizedPatch.supabaseAnonKey !== undefined) {
              window.localStorage.setItem(
                SUPABASE_ANON_KEY_STORAGE_KEY,
                sanitizedPatch.supabaseAnonKey
              );
            }
            if (sanitizedPatch.productionModeRealOnly !== undefined) {
              window.localStorage.setItem(
                PRODUCTION_MODE_STORAGE_KEY,
                String(sanitizedPatch.productionModeRealOnly)
              );
            }
          } catch {
            // ignore storage errors
          }
        }

        return {
          ...prev,
          aiAgentConfig: {
            ...prev.aiAgentConfig,
            ...sanitizedPatch,
            activeResolvedModelName: nextResolvedModelName,
            dailyApiCallsMax: nextMax,
          },
        };
      });
    },
    []
  );

  const testGeminiStudioConnection = useCallback(async () => {
    const nowStr = new Date().toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const validation = await validateGeminiStudioConnection(
      state.aiAgentConfig.geminiApiKey,
      state.aiAgentConfig.selectedGeminiModel,
      state.aiAgentConfig.customExperimentalModelId
    );

    setRealApiCallsCount((c) => c + 1);

    setState((prev) => ({
      ...prev,
      aiAgentConfig: {
        ...prev.aiAgentConfig,
        activeResolvedModelName: validation.activeModel,
        connectionStatus: validation.ok ? 'ATIVO' : 'OFFLINE_SIMULADO',
        lastTestedAt: `Hoje • ${nowStr} (${validation.activeModel} • ${validation.latencyMs}ms)`,
        lastResponseStatusText: validation.statusText,
        lastLatencyMs: validation.latencyMs,
        dailyApiCallsUsed: Math.min(
          prev.aiAgentConfig.dailyApiCallsMax,
          prev.aiAgentConfig.dailyApiCallsUsed + 1
        ),
      },
    }));
  }, [
    state.aiAgentConfig.geminiApiKey,
    state.aiAgentConfig.selectedGeminiModel,
    state.aiAgentConfig.customExperimentalModelId,
  ]);

  const testGeminiFlashConnection = testGeminiStudioConnection;

  const saveAndConnectSupabaseRealtime = useCallback(
    (supabaseUrl: string, supabaseAnonKey: string) => {
      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const result = connectSupabaseRealtimeSocket(
        supabaseUrl,
        supabaseAnonKey
      );
      setState((prev) => ({
        ...prev,
        aiAgentConfig: {
          ...prev.aiAgentConfig,
          supabaseUrl: result.sanitizedUrl,
          supabaseAnonKey: result.sanitizedKey,
          supabaseRealtimeConnected: result.connected,
          supabaseLastConnectedAt: result.connected
            ? `Conectado Hoje • ${nowStr}`
            : 'Aguardar Chaves do Supabase',
        },
      }));
      return {
        connected: result.connected,
        statusMessage: result.statusMessage,
        sanitizedUrl: result.sanitizedUrl,
        sanitizedKey: result.sanitizedKey,
      };
    },
    []
  );

  const toggleProductionModeRealOnly = useCallback(() => {
    setState((prev) => {
      const nextProd = !prev.aiAgentConfig.productionModeRealOnly;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(
            PRODUCTION_MODE_STORAGE_KEY,
            String(nextProd)
          );
        } catch {
          // ignore storage errors
        }
      }
      return {
        ...prev,
        aiAgentConfig: {
          ...prev.aiAgentConfig,
          productionModeRealOnly: nextProd,
        },
      };
    });
  }, []);

  const approveAndPublishAiSkillLog = useCallback(
    (logId: string) => {
      const target = state.aiSkillLogs.find((l) => l.id === logId);
      setState((prev) => ({
        ...prev,
        aiSkillLogs: prev.aiSkillLogs.map((entry) =>
          entry.id === logId ? { ...entry, status: 'PUBLICADA_OTA' } : entry
        ),
      }));
      if (target) {
        speakTextPt(
          `Skill aprovada e publicada via OTA para a rede de Amarante: ${target.skillTitle}.`
        );
      }
    },
    [state.aiSkillLogs, speakTextPt]
  );

  const discardAiSkillLog = useCallback((logId: string) => {
    setState((prev) => ({
      ...prev,
      aiSkillLogs: prev.aiSkillLogs.filter((entry) => entry.id !== logId),
    }));
  }, []);

  const testAiSkillLogMacro = useCallback(
    (logId: string) => {
      const target = state.aiSkillLogs.find((l) => l.id === logId);
      if (!target) return;
      speakTextPt(
        `A testar macro aprendida pela IA em ${target.platformOrApp}: ${target.skillTitle}. Confiança ${target.confidenceScorePct} por cento.`
      );
    },
    [state.aiSkillLogs, speakTextPt]
  );

  const simulateNewAiSkillLearning = useCallback(
    (
      categoryOverride?: Exclude<AiSkillLogCategory, 'TODAS'>
    ): AiSkillLearningLogEntry => {
      const nowStr = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const simulatedTemplates: Array<
        Omit<AiSkillLearningLogEntry, 'id' | 'timestamp'>
      > = [
        {
          category: 'SKILLS_TOQUE_UI',
          platformOrApp: 'Glovo',
          skillTitle:
            'Skill Aprendida: Solicitar Taxa de Espera (>15 min) — Glovo v14.2',
          actionSequenceSummary:
            'Toque %X:91 %Y:07 (Ajuda) → Toque %X:50 %Y:38 ("Restaurante Atrasado") → Anexar Cronómetro GPS (18m40s em Burger King Amarante Retail) → Enviar (%X:88 %Y:92).',
          confidenceScorePct: 99.4,
          status: 'PRONTA_APROVACAO',
          learnedFromCourierTag: state.verifiedAccount.courierName,
          zoneContext: 'Burger King — Amarante Retail',
        },
        {
          category: 'INTELIGENCIA_RUA_AMARANTE',
          platformOrApp: 'Uber Eats',
          skillTitle:
            'Padrão de Rua Detetado: Pingo Doce São Gonçalo (Recolha Rápida <3 min pela Porta Lateral)',
          actionSequenceSummary:
            'Correlação de entregas em Amarante: acesso pelo estacionamento lateral reduz tempo de recolha em 6.5 min face à fila principal. Dica injetada no Scanner.',
          confidenceScorePct: 98.8,
          status: 'PRONTA_APROVACAO',
          learnedFromCourierTag: state.verifiedAccount.courierName,
          zoneContext: 'Pingo Doce — São Gonçalo (Amarante)',
        },
        {
          category: 'PADROES_UTILIZADORES',
          platformOrApp: 'Bolt Food',
          skillTitle:
            'Perfil de Utilizador Aprendido: Macro "Avisar Cliente Cheguei" a 150m do destino',
          actionSequenceSummary:
            'Padrão ergonómico detetado em Vila Meã: redução de espera na portaria em 48% ao pré-enviar mensagem automática via Trigger Word "Buddy".',
          confidenceScorePct: 97.6,
          status: 'PRONTA_APROVACAO',
          learnedFromCourierTag: state.verifiedAccount.courierName,
          zoneContext: 'Vila Meã (Amarante 25 km)',
        },
        {
          category: 'SKILLS_TOQUE_UI',
          platformOrApp: 'Google Maps',
          skillTitle:
            'Skill Aprendida: Evitar Ponte Pedonal São Gonçalo & Forçar EN15 — Google Maps',
          actionSequenceSummary:
            'Toque %X:28 %Y:84 (Rotas Alternativas) → Selecionar Via Ponte Nova / EN15 (%X:52 %Y:61) → Recentralizar Navegação 3D (%X:14 %Y:82).',
          confidenceScorePct: 99.2,
          status: 'PRONTA_APROVACAO',
          learnedFromCourierTag: state.verifiedAccount.courierName,
          zoneContext: 'Centro Histórico Amarante → Freixo',
        },
      ];

      const pool = categoryOverride
        ? simulatedTemplates.filter((t) => t.category === categoryOverride)
        : simulatedTemplates;
      const chosen =
        pool[Math.floor(Math.random() * pool.length)] || simulatedTemplates[0];

      const created: AiSkillLearningLogEntry = {
        ...chosen,
        id: `AI-SIM-${Date.now().toString().slice(-5)}`,
        timestamp: `Agora • ${nowStr}`,
        deviceModel: deviceScreenProfile.deviceModel,
        screenAspectRatio: deviceScreenProfile.screenAspectRatio,
        learningOrigin: 'PASSIVA_AUTOMATICA',
      };

      setRealApiCallsCount((c) => c + 1);

      setState((prev) => ({
        ...prev,
        aiSkillLogs: [created, ...prev.aiSkillLogs],
        aiAgentConfig: {
          ...prev.aiAgentConfig,
          dailyApiCallsUsed: Math.min(
            prev.aiAgentConfig.dailyApiCallsMax,
            prev.aiAgentConfig.dailyApiCallsUsed + 1
          ),
        },
      }));

      return created;
    },
    [
      state.verifiedAccount.courierName,
      deviceScreenProfile.deviceModel,
      deviceScreenProfile.screenAspectRatio,
    ]
  );

  const resetAllToSeed = useCallback(() => {
    cancelSpeechNow();
    stopAllLiveVoiceTimersAndRec();
    const fresh = getDefaultState();
    setState({ ...fresh, isAuthenticated: true });
    setActiveScannedOffer(SCANNER_OFFER_PRESETS[0]);
    setIsOfferAccepted(false);
    setActiveDirectChatCourierId(null);
    setActiveBuddyPopupCourierId(null);
    setEphemeralVoiceOverlay(null);
    setLiveVoiceTranscription(null);
    setActiveSkillTeachingSession(null);
    setSosPendingConfirmation({ isPending: false, secondsRemaining: 0 });
    setRealCompletedDeliveries([]);
    setRealApiCallsCount(0);
    setHasRealActiveDelivery(false);
    setRealGlovoWalletPatch({});
    setMarketHourlySnapshots([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REAL_COMPLETED_DELIVERIES_STORAGE_KEY);
    localStorage.removeItem(REAL_API_CALLS_COUNT_STORAGE_KEY);
    localStorage.removeItem(MARKET_HOURLY_SNAPSHOTS_STORAGE_KEY);
  }, [cancelSpeechNow, stopAllLiveVoiceTimersAndRec]);

  // =========================================================================
  // PRODUCTION MODE ("MODO PRODUÇÃO REAL") 100% MOCK-FREE DERIVED SELECTORS
  // =========================================================================
  const isProdMode = Boolean(state.aiAgentConfig.productionModeRealOnly);

  const MOCK_COURIER_NAMES = useMemo(
    () => [
      'Tiago R.',
      'Carlos M.',
      'Inês V.',
      'Rui S.',
      'Rui K.',
      'Rui Moto',
      'Filipe T.',
      'Bruno Costa',
      'André F.',
      'Miguel P.',
      'Sofia L.',
    ],
    []
  );

  const mapZoneToAmaranteCellId = useCallback((zoneStr: string): string => {
    const z = (zoneStr || '').toLowerCase();
    if (z.includes('freixo')) return 'CELL-AMR-FREIXO';
    if (z.includes('vila me')) return 'CELL-AMR-VILAMEA';
    if (z.includes('lixa') || z.includes('felgueiras'))
      return 'CELL-AMR-FELGUEIRAS';
    if (z.includes('marco')) return 'CELL-AMR-MARCO';
    return 'CELL-AMR-CENTRO';
  }, []);

  // Keep realCourierProfile and supabaseLiveCouriers materialized in state.onlineDirectoryCouriers
  // so direct messages, voice chat requests, group invites, and friendly challenges persist on real couriers.
  useEffect(() => {
    const combinedRealRows: SupabaseCourierRow[] = [];
    const isSelfRegistered = Boolean(
      realCourierProfile &&
        realCourierProfile.isRegistered &&
        realCourierProfile.name.trim().length > 0
    );
    const myLat = realCourierProfile?.lat || AMARANTE_DEFAULT_COORDS.lat;
    const myLng = realCourierProfile?.lng || AMARANTE_DEFAULT_COORDS.lng;

    if (isSelfRegistered) {
      combinedRealRows.push({
        id: realCourierProfile.id,
        name: realCourierProfile.name.trim(),
        vehicle: realCourierProfile.vehicle,
        status: state.userOrderAvailabilityStatus,
        has_order: state.userOrderAvailabilityStatus === 'OCUPADO_COM_PEDIDO',
        lat: realCourierProfile.lat,
        lng: realCourierProfile.lng,
        zone: realCourierProfile.zone,
        reputation: realCourierProfile.reputation || 100,
        buddy_since: realCourierProfile.buddy_since || 'Fundador • Out 2026',
        updated_at: realCourierProfile.updated_at,
        avatar_url: realCourierProfile.avatar_url,
        active_platforms: activePlatforms,
      });
    }
    supabaseLiveCouriers.forEach((row) => {
      if (!row.name || !row.name.trim()) return;
      if (!combinedRealRows.some((r) => r.id === row.id)) {
        combinedRealRows.push(row);
      }
    });
    if (combinedRealRows.length === 0) return;

    setState((prev) => {
      let changed = false;
      const nextList = [...prev.onlineDirectoryCouriers];

      combinedRealRows.forEach((row) => {
        const isSelf = Boolean(
          isSelfRegistered && row.id === realCourierProfile.id
        );
        const existingIdx = nextList.findIndex((c) => c.id === row.id);
        const initials =
          (row.name || 'EU')
            .trim()
            .split(/\s+/)
            .map((p) => p[0]?.toUpperCase() || '')
            .join('')
            .slice(0, 2) || 'EU';
        const orderStatus: CourierOrderAvailabilityStatus = isSelf
          ? prev.userOrderAvailabilityStatus
          : row.has_order ||
              row.status === 'Ocupado' ||
              row.status === 'OCUPADO_COM_PEDIDO'
            ? 'OCUPADO_COM_PEDIDO'
            : 'DISPONIVEL';
        const cellId = mapZoneToAmaranteCellId(row.zone);
        const normalizedVehicle = (
          [
            'Mota',
            'Mota 125cc',
            'Scooter Elétrica',
            'Carro',
            'Bicicleta Elétrica',
          ].includes(row.vehicle)
            ? row.vehicle
            : 'Mota 125cc'
        ) as OnlineDirectoryCourier['vehicle'];
        const resolvedPhoto = isSelf
          ? realCourierProfile.avatar_url || row.avatar_url
          : row.avatar_url;
        const resolvedPlats: PlatformName[] = isSelf
          ? activePlatforms
          : row.active_platforms && row.active_platforms.length > 0
            ? row.active_platforms
            : ['Uber Eats', 'Glovo'];
        const distKm = isSelf
          ? 0.0
          : calculateHaversineDistanceKm(
              myLat,
              myLng,
              row.lat || AMARANTE_DEFAULT_COORDS.lat,
              row.lng || AMARANTE_DEFAULT_COORDS.lng
            );

        if (existingIdx >= 0) {
          const ex = nextList[existingIdx];
          if (
            ex.callsign !== row.name ||
            ex.vehicle !== normalizedVehicle ||
            ex.zoneName !== row.zone ||
            ex.orderStatus !== orderStatus ||
            ex.isSelfProfile !== isSelf ||
            ex.distanceKm !== distKm ||
            ex.lat !== row.lat ||
            ex.lng !== row.lng ||
            ex.avatarPhotoUrl !== resolvedPhoto ||
            JSON.stringify(ex.activePlatforms) !== JSON.stringify(resolvedPlats)
          ) {
            changed = true;
            nextList[existingIdx] = {
              ...ex,
              callsign: row.name,
              isSelfProfile: isSelf,
              vehicle: normalizedVehicle,
              distanceKm: distKm,
              zoneName: row.zone,
              cellId,
              orderStatus,
              avatarInitials: initials,
              avatarPhotoUrl: resolvedPhoto,
              activePlatforms: resolvedPlats,
              buddyTenureText: row.buddy_since || 'Fundador • Out 2026',
              lat: row.lat,
              lng: row.lng,
              updatedAtIso: row.updated_at,
            };
          }
        } else {
          changed = true;
          const timeLabel = new Date(
            row.updated_at || Date.now()
          ).toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const newEntry: OnlineDirectoryCourier = {
            id: row.id,
            callsign: row.name,
            isSelfProfile: isSelf,
            vehicle: normalizedVehicle,
            distanceKm: distKm,
            zoneName: row.zone,
            cellId,
            reputationPct: row.reputation ?? 100,
            orderStatus,
            contactPermission: 'APROVADO',
            isOnlineActive: true,
            lastMessageDeliveryState: 'MENSAGEM_RECEBIDA',
            directMessages: [
              {
                id: `DM-REAL-${row.id.slice(0, 6)}`,
                sender: isSelf ? 'EU' : 'COLEGA',
                text: isSelf
                  ? `Meu Perfil Online ativo em ${row.zone} (${normalizedVehicle}). Sincronizado com Supabase Realtime.`
                  : `${row.name} entrou online no mapa em ${row.zone} (${normalizedVehicle}).`,
                timestamp: timeLabel,
              },
            ],
            avatarInitials: initials,
            avatarPhotoUrl: resolvedPhoto,
            activePlatforms: resolvedPlats,
            buddyTenureText: row.buddy_since || 'Fundador • Out 2026',
            voiceChatStatus: 'INATIVO',
            invitedGroupName: null,
            crossStats: {
              deliveriesToday: isSelf ? realCompletedDeliveries.length : 1,
              avgEurPerKm: 1.15,
              activeHoursToday: isSelf
                ? Number((realCompletedDeliveries.length * 0.3).toFixed(1))
                : 1.0,
              syncScorePct: 99,
            },
            activeChallenge: null,
            lat: row.lat,
            lng: row.lng,
            updatedAtIso: row.updated_at,
          };
          if (isSelf) {
            nextList.unshift(newEntry);
          } else {
            nextList.push(newEntry);
          }
        }
      });

      return changed ? { ...prev, onlineDirectoryCouriers: nextList } : prev;
    });
  }, [
    realCourierProfile,
    supabaseLiveCouriers,
    state.userOrderAvailabilityStatus,
    mapZoneToAmaranteCellId,
    realCompletedDeliveries.length,
    activePlatforms,
  ]);

  const effectiveOnlineDirectoryCouriers = useMemo(() => {
    const isSelfRegistered = Boolean(
      realCourierProfile &&
        realCourierProfile.isRegistered &&
        realCourierProfile.name.trim().length > 0
    );
    const myLat = realCourierProfile?.lat || AMARANTE_DEFAULT_COORDS.lat;
    const myLng = realCourierProfile?.lng || AMARANTE_DEFAULT_COORDS.lng;

    const realIds = new Set<string>();
    if (isSelfRegistered) realIds.add(realCourierProfile.id);
    supabaseLiveCouriers.forEach((r) => {
      if (r.name && r.name.trim()) realIds.add(r.id);
    });

    const normalizeCourierVehicle = (
      v: string
    ): OnlineDirectoryCourier['vehicle'] =>
      ([
        'Mota',
        'Mota 125cc',
        'Scooter Elétrica',
        'Carro',
        'Bicicleta Elétrica',
      ].includes(v)
        ? v
        : 'Mota 125cc') as OnlineDirectoryCourier['vehicle'];

    const buildFallbackDirectoryEntry = (
      row: SupabaseCourierRow,
      isSelf: boolean
    ): OnlineDirectoryCourier => {
      const initials =
        (row.name || 'EU')
          .trim()
          .split(/\s+/)
          .map((p) => p[0]?.toUpperCase() || '')
          .join('')
          .slice(0, 2) || 'EU';
      const orderStatus: CourierOrderAvailabilityStatus = isSelf
        ? state.userOrderAvailabilityStatus
        : row.has_order ||
            row.status === 'Ocupado' ||
            row.status === 'OCUPADO_COM_PEDIDO'
          ? 'OCUPADO_COM_PEDIDO'
          : 'DISPONIVEL';
      const normalizedVehicle = normalizeCourierVehicle(row.vehicle);
      const resolvedPhoto = isSelf
        ? realCourierProfile.avatar_url || row.avatar_url
        : row.avatar_url;
      const resolvedPlats: PlatformName[] = isSelf
        ? activePlatforms
        : row.active_platforms && row.active_platforms.length > 0
          ? row.active_platforms
          : ['Uber Eats', 'Glovo'];
      const distKm = isSelf
        ? 0.0
        : calculateHaversineDistanceKm(
            myLat,
            myLng,
            row.lat || AMARANTE_DEFAULT_COORDS.lat,
            row.lng || AMARANTE_DEFAULT_COORDS.lng
          );
      return {
        id: row.id,
        callsign: row.name,
        isSelfProfile: isSelf,
        vehicle: normalizedVehicle,
        distanceKm: distKm,
        zoneName: row.zone,
        cellId: mapZoneToAmaranteCellId(row.zone),
        reputationPct: row.reputation ?? 100,
        orderStatus,
        contactPermission: 'APROVADO',
        isOnlineActive: true,
        lastMessageDeliveryState: 'MENSAGEM_RECEBIDA',
        directMessages: [
          {
            id: `DM-REAL-${row.id.slice(0, 6)}`,
            sender: isSelf ? 'EU' : 'COLEGA',
            text: isSelf
              ? `Meu Perfil Online ativo em ${row.zone} (${normalizedVehicle}). Sincronizado com Supabase Realtime.`
              : `${row.name} está online em ${row.zone} (${normalizedVehicle}).`,
            timestamp: 'Agora',
          },
        ],
        avatarInitials: initials,
        avatarPhotoUrl: resolvedPhoto,
        activePlatforms: resolvedPlats,
        buddyTenureText: row.buddy_since || 'Fundador • Out 2026',
        voiceChatStatus: 'INATIVO',
        invitedGroupName: null,
        crossStats: {
          deliveriesToday: isSelf ? realCompletedDeliveries.length : 1,
          avgEurPerKm: 1.15,
          activeHoursToday: isSelf
            ? Number((realCompletedDeliveries.length * 0.3).toFixed(1))
            : 1.0,
          syncScorePct: 99,
        },
        activeChallenge: null,
        lat: row.lat,
        lng: row.lng,
        updatedAtIso: row.updated_at,
      };
    };

    const result: OnlineDirectoryCourier[] = [];
    const seen = new Set<string>();

    // 1. Place the user's own registered profile at the very top ONLY when explicitly registered on this device
    if (isSelfRegistered) {
      const existingSelf = state.onlineDirectoryCouriers.find(
        (c) => c.id === realCourierProfile.id
      );
      const selfRow: SupabaseCourierRow = {
        id: realCourierProfile.id,
        name: realCourierProfile.name.trim(),
        vehicle: realCourierProfile.vehicle,
        status: state.userOrderAvailabilityStatus,
        has_order: state.userOrderAvailabilityStatus === 'OCUPADO_COM_PEDIDO',
        lat: realCourierProfile.lat,
        lng: realCourierProfile.lng,
        zone: realCourierProfile.zone,
        reputation: realCourierProfile.reputation || 100,
        buddy_since: realCourierProfile.buddy_since || 'Fundador • Out 2026',
        updated_at: realCourierProfile.updated_at,
        avatar_url: realCourierProfile.avatar_url,
        active_platforms: activePlatforms,
      };
      result.push(
        existingSelf
          ? {
              ...existingSelf,
              callsign: realCourierProfile.name.trim(),
              isSelfProfile: true,
              distanceKm: 0.0,
              vehicle: realCourierProfile.vehicle,
              zoneName: realCourierProfile.zone,
              cellId: mapZoneToAmaranteCellId(realCourierProfile.zone),
              orderStatus: state.userOrderAvailabilityStatus,
              avatarPhotoUrl:
                realCourierProfile.avatar_url || existingSelf.avatarPhotoUrl,
              activePlatforms,
              lat: realCourierProfile.lat,
              lng: realCourierProfile.lng,
              updatedAtIso: realCourierProfile.updated_at,
            }
          : buildFallbackDirectoryEntry(selfRow, true)
      );
      seen.add(realCourierProfile.id);
    }

    // 2. Append all other real couriers synced from Supabase public.couriers & Cloud Sync (active within last 2 hours)
    const nowMs = Date.now();
    const seenNames = new Set<string>();
    if (isSelfRegistered && realCourierProfile?.name) {
      seenNames.add(normalizeAccountKey(realCourierProfile.name));
    }
    const mergedLiveRows: SupabaseCourierRow[] = [
      ...getActiveCloudCourierRows(cloudSharedState),
      ...supabaseLiveCouriers,
    ];

    mergedLiveRows.forEach((row) => {
      if (!row || seen.has(row.id) || !row.name || !row.name.trim()) return;
      const nameKey = normalizeAccountKey(row.name);
      if (!nameKey || seenNames.has(nameKey)) return;
      const updatedMs = row.updated_at ? Date.parse(row.updated_at) : 0;
      if (
        updatedMs > 0 &&
        Number.isFinite(updatedMs) &&
        nowMs - updatedMs > 2 * 60 * 60 * 1000
      ) {
        return;
      }
      if (
        isGhostDuplicateOfSelf(
          row.id,
          row.name,
          realCourierProfile?.id || '',
          realCourierProfile?.name || ''
        )
      ) {
        return;
      }
      const existing = state.onlineDirectoryCouriers.find(
        (c) => c.id === row.id
      );
      const distKm = calculateHaversineDistanceKm(
        myLat,
        myLng,
        row.lat || AMARANTE_DEFAULT_COORDS.lat,
        row.lng || AMARANTE_DEFAULT_COORDS.lng
      );
      result.push(
        existing
          ? {
              ...existing,
              callsign: row.name,
              isSelfProfile: false,
              distanceKm: distKm,
              vehicle: normalizeCourierVehicle(row.vehicle),
              zoneName: row.zone,
              cellId: mapZoneToAmaranteCellId(row.zone),
              orderStatus:
                row.has_order ||
                row.status === 'Ocupado' ||
                row.status === 'OCUPADO_COM_PEDIDO'
                  ? 'OCUPADO_COM_PEDIDO'
                  : 'DISPONIVEL',
              avatarPhotoUrl: row.avatar_url || existing.avatarPhotoUrl,
              activePlatforms:
                row.active_platforms && row.active_platforms.length > 0
                  ? row.active_platforms
                  : existing.activePlatforms || ['Uber Eats', 'Glovo'],
              lat: row.lat,
              lng: row.lng,
              updatedAtIso: row.updated_at,
            }
          : buildFallbackDirectoryEntry(row, false)
      );
      seen.add(row.id);
      seenNames.add(nameKey);
    });

    // 3. Append remaining directory couriers (filtering out mocks & non-remote stale entries when in Production Mode)
    if (!isProdMode) {
      state.onlineDirectoryCouriers.forEach((c) => {
        if (seen.has(c.id)) return;
        result.push({ ...c, isSelfProfile: false });
        seen.add(c.id);
      });
    }

    return result;
  }, [
    isProdMode,
    state.onlineDirectoryCouriers,
    state.userOrderAvailabilityStatus,
    realCourierProfile,
    supabaseLiveCouriers,
    cloudSharedState,
    mapZoneToAmaranteCellId,
    realCompletedDeliveries.length,
    activePlatforms,
    isGhostDuplicateOfSelf,
  ]);

  const effectiveWalkieMessages = useMemo(() => {
    if (!isProdMode) return state.walkieMessages;
    return state.walkieMessages.filter(
      (m) =>
        m.senderId === 'SELF-COURIER' ||
        (!m.id.startsWith('MSG-0') &&
          !m.id.startsWith('MSG-ZONE-') &&
          !m.id.startsWith('MSG-SPLIT-') &&
          !m.senderId.startsWith('PEER-') &&
          !MOCK_COURIER_NAMES.some((n) => m.senderName.includes(n)))
    );
  }, [isProdMode, state.walkieMessages, MOCK_COURIER_NAMES]);

  const effectiveSocialBuddyPosts = useMemo(() => {
    if (!isProdMode) return state.socialBuddyPosts;
    return state.socialBuddyPosts.filter(
      (p) =>
        p.authorId === 'SELF-COURIER' ||
        (!p.id.startsWith('POST-0') &&
          !MOCK_COURIER_NAMES.includes(p.authorCallsign))
    );
  }, [isProdMode, state.socialBuddyPosts, MOCK_COURIER_NAMES]);

  const effectivePersonalGoals = useMemo<PersonalGoalsState>(() => {
    if (!isProdMode) return state.personalGoals;
    const sumNet = Number(
      realCompletedDeliveries
        .reduce((acc, d) => acc + d.netProfitEur, 0)
        .toFixed(2)
    );
    const sumKm = Number(
      realCompletedDeliveries.reduce((acc, d) => acc + d.realKm, 0).toFixed(1)
    );
    const countDel = realCompletedDeliveries.length;
    return {
      ...state.personalGoals,
      currentDailyNetEarnedEur: sumNet,
      currentWeeklyNetEarnedEur: sumNet,
      currentMonthlyNetEarnedEur: sumNet,
      completedDeliveriesToday: countDel,
      completedKmToday: sumKm,
      completedKmWeek: sumKm,
      completedKmMonth: sumKm,
      hoursWorkedToday: Number((countDel * 0.3).toFixed(2)),
    };
  }, [isProdMode, state.personalGoals, realCompletedDeliveries]);

  const effectivePlatformLedgers = useMemo<PlatformLedgersMap>(() => {
    if (!isProdMode) return state.platformLedgers;
    const buildZeroedLedger = (
      plat: PlatformName
    ): PlatformFinancialLedger => {
      const base = state.platformLedgers[plat];
      const platDelivs = realCompletedDeliveries.filter(
        (d) => d.platform === plat
      );
      const gross = Number(
        platDelivs.reduce((acc, d) => acc + d.grossEur, 0).toFixed(2)
      );
      const net = Number(
        platDelivs.reduce((acc, d) => acc + d.netProfitEur, 0).toFixed(2)
      );
      const km = Number(
        platDelivs.reduce((acc, d) => acc + d.realKm, 0).toFixed(1)
      );
      const count = platDelivs.length;
      return {
        ...base,
        dailyGrossEur: gross,
        weeklyGrossEur: gross,
        monthlyGrossEur: gross,
        tipsAndBonusesEur: 0,
        completedDeliveriesToday: count,
        completedKmToday: km,
        completedKmWeek: km,
        completedKmMonth: km,
        hoursWorkedToday: Number((count * 0.3).toFixed(2)),
        dailyNetEarnedEur: net,
        weeklyNetEarnedEur: net,
        monthlyNetEarnedEur: net,
      };
    };
    return {
      'Uber Eats': buildZeroedLedger('Uber Eats'),
      Glovo: buildZeroedLedger('Glovo'),
      'Bolt Food': buildZeroedLedger('Bolt Food'),
    };
  }, [isProdMode, state.platformLedgers, realCompletedDeliveries]);

  const effectiveGlovoWallet = useMemo<GlovoDailyWalletState>(() => {
    if (!isProdMode) return state.glovoWallet;
    const glovoDelivs = realCompletedDeliveries.filter(
      (d) => d.platform === 'Glovo'
    );
    const glovoGross = Number(
      glovoDelivs.reduce((acc, d) => acc + d.grossEur, 0).toFixed(2)
    );
    const initial = realGlovoWalletPatch.initialAppWalletEur ?? 0;
    const gross = realGlovoWalletPatch.dailyGrossGlovoEur ?? glovoGross;
    const cashHands = realGlovoWalletPatch.cashReceivedHandsEur ?? 0;
    const cashRest = realGlovoWalletPatch.cashPaidAtRestaurantsEur ?? 0;
    const transfer = realGlovoWalletPatch.nightlyTransferMadeEur ?? 0;
    const expected = Number(
      (initial + gross - cashHands + cashRest - transfer).toFixed(2)
    );
    return {
      initialAppWalletEur: initial,
      dailyGrossGlovoEur: gross,
      cashReceivedHandsEur: cashHands,
      cashPaidAtRestaurantsEur: cashRest,
      nightlyTransferMadeEur: transfer,
      nextMorningActualGlovoBalanceEur:
        realGlovoWalletPatch.nextMorningActualGlovoBalanceEur ?? expected,
      auditClosedToday: Boolean(realGlovoWalletPatch.auditClosedToday),
    };
  }, [
    isProdMode,
    state.glovoWallet,
    realCompletedDeliveries,
    realGlovoWalletPatch,
  ]);

  const effectiveBuddyRewards = useMemo<BuddyRewardsState>(() => {
    if (!isProdMode) return state.buddyRewards;
    const realActions = state.buddyRewards.actionHistory.filter(
      (a) => !a.id.startsWith('RWD-LOG-10')
    );
    const coinsFromActions = realActions.reduce(
      (acc, a) => acc + a.pointsAwarded,
      0
    );
    const xpFromActions = realActions.reduce((acc, a) => acc + a.xpAwarded, 0);
    const deliveryBonus = realCompletedDeliveries.length * 15;
    return {
      ...state.buddyRewards,
      buddyCoins: coinsFromActions + deliveryBonus,
      xpPoints: xpFromActions + deliveryBonus,
      actionHistory: realActions,
    };
  }, [isProdMode, state.buddyRewards, realCompletedDeliveries]);

  const effectiveShiftTrips = useMemo<ShiftTripLog[]>(() => {
    if (!isProdMode) return state.shiftTrips;
    return realCompletedDeliveries;
  }, [isProdMode, state.shiftTrips, realCompletedDeliveries]);

  const effectiveActiveDeliveryLifecycle =
    useMemo<ActiveDeliveryLifecycleState>(() => {
      if (!isProdMode || hasRealActiveDelivery) {
        return state.activeDeliveryLifecycle;
      }
      return {
        orderId: 'Sem registo',
        platform: 'Uber Eats',
        originName: 'Nenhuma entrega ativa',
        destinationName: 'A aguardar leitura de oferta real',
        grossEur: 0,
        netProfitEur: 0,
        realKm: 0,
        estimatedMinutes: 0,
        stage: 'CONCLUIDA',
        waitSecondsAtStore: 0,
        transitProgressPct: 0,
        customerDropoffNotes: 'Nenhuma entrega ativa no momento.',
        lastMacroExecuted: 'Modo Produção Real Ativo',
        lastVoiceTtsConfirmation: null,
      };
    }, [isProdMode, hasRealActiveDelivery, state.activeDeliveryLifecycle]);

  const effectiveAiAgentConfig = useMemo<AiAgentMasterConfig>(() => {
    if (!isProdMode) return state.aiAgentConfig;
    return {
      ...state.aiAgentConfig,
      dailyApiCallsUsed: realApiCallsCount,
    };
  }, [isProdMode, state.aiAgentConfig, realApiCallsCount]);

  const effectiveAiSkillLogs = useMemo<AiSkillLearningLogEntry[]>(() => {
    if (!isProdMode) return state.aiSkillLogs;

    const demoIdsRegex =
      /^AI-SKILL-(0[1-9]|UI-10[1-9]|RUA-20[1-9]|USR-30[1-9])$/;
    const demoCourierTags = new Set([
      'Tiago R. (Mota 125cc)',
      'Carlos M. (Scooter Elétrica)',
      'Inês V. (Scooter Elétrica)',
      'Rede Coletiva Amarante (14 Estafetas)',
      'Miguel P. & Tiago R.',
    ]);

    const realUserLogs = state.aiSkillLogs.filter(
      (l) =>
        !demoIdsRegex.test(l.id) &&
        !demoCourierTags.has(l.learnedFromCourierTag.trim())
    );

    // Synthesize real live device & telemetry skill entries from all real logged-in couriers
    const realLiveDeviceLogs: AiSkillLearningLogEntry[] = [];
    const seenCourierIds = new Set<string>();

    const addRealCourierSkillLog = (
      courierId: string,
      courierName: string,
      vehicle: string,
      zone: string,
      devModel: string,
      ratio: string,
      platforms?: PlatformName[],
      updatedAtIso?: string
    ) => {
      const cleanName = (courierName || '').trim();
      if (!cleanName || seenCourierIds.has(courierId)) return;
      seenCourierIds.add(courierId);

      const platLabel: AiSkillLearningLogEntry['platformOrApp'] =
        platforms && platforms.length === 1
          ? platforms[0]
          : 'Multi-Plataforma';
      const platListStr =
        platforms && platforms.length > 0
          ? platforms.join(' + ')
          : 'Uber Eats + Glovo';
      const timeLabel = updatedAtIso
        ? new Date(updatedAtIso).toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Online Agora';

      realLiveDeviceLogs.push({
        id: `REAL-DEVICE-SKILL-${courierId}`,
        timestamp: `Ativo • ${timeLabel}`,
        category: 'SKILLS_TOQUE_UI',
        platformOrApp: platLabel,
        skillTitle: `Telemetria & Calibração Real Ativa: ${cleanName} (${platListStr})`,
        actionSequenceSummary: `Dispositivo real sincronizado (${devModel}) • Proporção ${ratio} calibrada para leitura OCR, comandos de voz ("Olá Buddy") e GPS de alta precisão em ${zone || 'Amarante (35 km)'}.`,
        confidenceScorePct: 99.8,
        status: 'PUBLICADA_OTA',
        learnedFromCourierTag: `${cleanName} (${vehicle || 'Mota 125cc'})`,
        zoneContext: zone || 'Amarante Centro / São Gonçalo',
        deviceModel: devModel,
        screenAspectRatio: ratio,
        learningOrigin: 'PASSIVA_AUTOMATICA',
      });
    };

    if (
      realCourierProfile?.isRegistered &&
      realCourierProfile.name.trim().length > 0
    ) {
      addRealCourierSkillLog(
        realCourierProfile.id,
        realCourierProfile.name,
        realCourierProfile.vehicle,
        realCourierProfile.zone,
        realCourierProfile.device_model || deviceScreenProfile.deviceModel,
        realCourierProfile.screen_aspect_ratio ||
          deviceScreenProfile.screenAspectRatio,
        activePlatforms,
        realCourierProfile.updated_at
      );
    }

    supabaseLiveCouriers.forEach((row) => {
      if (!row.name || !row.name.trim()) return;
      const isSelf =
        realCourierProfile && row.id === realCourierProfile.id;
      addRealCourierSkillLog(
        row.id,
        row.name,
        row.vehicle || 'Mota 125cc',
        row.zone || 'Amarante Centro / São Gonçalo',
        row.device_model ||
          (isSelf
            ? deviceScreenProfile.deviceModel
            : `Android (${row.name}) • Tela 20:9`),
        row.screen_aspect_ratio ||
          (isSelf ? deviceScreenProfile.screenAspectRatio : '20:9'),
        row.active_platforms || activePlatforms,
        row.updated_at
      );
    });

    const combined = [...realUserLogs];
    realLiveDeviceLogs.forEach((entry) => {
      if (!combined.some((c) => c.id === entry.id)) {
        combined.push(entry);
      }
    });
    return combined;
  }, [
    isProdMode,
    state.aiSkillLogs,
    realCourierProfile,
    supabaseLiveCouriers,
    deviceScreenProfile.deviceModel,
    deviceScreenProfile.screenAspectRatio,
    activePlatforms,
  ]);

  const effectiveAdminManagedCouriers = useMemo<
    AdminManagedCourierRecord[]
  >(() => {
    const combinedRealRows: SupabaseCourierRow[] = [];
    if (realCourierProfile && realCourierProfile.name.trim().length > 0) {
      combinedRealRows.push({
        id: realCourierProfile.id,
        name: realCourierProfile.name,
        vehicle: realCourierProfile.vehicle,
        status: state.userOrderAvailabilityStatus,
        has_order: state.userOrderAvailabilityStatus === 'OCUPADO_COM_PEDIDO',
        lat: realCourierProfile.lat,
        lng: realCourierProfile.lng,
        zone: realCourierProfile.zone,
        reputation: realCourierProfile.reputation || 100,
        buddy_since: realCourierProfile.buddy_since || 'Fundador • Out 2026',
        updated_at: realCourierProfile.updated_at,
        avatar_url: realCourierProfile.avatar_url,
        active_platforms: activePlatforms,
      });
    }
    supabaseLiveCouriers.forEach((row) => {
      if (!row.name || !row.name.trim()) return;
      if (!combinedRealRows.some((r) => r.id === row.id)) {
        combinedRealRows.push(row);
      }
    });
    // Also merge all cloud approval requests so newly created or existing accounts on any phone appear immediately for Admin
    (cloudSharedState.approvalRequests || []).forEach((req) => {
      if (!req.username || !req.username.trim()) return;
      const alreadyExists = combinedRealRows.some(
        (r) =>
          r.id === req.id ||
          r.name.trim().toLowerCase() === req.username.trim().toLowerCase()
      );
      if (!alreadyExists) {
        combinedRealRows.push({
          id: req.id,
          name: req.username.trim(),
          vehicle: String(req.vehicle || 'Mota 125cc'),
          status:
            req.approvalStatus === 'pending'
              ? 'Pendente Aprovação'
              : req.approvalStatus === 'blocked'
                ? 'Bloqueado'
                : 'Disponível',
          has_order: false,
          lat: Number(req.lat ?? AMARANTE_DEFAULT_COORDS.lat),
          lng: Number(req.lng ?? AMARANTE_DEFAULT_COORDS.lng),
          zone: String(req.zone || 'Amarante Centro / São Gonçalo'),
          reputation: 100,
          buddy_since: 'Fundador • Out 2026',
          updated_at: req.updatedAt || req.createdAt || new Date().toISOString(),
          active_platforms:
            Array.isArray(req.platforms) && req.platforms.length > 0
              ? req.platforms
              : ['Uber Eats', 'Glovo'],
          device_model: req.deviceModel,
        });
      }
    });

    const realKycRecords: AdminManagedCourierRecord[] = combinedRealRows.map(
      (row) => {
        const isSelf = Boolean(
          realCourierProfile && row.id === realCourierProfile.id
        );
        const liveTimestamp = row.updated_at
          ? new Date(row.updated_at).toLocaleTimeString('pt-PT', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : 'Agora';
        const cloudReq = (cloudSharedState.approvalRequests || []).find(
          (req) =>
            req.id === row.id ||
            req.username.trim().toLowerCase() === row.name.trim().toLowerCase()
        );
        const cloudCourier = Object.values(cloudSharedState.couriers || {}).find(
          (c) =>
            c.id === row.id ||
            c.name.trim().toLowerCase() === row.name.trim().toLowerCase()
        );
        const isAdminRole = isCourierAdminByName(row.name);
        const effectiveCloudApproval = isAdminRole
          ? 'approved'
          : cloudReq?.approvalStatus || cloudCourier?.approvalStatus || 'pending';

        const statusOverride = realKycStatusOverrides[row.id];
        const derivedKycStatus: AdminCourierKycStatus =
          statusOverride ||
          (effectiveCloudApproval === 'approved'
            ? 'Ativo'
            : effectiveCloudApproval === 'blocked'
              ? 'Suspenso'
              : 'Pendente IA');

        const rowPlats: PlatformName[] = isSelf
          ? activePlatforms
          : row.active_platforms && row.active_platforms.length > 0
            ? row.active_platforms
            : cloudReq?.platforms && cloudReq.platforms.length > 0
              ? cloudReq.platforms
              : ['Uber Eats', 'Glovo'];
        return {
          id: row.id,
          fullName: isSelf ? `${row.name} (Tu)` : row.name,
          courierTag: `#${row.id.slice(0, 6).toUpperCase()}`,
          phone:
            cloudReq?.emailOrPhone ||
            (isSelf
              ? 'Perfil Local + Cloud Sync'
              : 'Sincronizado via Cloud Realtime'),
          cityZone: row.zone,
          platforms: rowPlats,
          reputationPct: row.reputation ?? 100,
          kycStatus: derivedKycStatus,
          aiMatchScorePct: 99,
          joinedAt: row.buddy_since || 'Fundador • Out 2026',
          lastActiveText: `Online às ${liveTimestamp}`,
          kycProofSummary: `Sincronizado via Cloud Realtime • GPS: ${Number(row.lat || 41.2704).toFixed(4)}, ${Number(row.lng || -8.0818).toFixed(4)} • Estado: ${derivedKycStatus === 'Pendente IA' ? '⏳ Aguarda Aprovação Admin' : row.has_order || row.status === 'Ocupado' || row.status === 'OCUPADO_COM_PEDIDO' ? 'Ocupado / Em Entrega' : 'Disponível'}${row.device_model || cloudReq?.deviceModel ? ` • Dispositivo: ${row.device_model || cloudReq?.deviceModel}` : isSelf ? ` • Dispositivo: ${deviceScreenProfile.deviceModel} (${deviceScreenProfile.screenAspectRatio})` : ''}`,
          vehicle: row.vehicle,
          activeAmaranteZone: row.zone,
          updatedAtIso: row.updated_at,
          isSelfRegistered: isSelf,
        };
      }
    );

    const seenIds = new Set(realKycRecords.map((r) => r.id));
    const baseCouriers = isProdMode
      ? state.adminManagedCouriers.filter((c) => !c.id.startsWith('USR-PT-10'))
      : state.adminManagedCouriers;

    return [
      ...realKycRecords,
      ...baseCouriers.filter((c) => !seenIds.has(c.id)),
    ];
  }, [
    isProdMode,
    state.adminManagedCouriers,
    state.userOrderAvailabilityStatus,
    realCourierProfile,
    supabaseLiveCouriers,
    cloudSharedState,
    realKycStatusOverrides,
    deviceScreenProfile.deviceModel,
    deviceScreenProfile.screenAspectRatio,
    activePlatforms,
  ]);

  const effectiveEvidentiaryVaultRecords = useMemo<
    EvidentiaryVaultRecord[]
  >(() => {
    if (!isProdMode) return state.evidentiaryVaultRecords;
    return state.evidentiaryVaultRecords.filter((r) =>
      /^EVID-\d+$/.test(r.id)
    );
  }, [isProdMode, state.evidentiaryVaultRecords]);

  const effectiveZonePacts = useMemo<ZonePactRule[]>(() => {
    if (!isProdMode) return state.zonePacts;
    return state.zonePacts.filter(
      (p) =>
        !['PACT-ZONA-CENTRO-01', 'PACT-PORTO-BOAVISTA-02'].includes(p.id)
    );
  }, [isProdMode, state.zonePacts]);

  const effectiveRoadHazards = useMemo<RoadHazardPin[]>(() => {
    if (!isProdMode) return state.roadHazards;
    return state.roadHazards.filter((h) => !h.id.startsWith('HAZ-AMR-'));
  }, [isProdMode, state.roadHazards]);

  const effectiveLocationRouteNotes = useMemo<LocationRouteNote[]>(() => {
    if (!isProdMode) return state.locationRouteNotes;
    return state.locationRouteNotes.filter((n) => !n.id.startsWith('NOTE-0'));
  }, [isProdMode, state.locationRouteNotes]);

  const effectiveComplaints = useMemo<ComplaintRecord[]>(() => {
    if (!isProdMode) return state.complaints;
    return state.complaints.filter(
      (c) =>
        ![
          'CMP-101',
          'CMP-102',
          'CMP-103',
          'CMP-104',
          'CMP-105',
          'CMP-106',
        ].includes(c.id)
    );
  }, [isProdMode, state.complaints]);

  return (
    <EstafetasContext.Provider
      value={{
        activeTab,
        setActiveTab,
        vehicleProfile: state.vehicleProfile,
        updateVehicleProfile,
        totalCostPerKm,
        complaints: effectiveComplaints,
        routeTrapComplaints: isProdMode
          ? effectiveComplaints.filter(
              (c) => c.category === 'ROTA_ILEGAL_DESVIO'
            )
          : routeTrapComplaints,
        criticalRestaurantComplaints: isProdMode
          ? effectiveComplaints.filter(
              (c) => c.category === 'RESTAURANTE_CRITICO'
            )
          : criticalRestaurantComplaints,
        activeComplaintCategory,
        setActiveComplaintCategory,
        addComplaintRecord,
        confirmComplaintRecord,
        generateDisputeEvidenceText,
        activeScannedOffer,
        setActiveScannedOffer,
        selectOfferPreset,
        ttsVoiceEnabled: state.ttsVoiceEnabled,
        toggleTtsVoice,
        speakTextPt,
        cancelSpeechNow,
        isSpeakingTts,
        lastSpokenTranscript,
        preFilledRouteTrapDraft,
        setPreFilledRouteTrapDraft,
        openRouteTrapModalFromOffer,
        shiftTrips: effectiveShiftTrips,
        recordOfferDecision,
        resetAllToSeed,
        backpackWeightLimitKg: state.backpackWeightLimitKg,
        setBackpackWeightLimitKg,
        auditedOrderItems: state.auditedOrderItems,
        updateAuditedItemQuantity,
        setAuditedOrderItemsPreset,
        totalAuditedWeightKg,
        generateOverweightDisputeProofAndLog,
        simulateSecondCourierPaired: state.simulateSecondCourierPaired,
        toggleSimulateSecondCourier,
        cargoSplitChecklist: state.cargoSplitChecklist,
        toggleCargoChecklistItem,
        optInMapAndZoneChat: state.optInMapAndZoneChat,
        toggleOptInMapAndZoneChat,
        activeWalkieChannel,
        setActiveWalkieChannel,
        walkieMessages: effectiveWalkieMessages,
        mutedSenderIds: state.mutedSenderIds,
        userTrustScore: state.userTrustScore,
        lastSentTimestampMs,
        sendWalkieMessage,
        flagOrMuteWalkieMessage,
        activeSosBeacon: state.activeSosBeacon,
        triggerSosEmergencyBeacon,
        appendSosTranscriptLine,
        endSosAndSaveProof,
        savedSosProofs: state.savedSosProofs,
        clearSosEmergencyBeacon,
        shareExactLocationWithCourier,
        userPrefs: state.userPrefs,
        updateUserPreferences,
        toggleAnonymousMode,
        heartbeatSecondsLeft,
        forceSyncHeartbeatNow,
        tacticalCells: activeRegionalDataset.cells,
        roadHazards: effectiveRoadHazards,
        addRoadHazardPin,
        confirmRoadHazardPin,
        resolveRoadHazardPin,
        evaluateOfferAgainstPreferences,
        isAuthenticated: state.isAuthenticated,
        verifiedAccount: state.verifiedAccount,
        loginWithDemoAccount,
        loginWithCredentials,
        completeAiMultiAppRegistration,
        logoutSession,
        isAppPaused: state.isAppPaused,
        toggleAppPauseMode,
        personalBlacklist: isProdMode ? [] : state.personalBlacklist,
        addEstablishmentToBlacklist,
        removeEstablishmentFromBlacklist,
        isEstablishmentBlacklisted,
        activeFinanceSubTab,
        setActiveFinanceSubTab,
        glovoWallet: effectiveGlovoWallet,
        updateGlovoWallet,
        closeGlovoDailyAudit,
        taxAndFleetConfig: state.taxAndFleetConfig,
        updateTaxAndFleetConfig,
        toggleRookieInvoiceItem,
        personalGoals: effectivePersonalGoals,
        updatePersonalGoals,
        recordCompletedDeliveryForGoal,
        lastGoalMilestoneBanner,
        clearGoalMilestoneBanner,
        buddyRewards: effectiveBuddyRewards,
        awardBuddyRewardTask,
        claimMarketplaceReward,
        // Step 7 values
        isBubbleMinimized: state.isBubbleMinimized,
        setIsBubbleMinimized,
        isQuickSummaryOpen,
        setIsQuickSummaryOpen,
        activeBubbleAnimation,
        triggerBubbleMilestoneAnimation,
        dismissBubbleAnimation,
        zonePacts: effectiveZonePacts,
        activeJoinedZonePact: isProdMode
          ? effectiveZonePacts.find((p) => p.joinedByUser) || null
          : activeJoinedZonePact,
        toggleJoinZonePact,
        createZonePact,
        communityReputationPct: state.communityReputationPct,
        safetyTelemetry: state.safetyTelemetry,
        updateSafetyTelemetry,
        simulateSpeedAlert,
        simulatePhoneMisuseInMotion,
        clearSafetyAlerts,
        b2bPartners: state.b2bPartners,
        allMarketplaceRewards,
        registerB2BPartnerSponsorship,
        executeVoiceCommandPt,
        lastVoiceCommandResult,
        // Step 8 values
        viewMode,
        setViewMode,
        activeScannerSubTab,
        setActiveScannerSubTab,
        mapRadiusKm: state.mapRadiusKm,
        setMapRadiusKm,
        selectedRegionName: state.selectedRegionName,
        setSelectedRegionName,
        activeRegionalDataset,
        regionalExplorerList: SEED_REGIONAL_EXPLORER_DATA,
        adminManagedCouriers: effectiveAdminManagedCouriers,
        updateAdminCourierKycStatus,
        adminBroadcasts: state.adminBroadcasts,
        mandatoryTermsEnforcementEnabled:
          state.mandatoryTermsEnforcementEnabled,
        toggleMandatoryTermsEnforcement,
        courierPromotionalOptIn: state.courierPromotionalOptIn,
        toggleCourierPromotionalOptIn,
        sendAdminBroadcast,
        markAdminBroadcastRead,
        adminSponsoredCampaigns: state.adminSponsoredCampaigns,
        createAdminSponsoredCampaign,
        toggleAdminSponsoredCampaignActive,
        recordSponsoredCampaignClick,
        hasSeenWelcomeTour: state.hasSeenWelcomeTour,
        isWelcomeTourOpen,
        openWelcomeTour,
        closeWelcomeTour,
        isContextualHelpOpen,
        setIsContextualHelpOpen,
        // Step 9 values
        userOrderAvailabilityStatus: state.userOrderAvailabilityStatus,
        setUserOrderAvailabilityStatus,
        toggleUserOrderAvailabilityStatus,
        shareOrderStatusPublicly: state.shareOrderStatusPublicly,
        toggleShareOrderStatusPublicly,
        onlineDirectoryCouriers: effectiveOnlineDirectoryCouriers,
        incomingContactRequest: isProdMode
          ? null
          : state.incomingContactRequest,
        requestCourierContactPermission,
        simulateCourierAcceptContactPermission,
        respondToIncomingContactRequest,
        activeDirectChatCourierId,
        setActiveDirectChatCourierId,
        sendDirectCourierMessage,
        mapCourierFilterMode: state.mapCourierFilterMode,
        setMapCourierFilterMode,
        // Step 10 values
        activeDeliveryLifecycle: effectiveActiveDeliveryLifecycle,
        startActiveDeliveryFromOffer,
        startDeliveryTransitStage,
        completeActiveDeliveryStage,
        isListeningSpeechRecognition,
        startSpeechRecognitionPt,
        // Step 11 values
        resolvedPtBrVoiceName,
        activeSupportSplitMacro,
        triggerSupportSplitOrderMacro,
        touchCoordinatesMap: state.touchCoordinatesMap,
        updateTouchCoordinatePoint,
        resetTouchCoordinatesToDefault,
        // Step 12 values
        courierWorkspaceSection,
        setCourierWorkspaceSection,
        isOfferAccepted,
        setIsOfferAccepted,
        ephemeralVoiceOverlay,
        dismissEphemeralVoiceOverlay,
        sosPendingConfirmation,
        requestOrConfirmSosActivation,
        cancelSosPendingConfirmation,
        locationRouteNotes: effectiveLocationRouteNotes,
        addLocationRouteNote,
        confirmLocationRouteNote,
        socialBuddyPosts: effectiveSocialBuddyPosts,
        addSocialBuddyPost,
        toggleLikeSocialBuddyPost,
        // Step 13 values
        themeMode: state.themeMode,
        setThemeMode,
        toggleThemeMode,
        alertPopupPrefs: state.alertPopupPrefs,
        updateAlertPopupPrefs,
        voiceActivationConfig: state.voiceActivationConfig,
        updateVoiceActivationConfig,
        isPttActive,
        startPttHold,
        releasePttHold,
        customAutoMessages: state.customAutoMessages,
        addCustomAutoMessage,
        updateCustomAutoMessage,
        deleteCustomAutoMessage,
        // Step 14 values
        evidentiaryVaultRecords: effectiveEvidentiaryVaultRecords,
        addEvidentiaryVaultRecord,
        confirmEvidentiaryVaultRecord,
        generateFormalEvidentiaryReportText,
        platformLedgers: effectivePlatformLedgers,
        activePlatformScope: state.activePlatformScope,
        setActivePlatformScope,
        updatePlatformLedger,
        // Step 15 values
        floatingBubblesSide: state.floatingBubblesSide,
        setFloatingBubblesSide,
        activeBuddyPopupCourierId,
        setActiveBuddyPopupCourierId,
        buddyPopupSizeMode,
        setBuddyPopupSizeMode,
        minimizedBuddyBubbleCourierId: state.minimizedBuddyBubbleCourierId,
        setMinimizedBuddyBubbleCourierId,
        minimizeBuddyPopupToAvatarBubble,
        sendBuddyVoiceChatRequest,
        inviteBuddyToClosedGroup,
        createBuddyChallenge,
        lastExternalMapAssist,
        triggerExternalMapAssistMacro,
        // Step 16 values
        liveVoiceTranscription,
        startLiveVoiceDictation,
        startLiveVoiceCommandSession,
        updateLiveVoiceTranscriptText,
        setLiveVoiceEditing,
        clearLiveVoiceTranscriptText,
        confirmSendLiveDictatedMessage,
        cancelLiveVoiceTranscription,
        // Step 17 values
        aiAgentConfig: effectiveAiAgentConfig,
        updateAiAgentConfig,
        testGeminiFlashConnection,
        testGeminiStudioConnection,
        saveAndConnectSupabaseRealtime,
        toggleProductionModeRealOnly,
        aiSkillLogs: effectiveAiSkillLogs,
        approveAndPublishAiSkillLog,
        discardAiSkillLog,
        testAiSkillLogMacro,
        simulateNewAiSkillLearning,
        realCompletedDeliveries,
        realApiCallsCount,
        hasRealActiveDelivery,
        // Step 18 values
        deviceScreenProfile,
        updateDeviceScreenProfile,
        redetectDeviceScreenProfile,
        activeSkillTeachingSession,
        startVoiceTeachSkillMode,
        addTapStepToSkillTeachingSession,
        completeAndSaveVoiceTaughtSkill,
        cancelVoiceTeachSkillMode,
        marketTelemetry,
        recordMarketTelemetrySnapshot,
        // Step 19 & 20 values
        realCourierProfile,
        isCourierRegistrationModalOpen,
        setIsCourierRegistrationModalOpen,
        saveAndRegisterRealCourierProfile,
        switchOrCreateNewCourierProfileOnDevice,
        cleanupGhostDuplicatePinsNow,
        refreshLiveGpsPosition,
        supabaseLiveCouriers,
        activePlatforms,
        setActivePlatforms,
        toggleActivePlatform,
        updateCourierAvatarUrl,
        wakeLockEnabled,
        wakeLockActiveOnDevice,
        toggleWakeLock,
        isOfficialManualModalOpen,
        setIsOfficialManualModalOpen,
        buddyVoiceRate,
        setBuddyVoiceRate,
        isAppInstalledStandalone,
        canPromptNativeInstall,
        triggerNativeAppInstallPrompt,
        showManualInstallGuideModal,
        setShowManualInstallGuideModal,
        resetRealDeliveriesAndTestData,
        addManualDeliveryRecord,
        rainLockActive,
        setRainLockActive,
        toggleRainLock,
        crashDetectionEnabled,
        toggleCrashDetection,
        crashCountdownSeconds,
        triggerSimulatedCrashTest,
        cancelCrashCountdown,
        batterySurvivalMode,
        toggleBatterySurvivalMode,
        batteryLevelPct,
        isBatteryCharging,
        unpluggedChargerAlertActive,
        dismissUnpluggedChargerAlert,
        simulateChargerUnpluggedAlert,
        lastHeardLiveTranscript,
        lastHeardSpokenText,
        lastExecutedVoiceActionText,
        toggleVoiceMicListening,
        startContinuousVoiceMic,
        stopContinuousVoiceMic,
        autoOfferDetectorEnabled,
        lastAutoDetectedOfferBanner,
        dismissAutoDetectedOfferBanner,
        openAndroidAccessibilitySettings,
        triggerAutoDetectedOffer,
        scannerActiveMainView,
        setScannerActiveMainView,
        isAmaranteWeatherModalOpen,
        setIsAmaranteWeatherModalOpen,
        amaranteLiveWeather,
        isLoadingAmaranteWeather,
        rainBonusFinanceActive,
        toggleRainBonusFinanceActive,
        openAndFetchAmaranteWeather,
        buddyMascotImages,
        currentMascotState,
        currentMascotImageUrl,
        uploadThreePoseMascotSheet,
        uploadThreePoseMascotSheetFromDataUrl,
        applyCustomMascotImagesSet,
        mascotSyncId,
        resetMascotImagesToBuiltin,
        bubbleRestingPreset,
        setBubbleRestingPreset,
        isTranslatorModalOpen,
        setIsTranslatorModalOpen,
        translatorActiveTab,
        setTranslatorActiveTab,
        translatorTargetLang,
        setTranslatorTargetLang,
        openTranslatorModal,
      }}
    >
      {children}
    </EstafetasContext.Provider>
  );
};

export function useEstafetas(): EstafetasContextValue {
  const ctx = useContext(EstafetasContext);
  if (!ctx) {
    throw new Error('useEstafetas deve ser usado dentro de EstafetasProvider');
  }
  return ctx;
}

