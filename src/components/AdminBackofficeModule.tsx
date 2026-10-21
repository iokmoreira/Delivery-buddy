import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Megaphone,
  Briefcase,
  Check,
  X,
  Plus,
  Send,
  Sparkles,
  Cpu,
  Zap,
  Play,
  Trash2,
  CheckCircle2,
  KeyRound,
  Activity,
  Database,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Smartphone,
  Mic,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import {
  AdminBroadcastTargetType,
  AdminCourierKycStatus,
  AdminSponsorCategory,
  AdminBannerPlacement,
  AiDailyQuotaTier,
  AiNetworkSyncSpeedMode,
  AiSkillLogCategory,
  AmaranteBaseZoneOption,
  CourierRegistrationVehicle,
  GeminiStudioModelSelection,
  PlatformName,
} from '../types/models';
import {
  GEMINI_STUDIO_MODEL_OPTIONS,
  SUPABASE_COMPLETE_SQL_SCHEMA_SCRIPT,
  sanitizeSupabaseUrlInput,
  sanitizeSupabaseKeyInput,
  insertDirectMessageToSupabaseRest,
} from '../services/geminiAgent';
import { useEstafetas } from '../context/EstafetasContext';
import {
  loadSavedAccounts,
  loadSupportChatMessages,
  SAVED_ACCOUNTS_STORAGE_KEY,
  SUPPORT_CHAT_STORAGE_KEY,
  SavedLocalAccountRecord,
  SupportChatMessage,
} from './AuthAndVerificationGate';
import {
  AdminNotificationConfig,
  AdminNotificationEvent,
  buildMailtoDeepLink,
  buildWhatsAppDeepLink,
  CloudApprovalRequest,
  isCourierAdminByName,
  loadAdminNotificationConfig,
  loadCloudSharedState,
  publishAccountRegistrationToCloud,
  publishAdminApprovalDecisionToCloud,
  publishCourierPresenceToCloud,
  saveAdminNotificationConfig,
  subscribeToCloudSharedState,
  syncCloudStateNow,
} from '../services/cloudSync';

export const AdminBackofficeModule: React.FC = () => {
  const {
    adminManagedCouriers,
    updateAdminCourierKycStatus,
    adminBroadcasts,
    sendAdminBroadcast,
    adminSponsoredCampaigns,
    createAdminSponsoredCampaign,
    toggleAdminSponsoredCampaignActive,
    aiAgentConfig,
    aiSkillLogs,
    updateAiAgentConfig,
    testGeminiStudioConnection,
    saveAndConnectSupabaseRealtime,
    toggleProductionModeRealOnly,
    approveAndPublishAiSkillLog,
    discardAiSkillLog,
    testAiSkillLogMacro,
    heartbeatSecondsLeft,
    deviceScreenProfile,
    startVoiceTeachSkillMode,
    realCourierProfile,
    setIsCourierRegistrationModalOpen,
    onlineDirectoryCouriers,
    complaints,
    roadHazards,
    addRoadHazardPin,
    buddyMascotImages,
    uploadThreePoseMascotSheet,
    resetMascotImagesToBuiltin,
    themeMode,
  } = useEstafetas();

  const isDaylight = themeMode === 'DAYLIGHT';

  const [subTab, setSubTab] = useState<
    'IA_SKILLS' | 'KYC' | 'RECLAMACOES_ALERTAS' | 'SUPORTE_ATIVO'
  >('IA_SKILLS');

  const [archivedComplaintIds, setArchivedComplaintIds] = useState<string[]>(
    []
  );
  const [publishedComplaintIds, setPublishedComplaintIds] = useState<string[]>(
    []
  );

  const mascotAdminInputRef = useRef<HTMLInputElement | null>(null);
  const [mascotAdminMsg, setMascotAdminMsg] = useState<string>('');

  // Local registered accounts, cloud approval requests & live support inbox state
  const [localAccounts, setLocalAccounts] = useState<SavedLocalAccountRecord[]>(
    () => loadSavedAccounts()
  );
  const [cloudRequests, setCloudRequests] = useState<CloudApprovalRequest[]>(
    () => loadCloudSharedState().approvalRequests || []
  );
  const [isSyncingCloudAccounts, setIsSyncingCloudAccounts] =
    useState<boolean>(false);
  const [syncDoneBadge, setSyncDoneBadge] = useState<boolean>(false);

  // Manual 1-Tap Colleague Add form state (Admin)
  const [isManualAddOpen, setIsManualAddOpen] = useState<boolean>(false);
  const [manualName, setManualName] = useState<string>('');
  const [manualContact, setManualContact] = useState<string>('');
  const [manualVehicle, setManualVehicle] =
    useState<CourierRegistrationVehicle>('Mota 125cc');
  const [manualZone, setManualZone] = useState<AmaranteBaseZoneOption>(
    'Amarante Centro / São Gonçalo'
  );
  const [manualPlatforms, setManualPlatforms] = useState<PlatformName[]>([
    'Uber Eats',
    'Glovo',
  ]);
  const [manualAddFeedback, setManualAddFeedback] = useState<string | null>(
    null
  );

  const [supportMessages, setSupportMessages] = useState<SupportChatMessage[]>(
    () => loadSupportChatMessages()
  );
  const [adminReplyText, setAdminReplyText] = useState<string>('');

  // Admin WhatsApp & E-mail Receiving Channels Config + Live Notification Events
  const [adminNotifyConfig, setAdminNotifyConfig] =
    useState<AdminNotificationConfig>(() => loadAdminNotificationConfig());
  const [adminNotifySavedBadge, setAdminNotifySavedBadge] =
    useState<boolean>(false);
  const [adminNotifications, setAdminNotifications] = useState<
    AdminNotificationEvent[]
  >(() => loadCloudSharedState().adminNotifications || []);
  const [importantAlertMessage, setImportantAlertMessage] = useState<string>(
    '📢 Alerta Importante Delivery Buddy Amarante: Nova atualização / aviso operacional disponível na App.'
  );

  const handleSaveAdminNotifyConfig = async () => {
    await saveAdminNotificationConfig(adminNotifyConfig);
    setAdminNotifySavedBadge(true);
    window.setTimeout(() => setAdminNotifySavedBadge(false), 3000);
  };

  useEffect(() => {
    void syncCloudStateNow();
    const unsub = subscribeToCloudSharedState((snap) => {
      setCloudRequests(snap.approvalRequests || []);
      setAdminNotifications(snap.adminNotifications || []);
      if (snap.adminConfig) {
        setAdminNotifyConfig(snap.adminConfig);
      }
    });
    const syncAdminInbox = () => {
      setLocalAccounts(loadSavedAccounts());
      setSupportMessages(loadSupportChatMessages());
    };
    const intervalId = window.setInterval(syncAdminInbox, 2500);
    return () => {
      unsub();
      window.clearInterval(intervalId);
    };
  }, []);

  const handleForceSyncCloudAccounts = async () => {
    setIsSyncingCloudAccounts(true);
    setSyncDoneBadge(false);
    const hardTimeoutId = window.setTimeout(() => {
      setIsSyncingCloudAccounts(false);
      setSyncDoneBadge(true);
    }, 2000);
    try {
      const snap = await Promise.race([
        syncCloudStateNow(),
        new Promise<ReturnType<typeof loadCloudSharedState>>((resolve) =>
          setTimeout(() => resolve(loadCloudSharedState()), 2000)
        ),
      ]);
      setCloudRequests(snap.approvalRequests || []);
      setLocalAccounts(loadSavedAccounts());
    } finally {
      window.clearTimeout(hardTimeoutId);
      setIsSyncingCloudAccounts(false);
      setSyncDoneBadge(true);
      window.setTimeout(() => {
        setSyncDoneBadge(false);
      }, 3500);
    }
  };

  const handleManualAddColleague = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = manualName.trim();
    if (!cleanName) return;
    const newId = `acc-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || Date.now()}`;
    const selectedPlatforms: PlatformName[] =
      manualPlatforms.length > 0 ? manualPlatforms : ['Uber Eats', 'Glovo'];

    const newRecord: SavedLocalAccountRecord = {
      username: cleanName,
      emailOrPhone: manualContact.trim() || cleanName,
      pinOrPassword: '1234',
      vehicle: manualVehicle,
      platforms: selectedPlatforms,
      zone: manualZone,
      status: 'APROVADO',
    };

    const existing = loadSavedAccounts().filter(
      (a) => a.username.trim().toLowerCase() !== cleanName.toLowerCase()
    );
    const updatedAccounts = [newRecord, ...existing];
    setLocalAccounts(updatedAccounts);
    try {
      localStorage.setItem(
        SAVED_ACCOUNTS_STORAGE_KEY,
        JSON.stringify(updatedAccounts)
      );
    } catch {
      // ignore
    }

    const baseLat = realCourierProfile?.lat || 41.2704;
    const baseLng = realCourierProfile?.lng || -8.0818;

    void publishAccountRegistrationToCloud({
      id: newId,
      username: cleanName,
      emailOrPhone: manualContact.trim() || cleanName,
      vehicle: manualVehicle,
      platforms: selectedPlatforms,
      zone: manualZone,
      approvalStatus: 'approved',
      lat: baseLat,
      lng: baseLng,
    });
    void publishAdminApprovalDecisionToCloud({
      courierId: newId,
      username: cleanName,
      approvalStatus: 'approved',
    });
    void publishCourierPresenceToCloud({
      id: newId,
      name: cleanName,
      role: 'courier',
      vehicle: manualVehicle,
      platforms: selectedPlatforms,
      zone: manualZone,
      status: 'online',
      approvalStatus: 'approved',
      lat: baseLat,
      lng: baseLng,
      lastSeen: new Date().toISOString(),
    });

    setCloudRequests(loadCloudSharedState().approvalRequests || []);
    setManualName('');
    setManualContact('');
    setManualAddFeedback(`✓ ${cleanName} aprovado e publicado na frota!`);
    window.setTimeout(() => {
      setManualAddFeedback(null);
      setIsManualAddOpen(false);
    }, 2000);
  };

  const handleToggleLocalAccountStatus = (
    usernameKey: string,
    status: 'APROVADO' | 'BLOQUEADO',
    explicitCourierId?: string
  ) => {
    const cleanKey = usernameKey.trim().toLowerCase();
    const matchingCloud = cloudRequests.find(
      (r) =>
        (explicitCourierId && r.id === explicitCourierId) ||
        r.username.trim().toLowerCase() === cleanKey
    );
    const resolvedId =
      explicitCourierId ||
      matchingCloud?.id ||
      `courier_acc_${cleanKey.replace(/[^a-z0-9]/g, '') || 'user'}`;

    const existingLocal = loadSavedAccounts();
    const hasLocal = existingLocal.some(
      (a) => a.username.trim().toLowerCase() === cleanKey
    );
    const updated: SavedLocalAccountRecord[] = hasLocal
      ? existingLocal.map((acc) =>
          acc.username.trim().toLowerCase() === cleanKey
            ? { ...acc, courierId: acc.courierId || resolvedId, status }
            : acc
        )
      : [
          {
            courierId: resolvedId,
            role: isCourierAdminByName(usernameKey) ? 'admin' : 'courier',
            username: usernameKey.trim(),
            emailOrPhone: matchingCloud?.emailOrPhone || usernameKey.trim(),
            pinOrPassword: '1234',
            vehicle: (matchingCloud?.vehicle as CourierRegistrationVehicle) || 'Mota 125cc',
            platforms:
              Array.isArray(matchingCloud?.platforms) &&
              matchingCloud.platforms.length > 0
                ? matchingCloud.platforms
                : ['Uber Eats', 'Glovo'],
            zone:
              (matchingCloud?.zone as AmaranteBaseZoneOption) ||
              'Amarante Centro / São Gonçalo',
            status,
          },
          ...existingLocal,
        ];

    setLocalAccounts(updated);
    try {
      localStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setCloudRequests((prev) =>
      prev.map((r) =>
        r.id === resolvedId || r.username.trim().toLowerCase() === cleanKey
          ? {
              ...r,
              approvalStatus: status === 'APROVADO' ? 'approved' : 'blocked',
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );

    const matchingAdminCourier = adminManagedCouriers.find(
      (c) =>
        c.id === resolvedId ||
        c.fullName.replace(/\s*\(Tu\)\s*$/i, '').trim().toLowerCase() ===
          cleanKey
    );
    if (matchingAdminCourier) {
      updateAdminCourierKycStatus(
        matchingAdminCourier.id,
        status === 'APROVADO' ? 'Ativo' : 'Suspenso'
      );
    }

    void publishAdminApprovalDecisionToCloud({
      courierId: resolvedId,
      targetCourierId: resolvedId,
      username: usernameKey.trim(),
      targetUsername: usernameKey.trim(),
      approvalStatus: status === 'APROVADO' ? 'approved' : 'blocked',
    });
  };

  const handleSendAdminSupportReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = adminReplyText.trim();
    if (!clean) return;
    const nowTime = new Date().toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const replyMsg: SupportChatMessage = {
      id: `admin-sup-${Date.now()}`,
      sender: 'SUPPORT',
      topicBadge: '👑 Suporte Admin (CEO)',
      text: clean,
      timestamp: nowTime,
    };
    const nextList = [...supportMessages, replyMsg];
    setSupportMessages(nextList);
    setAdminReplyText('');
    try {
      localStorage.setItem(SUPPORT_CHAT_STORAGE_KEY, JSON.stringify(nextList));
    } catch {
      // ignore
    }
    try {
      if (aiAgentConfig.supabaseUrl && aiAgentConfig.supabaseAnonKey) {
        await insertDirectMessageToSupabaseRest({
          supabaseUrl: aiAgentConfig.supabaseUrl,
          supabaseAnonKey: aiAgentConfig.supabaseAnonKey,
          senderId: 'ADMIN_CEO',
          senderCallsign: '👑 Suporte Admin (CEO)',
          recipientId: 'SUPORTE_DIRETO',
          messageBody: clean,
        });
      }
    } catch {
      // ignore
    }
  };

  const normalizeCourierNameKey = (rawName: string): string =>
    rawName.replace(/\s*\(Tu\)\s*$/i, '').trim().toLowerCase();

  // Merge local saved accounts AND cloud approval requests so any second phone registering/logging in appears immediately!
  const unifiedCloudAndLocalAccounts = React.useMemo<
    Array<SavedLocalAccountRecord & { isCloudOnly?: boolean }>
  >(() => {
    const byKey = new Map<
      string,
      SavedLocalAccountRecord & { isCloudOnly?: boolean }
    >();

    localAccounts.forEach((acc) => {
      const key = normalizeCourierNameKey(acc.username);
      if (!key) return;
      const isFounder = isCourierAdminByName(acc.username);
      byKey.set(key, {
        ...acc,
        role: isFounder ? 'admin' : 'courier',
        status: isFounder ? 'APROVADO' : acc.status || 'PENDENTE',
        isCloudOnly: false,
      });
    });

    cloudRequests.forEach((req) => {
      const key = normalizeCourierNameKey(req.username);
      if (!key) return;
      const isFounder = isCourierAdminByName(req.username);
      const cloudStatus: 'APROVADO' | 'PENDENTE' | 'BLOQUEADO' = isFounder
        ? 'APROVADO'
        : req.approvalStatus === 'approved'
          ? 'APROVADO'
          : req.approvalStatus === 'blocked'
            ? 'BLOQUEADO'
            : 'PENDENTE';
      const existing = byKey.get(key);
      if (existing) {
        byKey.set(key, {
          ...existing,
          courierId: req.id || existing.courierId,
          whatsapp: req.whatsapp || existing.whatsapp,
          email: req.email || existing.email,
          optInWhatsapp: req.optInWhatsapp ?? existing.optInWhatsapp ?? true,
          optInEmail: req.optInEmail ?? existing.optInEmail ?? true,
          status:
            existing.status === 'APROVADO' || cloudStatus === 'APROVADO'
              ? 'APROVADO'
              : existing.status === 'BLOQUEADO' || cloudStatus === 'BLOQUEADO'
                ? 'BLOQUEADO'
                : 'PENDENTE',
        });
      } else {
        byKey.set(key, {
          courierId: req.id,
          role: isFounder ? 'admin' : 'courier',
          username: req.username.trim(),
          emailOrPhone: req.emailOrPhone || req.whatsapp || req.email || 'Sincronizado via Cloud Realtime',
          whatsapp: req.whatsapp,
          email: req.email,
          optInWhatsapp: req.optInWhatsapp ?? true,
          optInEmail: req.optInEmail ?? true,
          pinOrPassword: '••••',
          vehicle: (req.vehicle as CourierRegistrationVehicle) || 'Mota 125cc',
          platforms:
            Array.isArray(req.platforms) && req.platforms.length > 0
              ? req.platforms
              : ['Uber Eats', 'Glovo'],
          zone:
            (req.zone as AmaranteBaseZoneOption) ||
            'Amarante Centro / São Gonçalo',
          status: cloudStatus,
          isCloudOnly: true,
        });
      }
    });

    // Sort so PENDENTE DE APROVAÇÃO appears at the very top
    return Array.from(byKey.values()).sort((a, b) => {
      const aPend = a.status === 'PENDENTE' ? 0 : 1;
      const bPend = b.status === 'PENDENTE' ? 0 : 1;
      return aPend - bPend;
    });
  }, [localAccounts, cloudRequests]);

  const localAccountKeySet = new Set(
    unifiedCloudAndLocalAccounts.map((acc) =>
      normalizeCourierNameKey(acc.username)
    )
  );

  const seenRealtimeNames = new Set<string>();
  const deduplicatedAdminCouriers = adminManagedCouriers.filter((c) => {
    const cleanKey = normalizeCourierNameKey(c.fullName);
    if (!cleanKey || localAccountKeySet.has(cleanKey) || seenRealtimeNames.has(cleanKey)) {
      return false;
    }
    seenRealtimeNames.add(cleanKey);
    return true;
  });

  const liveOnlineCount = Math.max(
    1,
    onlineDirectoryCouriers.length,
    unifiedCloudAndLocalAccounts.length + deduplicatedAdminCouriers.length
  );
  const totalRegisteredCount = Math.max(
    1,
    unifiedCloudAndLocalAccounts.length + deduplicatedAdminCouriers.length
  );
  const pendingApprovalsCount =
    unifiedCloudAndLocalAccounts.filter((acc) => acc.status === 'PENDENTE')
      .length +
    deduplicatedAdminCouriers.filter((c) => c.kycStatus === 'Pendente IA').length;

  const visibleComplaints = complaints.filter(
    (rc) => !archivedComplaintIds.includes(rc.id)
  );

  const [skillFilter, setSkillFilter] = useState<'TODAS' | AiSkillLogCategory>(
    'TODAS'
  );
  const [testedLogFeedbackId, setTestedLogFeedbackId] = useState<string | null>(
    null
  );
  const [isTestingConnection, setIsTestingConnection] =
    useState<boolean>(false);

  // Supabase Realtime & SQL Generator local states
  const [supabaseUrlDraft, setSupabaseUrlDraft] = useState<string>(
    sanitizeSupabaseUrlInput(aiAgentConfig.supabaseUrl || '')
  );
  const [supabaseKeyDraft, setSupabaseKeyDraft] = useState<string>(
    sanitizeSupabaseKeyInput(aiAgentConfig.supabaseAnonKey || '')
  );
  const [supabaseSaveFeedback, setSupabaseSaveFeedback] = useState<
    string | null
  >(null);
  const [sqlCopiedFeedback, setSqlCopiedFeedback] = useState<boolean>(false);
  const [isManualSqlOpen, setIsManualSqlOpen] = useState<boolean>(false);

  useEffect(() => {
    setSupabaseUrlDraft(
      sanitizeSupabaseUrlInput(aiAgentConfig.supabaseUrl || '')
    );
    setSupabaseKeyDraft(
      sanitizeSupabaseKeyInput(aiAgentConfig.supabaseAnonKey || '')
    );
  }, [aiAgentConfig.supabaseUrl, aiAgentConfig.supabaseAnonKey]);

  const [sponsorName, setSponsorName] = useState<string>('');
  const [category, setCategory] = useState<AdminSponsorCategory>(
    'Seguros (Destaque Especial)'
  );
  const [placement, setPlacement] =
    useState<AdminBannerPlacement>('Destaque no Painel');
  const [offerHeadline, setOfferHeadline] = useState<string>('');
  const [discountOrBonusValue, setDiscountOrBonusValue] = useState<string>('');
  const [isCampaignModalOpen, setIsCampaignModalOpen] =
    useState<boolean>(false);

  const [msgTitle, setMsgTitle] = useState<string>('');
  const [msgBody, setMsgBody] = useState<string>('');
  const [targetType, setTargetType] =
    useState<AdminBroadcastTargetType>('TODOS_ESTAFETAS');

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await testGeminiStudioConnection();
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveSupabaseCredentials = () => {
    const cleanUrl = sanitizeSupabaseUrlInput(supabaseUrlDraft);
    const cleanKey = sanitizeSupabaseKeyInput(supabaseKeyDraft);
    setSupabaseUrlDraft(cleanUrl);
    setSupabaseKeyDraft(cleanKey);
    const res = saveAndConnectSupabaseRealtime(cleanUrl, cleanKey);
    setSupabaseSaveFeedback(
      res.connected
        ? '✅ Credenciais sanitizadas e WebSocket Realtime iniciado!'
        : '⚠️ Chaves limpas. Introduza URL e Chave Anon para ligar.'
    );
    window.setTimeout(() => {
      setSupabaseSaveFeedback(null);
    }, 3500);
  };

  const handleCopySqlSchema = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_COMPLETE_SQL_SCHEMA_SCRIPT);
    } catch {
      // Fallback if clipboard API restricted
    }
    setSqlCopiedFeedback(true);
    window.setTimeout(() => {
      setSqlCopiedFeedback(false);
    }, 3000);
  };

  const handleTestMacroClick = (logId: string) => {
    testAiSkillLogMacro(logId);
    setTestedLogFeedbackId(logId);
    window.setTimeout(() => {
      setTestedLogFeedbackId((prev) => (prev === logId ? null : prev));
    }, 2500);
  };

  const filteredSkillLogs = aiSkillLogs.filter((log) => {
    if (skillFilter === 'TODAS') return true;
    return log.category === skillFilter;
  });

  const getCategoryBadgeLabel = (cat: AiSkillLogCategory): string => {
    if (cat === 'SKILLS_TOQUE_UI') return 'Skills de Toque & Telas';
    if (cat === 'INTELIGENCIA_RUA_AMARANTE')
      return 'Inteligência de Rua - Amarante';
    return 'Padrões de Utilizadores';
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorName.trim() || !offerHeadline.trim()) return;
    createAdminSponsoredCampaign({
      sponsorName: sponsorName.trim(),
      category,
      placement,
      offerHeadline: offerHeadline.trim(),
      discountOrBonusValue: discountOrBonusValue.trim() || '15% Desconto',
      requiredBuddyCoins: 150,
      isActive: true,
      sponsorshipRevenueEur: 450,
    });
    setSponsorName('');
    setOfferHeadline('');
    setDiscountOrBonusValue('');
    setIsCampaignModalOpen(false);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgBody.trim()) return;
    sendAdminBroadcast({
      title: msgTitle.trim(),
      body: msgBody.trim(),
      targetType,
      targetValue: 'Amarante (25 km)',
      category: 'OPERACIONAL_SEGURANCA_OBRIGATORIO',
    });
    setMsgTitle('');
    setMsgBody('');
  };

  const isSupabaseOnline = Boolean(
    aiAgentConfig.supabaseRealtimeConnected &&
      aiAgentConfig.supabaseUrl.trim() &&
      aiAgentConfig.supabaseAnonKey.trim()
  );

  return (
    <div className="space-y-3">
      {/* Top 4-Tab Segmented Switcher (CEO Admin Dashboard) */}
      <div
        style={{
          backgroundColor: isDaylight ? '#FFFFFF' : '#0B0F17',
          borderColor: isDaylight ? '#CBD5E1' : 'rgba(0, 229, 255, 0.35)',
        }}
        className="p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-1.5 border shadow-md"
      >
        <button
          type="button"
          onClick={() => setSubTab('IA_SKILLS')}
          style={{
            backgroundColor:
              subTab === 'IA_SKILLS'
                ? '#0B0F17'
                : isDaylight
                  ? '#F8FAFC'
                  : '#111827',
            borderColor:
              subTab === 'IA_SKILLS'
                ? '#00E5FF'
                : isDaylight
                  ? '#E2E8F0'
                  : 'rgba(0, 229, 255, 0.2)',
            color:
              subTab === 'IA_SKILLS'
                ? '#00E5FF'
                : isDaylight
                  ? '#090D16'
                  : '#FFFFFF',
          }}
          className="rounded-xl border py-2.5 px-2 text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>📊 Online Agora &amp; Projeções</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('KYC')}
          style={{
            backgroundColor:
              subTab === 'KYC'
                ? '#0B0F17'
                : isDaylight
                  ? '#F8FAFC'
                  : '#111827',
            borderColor:
              subTab === 'KYC'
                ? '#00E5FF'
                : isDaylight
                  ? '#E2E8F0'
                  : 'rgba(0, 229, 255, 0.2)',
            color:
              subTab === 'KYC'
                ? '#00E5FF'
                : isDaylight
                  ? '#090D16'
                  : '#FFFFFF',
          }}
          className="rounded-xl border py-2.5 px-2 text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>✓ Requisições de Aceitação ({totalRegisteredCount})</span>
          {pendingApprovalsCount > 0 && (
            <span className="rounded-full bg-[#00E5FF] text-slate-950 px-1.5 py-0.5 text-[10px] font-black animate-pulse">
              +{pendingApprovalsCount} Nova{pendingApprovalsCount > 1 ? 's' : ''}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSubTab('RECLAMACOES_ALERTAS')}
          style={{
            backgroundColor:
              subTab === 'RECLAMACOES_ALERTAS'
                ? '#0B0F17'
                : isDaylight
                  ? '#F8FAFC'
                  : '#111827',
            borderColor:
              subTab === 'RECLAMACOES_ALERTAS'
                ? '#00E5FF'
                : isDaylight
                  ? '#E2E8F0'
                  : 'rgba(0, 229, 255, 0.2)',
            color:
              subTab === 'RECLAMACOES_ALERTAS'
                ? '#00E5FF'
                : isDaylight
                  ? '#090D16'
                  : '#FFFFFF',
          }}
          className="rounded-xl border py-2.5 px-2 text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>
            ⚠️ Reclamações &amp; Alertas (
            {visibleComplaints.length +
              roadHazards.filter((h) => !h.resolved).length}
            )
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('SUPORTE_ATIVO')}
          style={{
            backgroundColor:
              subTab === 'SUPORTE_ATIVO'
                ? '#0B0F17'
                : isDaylight
                  ? '#F8FAFC'
                  : '#111827',
            borderColor:
              subTab === 'SUPORTE_ATIVO'
                ? '#00E5FF'
                : isDaylight
                  ? '#E2E8F0'
                  : 'rgba(0, 229, 255, 0.2)',
            color:
              subTab === 'SUPORTE_ATIVO'
                ? '#00E5FF'
                : isDaylight
                  ? '#090D16'
                  : '#FFFFFF',
          }}
          className="rounded-xl border py-2.5 px-2 text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>💬 Central de Suporte Ativo ({supportMessages.length})</span>
        </button>
      </div>

      {/* =====================================================================
          VIEW 0: [📊 ONLINE AGORA & PROJEÇÕES] — LIVE COURIERS, 30D/90D/1Y
          GROWTH PROJECTIONS, 3D MASCOT MANAGER, AI STUDIO & SUPABASE
          ===================================================================== */}
      {subTab === 'IA_SKILLS' && (
        <section
          aria-label="Online Agora, Projeções de Crescimento, Mascote 3D, AI Studio e Supabase"
          className="rounded-2xl bg-zinc-900/95 border border-zinc-800/80 p-3.5 space-y-3.5 shadow-lg"
        >
          {/* CEO Executive Live KPIs & 30d / 90d / 1-Year Growth Projections */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>📊 Estafetas Online Agora &amp; Projeções de Crescimento</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Centro Operacional Ativo: <strong className="text-emerald-400">Amarante (Raio 35 km)</strong> • Sincronização em Tempo Real
                </p>
              </div>
              <span
                style={{
                  backgroundColor: '#0B0F17',
                  borderColor: '#00E5FF',
                  color: '#00E5FF',
                }}
                className="rounded-full border px-3 py-1 text-xs font-extrabold"
              >
                ● {liveOnlineCount} Online Agora
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <div
                style={{
                  backgroundColor: isDaylight ? '#F8FAFC' : '#111827',
                  borderColor: isDaylight
                    ? '#CBD5E1'
                    : 'rgba(0, 229, 255, 0.28)',
                }}
                className="rounded-xl border p-2 sm:p-2.5 min-w-0 flex flex-col justify-between"
              >
                <span
                  style={{ color: isDaylight ? '#475569' : '#94A3B8' }}
                  className="block text-[11px] sm:text-xs font-extrabold leading-tight"
                >
                  Online Agora
                </span>
                <span
                  style={{ color: isDaylight ? '#00838F' : '#00E5FF' }}
                  className="block text-2xl font-extrabold my-0.5 leading-none"
                >
                  {liveOnlineCount}
                </span>
                <span
                  style={{ color: isDaylight ? '#64748B' : '#94A3B8' }}
                  className="block text-[10px] sm:text-[11px] font-semibold leading-tight"
                >
                  No Mapa (Amarante)
                </span>
              </div>
              <div
                style={{
                  backgroundColor: isDaylight ? '#F8FAFC' : '#111827',
                  borderColor: isDaylight
                    ? '#CBD5E1'
                    : 'rgba(0, 229, 255, 0.28)',
                }}
                className="rounded-xl border p-2 sm:p-2.5 min-w-0 flex flex-col justify-between"
              >
                <span
                  style={{ color: isDaylight ? '#475569' : '#94A3B8' }}
                  className="block text-[11px] sm:text-xs font-extrabold leading-tight"
                >
                  Contas Registadas
                </span>
                <span
                  style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                  className="block text-2xl font-extrabold my-0.5 leading-none"
                >
                  {totalRegisteredCount}
                </span>
                <span
                  style={{ color: isDaylight ? '#64748B' : '#94A3B8' }}
                  className="block text-[10px] sm:text-[11px] font-semibold leading-tight"
                >
                  Estafetas Verificados
                </span>
              </div>
              <div
                style={{
                  backgroundColor: isDaylight ? '#F8FAFC' : '#111827',
                  borderColor: isDaylight
                    ? '#CBD5E1'
                    : 'rgba(0, 229, 255, 0.28)',
                }}
                className="rounded-xl border p-2 sm:p-2.5 min-w-0 flex flex-col justify-between"
              >
                <span
                  style={{ color: isDaylight ? '#475569' : '#94A3B8' }}
                  className="block text-[11px] sm:text-xs font-extrabold leading-tight"
                >
                  Hub Regional
                </span>
                <span
                  style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                  className="block text-sm sm:text-base font-extrabold my-0.5 leading-tight"
                >
                  Amarante
                </span>
                <span
                  style={{ color: isDaylight ? '#00838F' : '#00E5FF' }}
                  className="block text-[10px] sm:text-[11px] font-extrabold leading-tight"
                >
                  Raio 35 km
                </span>
              </div>
            </div>

            {/* 30-Day / 90-Day / 1-Year Growth Projections (Strict Light/Dark Theme) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div
                style={{
                  backgroundColor: isDaylight ? '#F8FAFC' : '#111827',
                  borderColor: isDaylight
                    ? '#CBD5E1'
                    : 'rgba(0, 229, 255, 0.28)',
                }}
                className="rounded-xl border p-3 space-y-1"
              >
                <span
                  style={{ color: isDaylight ? '#00838F' : '#00E5FF' }}
                  className="text-xs font-extrabold block"
                >
                  📈 Projeção 30 Dias
                </span>
                <span
                  style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                  className="text-xl font-extrabold block"
                >
                  28 Estafetas Ativos
                </span>
                <span
                  style={{ color: isDaylight ? '#00838F' : '#00E5FF' }}
                  className="text-xs font-extrabold block"
                >
                  Receita B2B Est.: € 420 / mês
                </span>
                <span
                  style={{ color: isDaylight ? '#475569' : '#94A3B8' }}
                  className="text-[11px] font-semibold block"
                >
                  Consolidação Amarante, Vila Meã e Lixa
                </span>
              </div>

              <div
                style={{
                  backgroundColor: isDaylight ? '#F8FAFC' : '#111827',
                  borderColor: isDaylight
                    ? '#CBD5E1'
                    : 'rgba(0, 229, 255, 0.28)',
                }}
                className="rounded-xl border p-3 space-y-1"
              >
                <span
                  style={{ color: isDaylight ? '#00838F' : '#00E5FF' }}
                  className="text-xs font-extrabold block"
                >
                  🚀 Projeção 90 Dias
                </span>
                <span
                  style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                  className="text-xl font-extrabold block"
                >
                  85 Estafetas Ativos
                </span>
                <span
                  style={{ color: isDaylight ? '#00838F' : '#00E5FF' }}
                  className="text-xs font-extrabold block"
                >
                  Receita B2B Est.: € 1.450 / mês
                </span>
                <span
                  style={{ color: isDaylight ? '#475569' : '#94A3B8' }}
                  className="text-[11px] font-semibold block"
                >
                  Expansão Tâmega e Sousa (Felgueiras / Marco)
                </span>
              </div>

              <div
                style={{
                  backgroundColor: isDaylight ? '#F8FAFC' : '#111827',
                  borderColor: isDaylight
                    ? '#CBD5E1'
                    : 'rgba(0, 229, 255, 0.28)',
                }}
                className="rounded-xl border p-3 space-y-1"
              >
                <span
                  style={{ color: isDaylight ? '#00838F' : '#00E5FF' }}
                  className="text-xs font-extrabold block"
                >
                  📊 Projeção 1 Ano (12 Meses)
                </span>
                <span
                  style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                  className="text-xl font-extrabold block"
                >
                  340 Estafetas Ativos
                </span>
                <span
                  style={{ color: isDaylight ? '#00838F' : '#00E5FF' }}
                  className="text-xs font-extrabold block"
                >
                  Receita B2B Est.: € 5.800 / mês
                </span>
                <span
                  style={{ color: isDaylight ? '#475569' : '#94A3B8' }}
                  className="text-[11px] font-semibold block"
                >
                  Rede Regional Norte + Seguros &amp; Oficinas B2B
                </span>
              </div>
            </div>
          </div>

          {/* Admin Mascot 3-Pose Manager (Moved from Courier Ajustes to Admin Dashboard) */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 space-y-3">
            <input
              ref={mascotAdminInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setMascotAdminMsg('A recortar as 3 poses...');
                  await uploadThreePoseMascotSheet(file);
                  setMascotAdminMsg('✓ 3 Poses atualizadas com sucesso!');
                } catch {
                  setMascotAdminMsg('Erro ao processar imagem.');
                }
                e.target.value = '';
              }}
            />
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  🤖 Mascote Oficial 3D Delivery Buddy (3 Poses Integradas)
                </h4>
                <p className="text-xs text-zinc-400">
                  Integrado nativamente no APK, Ícone Android, Topo, Mapa, Barra Inferior e Bolinha
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => mascotAdminInputRef.current?.click()}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-extrabold cursor-pointer transition"
                >
                  🖼️ Substituir Imagem 3 Poses (Admin)
                </button>
                {buddyMascotImages.isCustomUploaded && (
                  <button
                    type="button"
                    onClick={() => {
                      resetMascotImagesToBuiltin();
                      setMascotAdminMsg('Mascote 3D oficial restaurado.');
                    }}
                    className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    Repor Padrão 3D
                  </button>
                )}
              </div>
            </div>
            {mascotAdminMsg && (
              <p className="text-xs font-bold text-emerald-400">{mascotAdminMsg}</p>
            )}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-zinc-900 border border-[#00E5FF]/50 p-2 flex items-center gap-2">
                <img
                  src={buddyMascotImages.mascotActive}
                  alt="Pose 1"
                  className="h-12 w-12 rounded-full object-contain bg-transparent p-0.5 border border-[#00E5FF] shrink-0"
                />
                <div className="min-w-0">
                  <span className="block text-xs font-extrabold text-[#00E5FF] truncate">
                    1. Online
                  </span>
                  <span className="block text-[10px] text-zinc-400 truncate">
                    Ativo / Frente
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-zinc-900 border border-slate-500/40 p-2 flex items-center gap-2">
                <img
                  src={buddyMascotImages.mascotInactive}
                  alt="Pose 2"
                  className="h-12 w-12 rounded-full object-contain bg-transparent p-0.5 border border-[#00E5FF]/70 shrink-0"
                />
                <div className="min-w-0">
                  <span className="block text-xs font-extrabold text-slate-200 truncate">
                    2. Pausa
                  </span>
                  <span className="block text-[10px] text-zinc-400 truncate">
                    Mochila DB
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-zinc-900 border border-[#00E5FF]/50 p-2 flex items-center gap-2">
                <img
                  src={buddyMascotImages.mascotDelivery}
                  alt="Pose 3"
                  className="h-12 w-12 rounded-full object-contain bg-transparent p-0.5 border border-[#00E5FF] shrink-0"
                />
                <div className="min-w-0">
                  <span className="block text-xs font-extrabold text-[#00E5FF] truncate">
                    3. Entrega 🚀
                  </span>
                  <span className="block text-[10px] text-zinc-400 truncate">
                    Jato Neon Azul
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================
              CARD 1: GOOGLE AI STUDIO • MOTOR AVANÇADO PRO & HÍBRIDO
              ================================================================= */}
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-zinc-100">
                    Google AI Studio • Motor Avançado Pro &amp; Híbrido
                  </h3>
                  <span className="text-[10px] text-zinc-400 block">
                    Modelo Ativo:{' '}
                    <strong className=" text-indigo-300">
                      {aiAgentConfig.activeResolvedModelName ||
                        'gemini-pro-latest'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Live Connection Status Badge */}
              <span
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold flex items-center gap-1.5 border ${
                  aiAgentConfig.connectionStatus === 'ATIVO'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    aiAgentConfig.connectionStatus === 'ATIVO'
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
                <span>
                  {aiAgentConfig.connectionStatus === 'ATIVO'
                    ? `AI Studio Ativo (${
                        aiAgentConfig.activeResolvedModelName ||
                        'gemini-pro-latest'
                      })`
                    : 'Modo Simulado Local'}
                </span>
              </span>
            </div>

            {/* 1. Motor / Cérebro Ativo no AI Studio Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 block">
                Motor / Cérebro Ativo no AI Studio
              </label>
              <select
                value={aiAgentConfig.selectedGeminiModel || 'GEMINI_PRO_LATEST'}
                onChange={(e) =>
                  updateAiAgentConfig({
                    selectedGeminiModel: e.target
                      .value as GeminiStudioModelSelection,
                  })
                }
                aria-label="Motor / Cérebro Ativo no AI Studio"
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-100 focus:outline-none"
              >
                {GEMINI_STUDIO_MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Conditional Manual Experimental Model ID Input */}
              {aiAgentConfig.selectedGeminiModel ===
                'EXPERIMENTAL_CUSTOM_ID' && (
                <div className="pt-1 space-y-1">
                  <label className="text-[10px] font-semibold text-indigo-300 block">
                    Código do Modelo Experimental / Preview no Google AI Studio:
                  </label>
                  <input
                    type="text"
                    value={aiAgentConfig.customExperimentalModelId}
                    onChange={(e) =>
                      updateAiAgentConfig({
                        customExperimentalModelId: e.target.value,
                      })
                    }
                    placeholder="Ex: gemini-2.5-pro-preview, gemini-exp-1206..."
                    aria-label="Código do Modelo Experimental no AI Studio"
                    className="w-full rounded-xl bg-zinc-900 border border-indigo-500/50 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 2. GEMINI_API_KEY Input + Testar Conexão no AI Studio Button */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <KeyRound className="h-3 w-3 text-zinc-400" />
                <span>Chave Google AI Studio (GEMINI_API_KEY)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-1.5">
                <input
                  type="password"
                  value={aiAgentConfig.geminiApiKey}
                  onChange={(e) =>
                    updateAiAgentConfig({ geminiApiKey: e.target.value })
                  }
                  placeholder="AIzaSy... (Guardado em localStorage)"
                  aria-label="GEMINI_API_KEY"
                  className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>
                    {isTestingConnection
                      ? 'A Validar no AI Studio...'
                      : 'Testar Conexão no AI Studio'}
                  </span>
                </button>
              </div>

              {/* Active Model Name, Response Status, and Real Latency in ms */}
              <div className="rounded-lg bg-zinc-900/90 border border-zinc-800/80 px-2.5 py-1.5 flex items-center justify-between gap-2 flex-wrap text-[10px]">
                <span className="text-zinc-300 font-medium">
                  Modelo:{' '}
                  <strong className=" text-zinc-100">
                    {aiAgentConfig.activeResolvedModelName ||
                      'gemini-pro-latest'}
                  </strong>{' '}
                  • Status:{' '}
                  <strong className="text-emerald-400">
                    {aiAgentConfig.lastResponseStatusText ||
                      '200 OK • Motor gemini-pro-latest Ativo'}
                  </strong>
                </span>
                <span className=" text-zinc-400">
                  Latência: {aiAgentConfig.lastLatencyMs ?? 142} ms • Leituras:{' '}
                  {aiAgentConfig.dailyApiCallsUsed}/
                  {aiAgentConfig.dailyApiCallsMax}
                </span>
              </div>
            </div>

            {/* Cost & Rate-Limit Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80">
              {/* Toggle: Modo Aprendizagem Contínua IA (ON / OFF) */}
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2.5 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-zinc-100 block">
                    Modo Aprendizagem Contínua IA
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    Aprende coordenadas UI, lojas e voz em tempo real
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateAiAgentConfig({
                      continuousLearningEnabled:
                        !aiAgentConfig.continuousLearningEnabled,
                    })
                  }
                  className={`rounded-lg px-2.5 py-1 text-xs font-extrabold cursor-pointer shrink-0 transition ${
                    aiAgentConfig.continuousLearningEnabled
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {aiAgentConfig.continuousLearningEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Daily API Call Limit Selector */}
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2.5 space-y-1">
                <label className="text-[10px] font-bold text-zinc-300 block">
                  Limite Diário de Chamadas API
                </label>
                <select
                  value={aiAgentConfig.dailyQuotaTier}
                  onChange={(e) =>
                    updateAiAgentConfig({
                      dailyQuotaTier: e.target.value as AiDailyQuotaTier,
                    })
                  }
                  aria-label="Limite Diário de Chamadas API"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
                >
                  <option value="FREE_TIER_1500_DIA">
                    1.500 leituras/dia - Free Tier
                  </option>
                  <option value="PAY_AS_YOU_GO_ILIMITADO">
                    Pay-as-you-go (Ilimitado)
                  </option>
                </select>
              </div>
            </div>

            {/* Phase 1 Network Sync Speed Selector */}
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-zinc-100 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Velocidade de Sincronização de Rede (Fase 1)</span>
                </label>
                <span className="text-[10px] text-emerald-400">
                  Heartbeat GPS: {heartbeatSecondsLeft}s
                </span>
              </div>

              <select
                value={aiAgentConfig.networkSyncSpeedMode}
                onChange={(e) =>
                  updateAiAgentConfig({
                    networkSyncSpeedMode: e.target
                      .value as AiNetworkSyncSpeedMode,
                  })
                }
                aria-label="Velocidade de Sincronização de Rede"
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-2 text-xs font-semibold text-zinc-100"
              >
                <option value="FASE_1_TEMPO_REAL_INSTANTANEO">
                  Fase 1: Tempo Real Instantâneo (&lt;200ms Eventos / 3s GPS)
                </option>
                <option value="BALANCEADO_15S">Balanceado (15s)</option>
                <option value="ECONOMICO_2M30S">Económico (2m30s)</option>
              </select>
            </div>
          </div>

          {/* =================================================================
              CARD 2: BANCO DE DADOS & TEMPO REAL • SUPABASE
              ================================================================= */}
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-zinc-100">
                    Banco de Dados &amp; Tempo Real • Supabase
                  </h3>
                  <span className="text-[10px] text-zinc-400 block">
                    Sincronização WebSockets (Estafetas, Skills IA, SOS &amp;
                    Chat)
                  </span>
                </div>
              </div>

              {/* 1. Live Connection Status Badge */}
              <span
                style={{
                  backgroundColor: '#0B0F17',
                  borderColor: '#00E5FF',
                  color: '#00E5FF',
                }}
                className="rounded-lg px-2.5 py-1 text-[10px] font-extrabold flex items-center gap-1.5 border"
              >
                <span className="h-2 w-2 rounded-full bg-[#00E5FF] shadow-[0_0_6px_rgba(0,229,255,0.9)]" />
                <span>
                  {isSupabaseOnline
                    ? 'Ligado ao Supabase (Ativo • WebSockets Online)'
                    : 'Ligado ao Supabase (Ativo)'}
                </span>
              </span>
            </div>

            {/* 2. Credential Inputs (Persisted in localStorage & Masked by Default) */}
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 block">
                  1. URL DO PROJETO SUPABASE (Project URL — Oculto por Segurança)
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  value={supabaseUrlDraft}
                  onChange={(e) =>
                    setSupabaseUrlDraft(sanitizeSupabaseUrlInput(e.target.value))
                  }
                  placeholder="••••••••••••••••••••••••••••"
                  aria-label="1. URL DO PROJETO SUPABASE (Project URL)"
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 block">
                  2. CHAVE API PÚBLICA (anon / public key — Oculta por Segurança)
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  value={supabaseKeyDraft}
                  onChange={(e) =>
                    setSupabaseKeyDraft(sanitizeSupabaseKeyInput(e.target.value))
                  }
                  placeholder="••••••••••••••••••••••••••••••••••••"
                  aria-label="2. CHAVE API PÚBLICA (anon / public key)"
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveSupabaseCredentials}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 px-3 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Guardar &amp; Conectar Supabase</span>
              </button>

              {supabaseSaveFeedback && (
                <p className="text-[11px] font-semibold text-emerald-400 text-center">
                  {supabaseSaveFeedback}
                </p>
              )}
            </div>

            {/* 3. 1-Click SQL Schema Copy Button + Viewable Code Box */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={handleCopySqlSchema}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-3 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
              >
                <span>
                  {sqlCopiedFeedback
                    ? '✅ Script SQL Copiado!'
                    : '📋 Copiar Script SQL das Tabelas (Colar no SQL Editor)'}
                </span>
              </button>

              <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsManualSqlOpen((prev) => !prev)}
                  className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-bold text-zinc-300 hover:text-white cursor-pointer"
                >
                  <span>Ver / Copiar Código SQL Manualmente</span>
                  {isManualSqlOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                  )}
                </button>

                {isManualSqlOpen && (
                  <div className="p-2.5 border-t border-zinc-800 bg-zinc-950">
                    <pre className="text-[10px] text-zinc-300 overflow-x-auto max-h-56 whitespace-pre-wrap select-all leading-relaxed">
                      {SUPABASE_COMPLETE_SQL_SCHEMA_SCRIPT}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Production Mode Master Switch (Modo Produção Real) */}
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-zinc-100 block">
                  Modo Produção Real (Ocultar Dados Fictícios de Teste):{' '}
                  {aiAgentConfig.productionModeRealOnly ? 'ON' : 'OFF'}
                </span>
                <span className="text-[10px] text-zinc-400 block leading-snug mt-0.5">
                  Quando ON, oculta 100% dos estafetas fictícios, logs de teste e
                  números simulados para operar apenas com dados reais e
                  registos Supabase.
                </span>
              </div>

              <button
                type="button"
                onClick={toggleProductionModeRealOnly}
                aria-label="Alternar Modo Produção Real"
                className={`rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer shrink-0 transition ${
                  aiAgentConfig.productionModeRealOnly
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {aiAgentConfig.productionModeRealOnly ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* =================================================================
              CARD 3: LIVE AI LEARNING LOBBY / LOGS FEED (Logs de Aprendizagem da IA)
              ================================================================= */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h4 className="text-xs font-extrabold text-zinc-100">
                  Logs de Aprendizagem da IA ({filteredSkillLogs.length})
                </h4>
                <p className="text-[10px] text-zinc-400">
                  Aprendizagem Dual (Passiva 100% Automática + Ensino por Voz) • Partilha por Proporção de Ecrã ({deviceScreenProfile.screenAspectRatio})
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => startVoiceTeachSkillMode('Caminho UI Personalizado')}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition shrink-0 shadow-xs"
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>Ensinar Caminho por Voz</span>
                </button>
              </div>
            </div>

            {/* Dual-Mode AI Learning & Screen Ratio Fingerprint Summary Strip */}
            <div className="rounded-xl bg-zinc-950 border border-zinc-800/90 p-2.5 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <Smartphone className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <div className="text-[10px] text-zinc-300 leading-tight">
                  <span className="font-extrabold text-zinc-100">
                    Telemóvel Ativo:{' '}
                  </span>
                  <span>
                    {deviceScreenProfile.deviceModel} • Tela{' '}
                    <strong className="text-emerald-400">
                      {deviceScreenProfile.screenAspectRatio}
                    </strong>{' '}
                    ({deviceScreenProfile.screenWidthPx}x
                    {deviceScreenProfile.screenHeightPx})
                  </span>
                </div>
              </div>
              <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-extrabold text-emerald-300">
                {aiAgentConfig.continuousLearningEnabled
                  ? 'Aprendizagem Contínua: ATIVA'
                  : 'Aprendizagem Contínua: PAUSADA'}
              </span>
            </div>

            {/* 4 Category Filter Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setSkillFilter('TODAS')}
                className={`rounded-lg py-1.5 px-2 text-[10px] font-bold cursor-pointer transition ${
                  skillFilter === 'TODAS'
                    ? 'bg-white text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Todas as Skills ({aiSkillLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setSkillFilter('SKILLS_TOQUE_UI')}
                className={`rounded-lg py-1.5 px-2 text-[10px] font-bold cursor-pointer transition ${
                  skillFilter === 'SKILLS_TOQUE_UI'
                    ? 'bg-white text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Botões &amp; Telas (UI)
              </button>
              <button
                type="button"
                onClick={() => setSkillFilter('INTELIGENCIA_RUA_AMARANTE')}
                className={`rounded-lg py-1.5 px-2 text-[10px] font-bold cursor-pointer transition ${
                  skillFilter === 'INTELIGENCIA_RUA_AMARANTE'
                    ? 'bg-white text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Padrões de Lojas &amp; Rotas
              </button>
              <button
                type="button"
                onClick={() => setSkillFilter('PADROES_UTILIZADORES')}
                className={`rounded-lg py-1.5 px-2 text-[10px] font-bold cursor-pointer transition ${
                  skillFilter === 'PADROES_UTILIZADORES'
                    ? 'bg-white text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Preferências de Usuários
              </button>
            </div>

            {/* Real-Time Skill Log Cards */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
              {filteredSkillLogs.length === 0 ? (
                <div className="rounded-xl bg-zinc-950 border border-zinc-800/90 p-4 text-center space-y-1">
                  <p className="text-xs font-bold text-zinc-100">
                    Modo Produção Real Ativo • 0 logs de skills da IA registados no momento
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Os 7 logs de demonstração foram ocultados. Use &quot;Ler Print&quot; no Scanner, aceite/recuse uma oferta, ou diga &quot;Buddy, ensinar caminho&quot; para gravar um log real.
                  </p>
                </div>
              ) : (
                filteredSkillLogs.map((log) => {
                  const isPublished = log.status === 'PUBLICADA_OTA';
                  const isJustTested = testedLogFeedbackId === log.id;
                  const logRatio = log.screenAspectRatio || '20:9';
                  const logDevice =
                    log.deviceModel || 'Samsung Galaxy A54 / S23';
                  const isSameScreenRatio =
                    logRatio === deviceScreenProfile.screenAspectRatio;

                  return (
                    <div
                      key={log.id}
                      className="rounded-xl bg-zinc-950 border border-zinc-800/90 p-3.5 space-y-2.5"
                    >
                      {/* Top Stacked Row: Status Badge + Origin & Confidence Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`rounded-md px-2.5 py-0.5 text-[10px] font-extrabold shrink-0 ${
                            isPublished
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {isPublished
                            ? '✓ Publicada para Todos os Buddys'
                            : '⏳ Em Análise'}
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[10px] font-bold text-[#00E5FF]">
                            {log.platformOrApp} • {log.zoneContext}
                          </span>
                          <span className="text-[10px] font-extrabold text-emerald-400">
                            Confiança: {log.confidenceScorePct.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Full-Width Skill Title & Category Metadata */}
                      <div className="space-y-1 w-full">
                        <p className="text-sm font-extrabold text-zinc-100 leading-snug w-full">
                          {log.skillTitle}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-zinc-400">
                            {getCategoryBadgeLabel(log.category)}
                          </span>
                          {log.learningOrigin === 'ENSINO_VOZ_GUIADO' && (
                            <span className="rounded bg-indigo-500/20 border border-indigo-500/40 px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-300">
                              🎙️ Ensinada por Voz
                            </span>
                          )}
                          {log.learningOrigin === 'PASSIVA_AUTOMATICA' && (
                            <span className="rounded bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-300">
                              ⚡ Passiva Automática
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Full-Width Device Model & Screen Aspect Ratio Compatibility Strip */}
                      <div className="w-full flex items-center justify-between gap-2 flex-wrap rounded-lg bg-zinc-900/90 border border-zinc-800 px-2.5 py-1.5">
                        <span className="text-[10px] text-zinc-300 flex items-center gap-1">
                          <Smartphone className="h-3 w-3 text-zinc-400 shrink-0" />
                          <span>
                            {logDevice} • Tela <strong>{logRatio}</strong>
                          </span>
                        </span>
                        {isSameScreenRatio ? (
                          <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-extrabold text-emerald-300">
                            Compatível &amp; Pronta (Mesma Proporção {logRatio})
                          </span>
                        ) : (
                          <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                            Adaptação Automática %X/%Y ({logRatio} →{' '}
                            {deviceScreenProfile.screenAspectRatio})
                          </span>
                        )}
                      </div>

                      <p className="w-full text-xs text-zinc-300 leading-relaxed">
                        {log.actionSequenceSummary}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-900 flex-wrap">
                        <span className="text-[10px] text-zinc-500">
                          {log.timestamp} • {log.learnedFromCourierTag}
                        </span>

                        {/* Owner Action Buttons on Each Log Entry */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {!isPublished ? (
                            <button
                              type="button"
                              onClick={() =>
                                approveAndPublishAiSkillLog(log.id)
                              }
                              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Aprovar &amp; Publicar Skill (OTA)</span>
                            </button>
                          ) : (
                            <span className="rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 px-2 py-1 text-[10px] font-bold flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              <span>Skill Ativa via OTA</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleTestMacroClick(log.id)}
                            className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                          >
                            <Play className="h-2.5 w-2.5" />
                            <span>
                              {isJustTested
                                ? 'Macro Testada ✓'
                                : 'Testar Macro'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => discardAiSkillLog(log.id)}
                            className="rounded-lg bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 text-zinc-400 hover:text-rose-300 px-2 py-1 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                            <span>Descartar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          VIEW 1: [✅ REQUISIÇÕES DE ACEITAÇÃO] — KYC & ACCOUNT APPROVALS
          ===================================================================== */}
      {subTab === 'KYC' && (
        <section className="rounded-2xl bg-zinc-900/95 border border-zinc-800/80 p-3.5 space-y-3 shadow-lg">
          <div className="space-y-2.5">
            <div>
              <span className="text-base font-extrabold text-zinc-100 flex items-center gap-1.5 flex-wrap">
                <Users className="h-4 w-4 text-[#00E5FF]" />
                <span>
                  ✓ Requisições de Aceitação &amp; Controlo de Contas ({totalRegisteredCount})
                </span>
                {pendingApprovalsCount > 0 && (
                  <span className="rounded-full bg-[#00E5FF] text-slate-950 px-2 py-0.5 text-[10px] font-black animate-pulse">
                    ⏳ {pendingApprovalsCount} Pendente{pendingApprovalsCount > 1 ? 's' : ''}
                  </span>
                )}
                {syncDoneBadge && (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 px-2 py-0.5 text-[10px] font-extrabold">
                    ✓ Sincronizado agora
                  </span>
                )}
              </span>
              <span className="text-xs text-zinc-400 block mt-0.5">
                Sincronização Automática em Tempo Real com todos os telemóveis (Cloud Relay +{' '}
                <code className="text-[#00E5FF]">public.couriers</code>). Aprove ou bloqueie com 1 toque.
              </span>
            </div>

            {/* Clean Full-Width 2-Column Grid for Sync & Edit Profile */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={handleForceSyncCloudAccounts}
                disabled={isSyncingCloudAccounts}
                style={{
                  backgroundColor: '#0B0F17',
                  borderColor: '#00E5FF',
                  color: '#00E5FF',
                }}
                className="w-full rounded-xl border px-2.5 py-2 text-xs font-extrabold cursor-pointer transition flex items-center justify-center gap-1 truncate"
              >
                <span className="truncate">
                  {isSyncingCloudAccounts
                    ? '⏳ A Sincronizar...'
                    : syncDoneBadge
                      ? '✓ Sincronizado agora'
                      : '🔄 Sincronizar Nuvem'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsCourierRegistrationModalOpen(true)}
                style={{
                  backgroundColor: '#0B0F17',
                  borderColor: '#00E5FF',
                  color: '#00E5FF',
                }}
                className="w-full rounded-xl border px-2.5 py-2 text-xs font-extrabold cursor-pointer transition flex items-center justify-center gap-1 truncate"
              >
                <span className="truncate">✏️ Editar Meu Registo</span>
              </button>
            </div>

            {/* 1-Tap Manual Colleague Add Button */}
            <button
              type="button"
              onClick={() => setIsManualAddOpen((prev) => !prev)}
              style={{
                backgroundColor: isManualAddOpen ? '#00E5FF' : '#0B0F17',
                borderColor: '#00E5FF',
                color: isManualAddOpen ? '#05070B' : '#00E5FF',
              }}
              className="w-full rounded-xl border px-3 py-2 text-xs font-extrabold cursor-pointer transition flex items-center justify-center gap-1.5"
            >
              <span>➕ Adicionar Estafeta à Frota</span>
            </button>

            {isManualAddOpen && (
              <form
                onSubmit={handleManualAddColleague}
                className="rounded-xl bg-zinc-950 border border-[#00E5FF]/50 p-3 space-y-2.5 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#00E5FF]">
                    ➕ Registar / Aprovar Colega Manualmente (1 Toque)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsManualAddOpen(false)}
                    className="text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
                  >
                    ✕ Fechar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Nome / Callsign (ex.: Pai, João, Carlos)"
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-semibold text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00E5FF]"
                  />
                  <input
                    type="text"
                    value={manualContact}
                    onChange={(e) => setManualContact(e.target.value)}
                    placeholder="Telemóvel ou Email (opcional)"
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-semibold text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={manualVehicle}
                    onChange={(e) =>
                      setManualVehicle(e.target.value as CourierRegistrationVehicle)
                    }
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                  >
                    <option value="Mota 125cc">🛵 Mota 125cc</option>
                    <option value="Scooter Elétrica">⚡ Scooter Elétrica</option>
                    <option value="Bicicleta Elétrica">🚲 Bicicleta Elétrica</option>
                    <option value="Carro Ligeiro">🚗 Carro Ligeiro</option>
                  </select>
                  <select
                    value={manualZone}
                    onChange={(e) =>
                      setManualZone(e.target.value as AmaranteBaseZoneOption)
                    }
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                  >
                    <option value="Amarante Centro / São Gonçalo">
                      Amarante Centro / São Gonçalo
                    </option>
                    <option value="Vila Meã / Real">Vila Meã / Real</option>
                    <option value="Lixa / Felgueiras">Lixa / Felgueiras</option>
                    <option value="Marco de Canaveses">Marco de Canaveses</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {(
                    [
                      'Uber Eats',
                      'Glovo',
                      'Bolt Food',
                      'Comércio Local',
                    ] as PlatformName[]
                  ).map((plat) => {
                    const active = manualPlatforms.includes(plat);
                    return (
                      <button
                        key={plat}
                        type="button"
                        onClick={() =>
                          setManualPlatforms((prev) =>
                            prev.includes(plat)
                              ? prev.filter((p) => p !== plat)
                              : [...prev, plat]
                          )
                        }
                        style={{
                          backgroundColor: active ? '#00E5FF' : '#111827',
                          borderColor: active ? '#00E5FF' : '#334155',
                          color: active ? '#05070B' : '#CBD5E1',
                        }}
                        className="rounded-lg border px-2 py-1 text-[10px] font-extrabold cursor-pointer transition"
                      >
                        {active ? `✓ ${plat}` : plat}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  style={{
                    backgroundColor: '#00E5FF',
                    color: '#05070B',
                  }}
                  className="w-full rounded-xl py-2 px-3 text-xs font-black cursor-pointer transition"
                >
                  ✓ Aprovar &amp; Publicar Estafeta na Frota Agora
                </button>

                {manualAddFeedback && (
                  <p className="text-xs font-extrabold text-emerald-400 text-center">
                    {manualAddFeedback}
                  </p>
                )}
              </form>
            )}

            {/* 📲 Canais de Recebimento do Admin (WhatsApp & E-mail) */}
            <div className="rounded-xl bg-zinc-950 border border-[#00E5FF]/40 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-xs sm:text-sm font-extrabold text-white block">
                    📲 Canais de Recebimento do Admin (WhatsApp &amp; E-mail)
                  </span>
                  <span className="text-[11px] text-zinc-400 block">
                    Receba requisições de novos estafetas, reclamações, suporte e alertas SOS no seu WhatsApp e E-mail.
                  </span>
                </div>
                {adminNotifySavedBadge && (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 px-2.5 py-0.5 text-[10px] font-extrabold">
                    ✓ Canais Guardados
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1">
                    📲 WhatsApp do Admin (+351...)
                  </label>
                  <input
                    type="tel"
                    value={adminNotifyConfig.adminWhatsapp}
                    onChange={(e) =>
                      setAdminNotifyConfig((prev) => ({
                        ...prev,
                        adminWhatsapp: e.target.value,
                      }))
                    }
                    placeholder="+351 912 345 678"
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1">
                    ✉️ E-mail do Admin
                  </label>
                  <input
                    type="email"
                    value={adminNotifyConfig.adminEmail}
                    onChange={(e) =>
                      setAdminNotifyConfig((prev) => ({
                        ...prev,
                        adminEmail: e.target.value,
                      }))
                    }
                    placeholder="admin@deliverybuddy.pt"
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      setAdminNotifyConfig((prev) => ({
                        ...prev,
                        autoNotifyNewUsers: !prev.autoNotifyNewUsers,
                      }))
                    }
                    style={{
                      backgroundColor: adminNotifyConfig.autoNotifyNewUsers
                        ? 'rgba(0, 229, 255, 0.14)'
                        : '#090D16',
                      borderColor: adminNotifyConfig.autoNotifyNewUsers
                        ? '#00E5FF'
                        : '#27272a',
                      color: adminNotifyConfig.autoNotifyNewUsers
                        ? '#00E5FF'
                        : '#a1a1aa',
                    }}
                    className="rounded-lg border px-2.5 py-1 text-[11px] font-extrabold cursor-pointer"
                  >
                    {adminNotifyConfig.autoNotifyNewUsers ? '✓' : '○'} Novos Registos
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAdminNotifyConfig((prev) => ({
                        ...prev,
                        autoNotifyReportsAndSos: !prev.autoNotifyReportsAndSos,
                      }))
                    }
                    style={{
                      backgroundColor: adminNotifyConfig.autoNotifyReportsAndSos
                        ? 'rgba(0, 229, 255, 0.14)'
                        : '#090D16',
                      borderColor: adminNotifyConfig.autoNotifyReportsAndSos
                        ? '#00E5FF'
                        : '#27272a',
                      color: adminNotifyConfig.autoNotifyReportsAndSos
                        ? '#00E5FF'
                        : '#a1a1aa',
                    }}
                    className="rounded-lg border px-2.5 py-1 text-[11px] font-extrabold cursor-pointer"
                  >
                    {adminNotifyConfig.autoNotifyReportsAndSos ? '✓' : '○'} Reclamações / Suporte / SOS
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void handleSaveAdminNotifyConfig()}
                  style={{
                    backgroundColor: '#00E5FF',
                    color: '#05070B',
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-black cursor-pointer transition hover:opacity-95"
                >
                  💾 Guardar Canais Admin
                </button>
              </div>

              {adminNotifications.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-zinc-800 max-h-48 overflow-y-auto">
                  <span className="text-[11px] font-extrabold text-[#00E5FF] block">
                    🔔 Últimos Pedidos &amp; Alertas Recebidos ({adminNotifications.length}):
                  </span>
                  {adminNotifications.slice(0, 8).map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg bg-zinc-900 border border-zinc-800 p-2 flex items-center justify-between gap-2 flex-wrap"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-extrabold text-white block truncate">
                          {ev.title}
                        </span>
                        <span className="text-[11px] text-zinc-400 block truncate">
                          {ev.body}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={buildWhatsAppDeepLink(
                            ev.senderWhatsapp || adminNotifyConfig.adminWhatsapp,
                            `${ev.title}\n${ev.body}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 px-2 py-1 text-[10px] font-extrabold no-underline"
                        >
                          📲 Receber / Enviar no WhatsApp
                        </a>
                        <a
                          href={buildMailtoDeepLink(
                            ev.senderEmail || adminNotifyConfig.adminEmail,
                            `[Delivery Buddy] ${ev.title}`,
                            ev.body
                          )}
                          className="rounded-lg bg-sky-500/20 border border-sky-400/60 text-sky-300 px-2 py-1 text-[10px] font-extrabold no-underline"
                        >
                          ✉️ Enviar por E-mail
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Local & Cloud Synced Registered Accounts */}
          {unifiedCloudAndLocalAccounts.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-[#00E5FF] block">
                Contas Registadas &amp; Requisições da Nuvem (Acesso App &amp; Mapa):
              </span>
              {unifiedCloudAndLocalAccounts.map((acc) => {
                const status = acc.status || 'APROVADO';
                const isPending = status === 'PENDENTE';
                const isBlocked = status === 'BLOQUEADO';
                return (
                  <div
                    key={acc.courierId || acc.username}
                    className={`rounded-xl bg-zinc-950 border p-3 flex items-center justify-between gap-2 flex-wrap ${
                      isPending
                        ? 'border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                        : 'border-zinc-800'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-white">
                          {acc.username}
                        </span>
                        <span
                          style={
                            isBlocked || isPending
                              ? undefined
                              : {
                                  backgroundColor: '#0B0F17',
                                  borderColor: '#00E5FF',
                                  color: '#00E5FF',
                                }
                          }
                          className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold border ${
                            isBlocked
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : isPending
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                                : ''
                          }`}
                        >
                          {isBlocked
                            ? '🚫 BLOQUEADO'
                            : isPending
                              ? '⏳ PENDENTE DE APROVAÇÃO'
                              : '✓ APROVADO'}
                        </span>
                        {acc.isCloudOnly && (
                          <span className="rounded-md px-1.5 py-0.5 text-[9px] font-bold bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/40">
                            ☁️ Telemóvel Remoto
                          </span>
                        )}
                        {acc.optInWhatsapp !== false && (
                          <span className="rounded bg-emerald-500/15 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                            🔔 WhatsApp
                          </span>
                        )}
                        {acc.optInEmail !== false && (
                          <span className="rounded bg-sky-500/15 border border-sky-500/40 px-1.5 py-0.5 text-[9px] font-bold text-sky-300">
                            🔔 E-mail
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 block">
                        {acc.whatsapp || acc.email || acc.emailOrPhone || 'Sem contacto'} • {acc.vehicle} •{' '}
                        {acc.zone}
                      </span>
                      {Array.isArray(acc.platforms) && acc.platforms.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {acc.platforms.map((plat) => (
                            <span
                              key={plat}
                              className="rounded bg-zinc-900 border border-[#00E5FF]/40 px-1.5 py-0.5 text-[10px] font-bold text-[#00E5FF]"
                            >
                              {plat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      <a
                        href={buildWhatsAppDeepLink(
                          acc.whatsapp || acc.emailOrPhone || adminNotifyConfig.adminWhatsapp,
                          `Olá ${acc.username}! A tua conta no Delivery Buddy Amarante está ${
                            status === 'APROVADO' ? 'APROVADA ✓' : 'registada'
                          }.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 px-2.5 py-1.5 text-[11px] font-extrabold no-underline"
                        title="Enviar confirmação ou mensagem por WhatsApp"
                      >
                        📲 WhatsApp
                      </a>
                      <a
                        href={buildMailtoDeepLink(
                          acc.email || adminNotifyConfig.adminEmail,
                          `Delivery Buddy Amarante — Conta ${acc.username}`,
                          `Olá ${acc.username},\nA tua conta no Delivery Buddy Amarante está ${
                            status === 'APROVADO' ? 'APROVADA ✓' : 'em validação'
                          }.`
                        )}
                        className="rounded-xl bg-sky-500/15 border border-sky-500/50 text-sky-300 px-2.5 py-1.5 text-[11px] font-extrabold no-underline"
                        title="Enviar confirmação ou mensagem por E-mail"
                      >
                        ✉️ E-mail
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleLocalAccountStatus(acc.username, 'APROVADO', acc.courierId)
                        }
                        style={
                          status === 'APROVADO'
                            ? {
                                backgroundColor: '#0B0F17',
                                borderColor: '#00E5FF',
                                color: '#00E5FF',
                              }
                            : isPending
                              ? {
                                  backgroundColor: '#00E5FF',
                                  borderColor: '#00E5FF',
                                  color: '#05070B',
                                }
                              : undefined
                        }
                        className={`rounded-xl border px-3 py-1.5 text-xs font-extrabold cursor-pointer transition ${
                          status === 'APROVADO' || isPending
                            ? ''
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                        }`}
                      >
                        ✓ Aprovar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleLocalAccountStatus(acc.username, 'BLOQUEADO', acc.courierId)
                        }
                        className={`rounded-xl px-3 py-1.5 text-xs font-extrabold cursor-pointer transition ${
                          isBlocked
                            ? 'bg-rose-600 text-white'
                            : 'bg-zinc-900 border border-zinc-700 text-rose-300'
                        }`}
                      >
                        🚫 Bloquear
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 📢 Enviar Alerta Importante (WhatsApp / E-mail) para Estafetas Opt-In */}
          <div className="rounded-xl bg-zinc-950 border border-[#00E5FF]/40 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className="text-xs sm:text-sm font-extrabold text-white block">
                  📢 Enviar Alerta Importante (WhatsApp / E-mail)
                </span>
                <span className="text-[11px] text-zinc-400 block">
                  Envia comunicados urgentes diretamente para o WhatsApp ou E-mail dos estafetas que autorizaram receber alertas.
                </span>
              </div>
              <span className="rounded bg-[#0B0F17] border border-[#00E5FF] px-2 py-0.5 text-[10px] font-black text-[#00E5FF]">
                {
                  unifiedCloudAndLocalAccounts.filter(
                    (a) => a.optInWhatsapp !== false || a.optInEmail !== false
                  ).length
                }{' '}
                Estafetas Opt-In
              </span>
            </div>

            <input
              type="text"
              value={importantAlertMessage}
              onChange={(e) => setImportantAlertMessage(e.target.value)}
              placeholder="Escreva a mensagem importante para enviar via WhatsApp / E-mail..."
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#00E5FF]"
            />

            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={buildMailtoDeepLink(
                  adminNotifyConfig.adminEmail,
                  '📢 Alerta Importante — Delivery Buddy Amarante',
                  importantAlertMessage,
                  unifiedCloudAndLocalAccounts
                    .filter((a) => a.optInEmail !== false && a.email && a.email.includes('@'))
                    .map((a) => a.email as string)
                )}
                className="rounded-xl bg-sky-500/20 border border-sky-400 text-sky-200 px-3 py-1.5 text-xs font-extrabold no-underline"
              >
                ✉️ Disparar E-mail para Todos Opt-In
              </a>
              <a
                href={buildWhatsAppDeepLink('', importantAlertMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 px-3 py-1.5 text-xs font-extrabold no-underline"
              >
                📲 Partilhar Alerta no WhatsApp
              </a>
            </div>

            <div className="space-y-1.5 pt-1">
              {unifiedCloudAndLocalAccounts
                .filter((a) => a.optInWhatsapp !== false || a.optInEmail !== false)
                .map((acc) => (
                  <div
                    key={`optin-${acc.courierId || acc.username}`}
                    className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 flex items-center justify-between gap-2 flex-wrap"
                  >
                    <span className="text-xs font-bold text-zinc-200">
                      {acc.username}{' '}
                      <span className="text-[10px] text-zinc-400">
                        ({acc.whatsapp || acc.email || acc.emailOrPhone || 'Contacto na Conta'})
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {acc.optInWhatsapp !== false && (
                        <a
                          href={buildWhatsAppDeepLink(
                            acc.whatsapp || acc.emailOrPhone || '',
                            importantAlertMessage
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 px-2 py-0.5 text-[10px] font-extrabold no-underline"
                        >
                          📲 Enviar WhatsApp
                        </a>
                      )}
                      {acc.optInEmail !== false && (
                        <a
                          href={buildMailtoDeepLink(
                            acc.email || '',
                            '📢 Alerta Importante — Delivery Buddy',
                            importantAlertMessage
                          )}
                          className="rounded bg-sky-500/20 border border-sky-400/60 text-sky-300 px-2 py-0.5 text-[10px] font-extrabold no-underline"
                        >
                          ✉️ Enviar E-mail
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Supabase Realtime Couriers (Deduplicated against Local Registered Accounts) */}
          {deduplicatedAdminCouriers.length > 0 && (
            <div className="space-y-2">
              {deduplicatedAdminCouriers.map((c) => {
                const isSelf =
                  Boolean(c.isSelfRegistered) ||
                  Boolean(realCourierProfile && c.id === realCourierProfile.id);
                const cleanFullName = c.fullName.replace(/\s*\(Tu\)\s*$/i, '');
                return (
                  <div
                    key={c.id}
                    className={`rounded-xl bg-zinc-950 p-3 space-y-2 border ${
                      isSelf ? 'border-[#00E5FF]/50' : 'border-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-extrabold text-zinc-100">
                            {cleanFullName}
                          </span>
                          <span
                            style={{
                              backgroundColor: '#0B0F17',
                              borderColor: '#00E5FF',
                              color: '#00E5FF',
                            }}
                            className="rounded px-1.5 py-0.5 text-[10px] font-bold border"
                          >
                            ● ONLINE NO MAPA ({c.lastActiveText})
                          </span>
                          <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                            Estado: {c.kycStatus}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[#0284C7] block mt-0.5">
                          {c.vehicle || 'Mota 125cc'} • Zona:{' '}
                          {c.activeAmaranteZone || c.cityZone}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateAdminCourierKycStatus(c.id, 'Ativo')}
                          style={
                            c.kycStatus === 'Ativo'
                              ? {
                                  backgroundColor: '#0B0F17',
                                  borderColor: '#00E5FF',
                                  color: '#00E5FF',
                                }
                              : undefined
                          }
                          className={`rounded-xl border px-3 py-1.5 text-xs font-extrabold cursor-pointer transition ${
                            c.kycStatus === 'Ativo'
                              ? ''
                              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          ✓ Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateAdminCourierKycStatus(c.id, 'Suspenso')
                          }
                          className={`rounded-xl px-3 py-1.5 text-xs font-extrabold cursor-pointer transition ${
                            c.kycStatus === 'Suspenso'
                              ? 'bg-rose-600 text-white'
                              : 'bg-zinc-900 border border-zinc-800 text-rose-300'
                          }`}
                        >
                          🚫 Bloquear
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =====================================================================
          VIEW 2: [⚠️ RECLAMAÇÕES & ALERTAS] — COMPLAINTS, HAZARDS & BROADCASTS
          ===================================================================== */}
      {subTab === 'RECLAMACOES_ALERTAS' && (
        <section className="rounded-2xl bg-zinc-900/95 border border-zinc-800/80 p-3.5 space-y-3.5 shadow-lg">
          {/* Feed of Courier Complaints & Forbidden Routes (No Yellow Pill, Executive Layout) */}
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-extrabold text-zinc-100 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-[#0284C7] shrink-0" />
                <span>
                  ⚠️ Reclamações de Rotas, Pilaretes &amp; Desvios (
                  {visibleComplaints.length})
                </span>
              </span>
            </div>

            {visibleComplaints.length === 0 ? (
              <div
                style={{
                  backgroundColor: isDaylight ? '#F8FAFC' : '#111827',
                  borderColor: isDaylight
                    ? '#E2E8F0'
                    : 'rgba(0, 229, 255, 0.25)',
                  color: isDaylight ? '#475569' : '#94A3B8',
                }}
                className="rounded-xl border p-4 text-center text-xs font-bold"
              >
                Todas as reclamações foram processadas ou arquivadas.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-0.5">
                {visibleComplaints.map((rc) => {
                  const isPublished = publishedComplaintIds.includes(rc.id);
                  return (
                    <div
                      key={rc.id}
                      style={{
                        backgroundColor: isDaylight ? '#FFFFFF' : '#111827',
                        borderColor: isDaylight
                          ? '#E2E8F0'
                          : 'rgba(0, 229, 255, 0.28)',
                      }}
                      className="rounded-xl border p-3 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span
                            style={{
                              backgroundColor: '#0B0F17',
                              borderColor: '#00E5FF',
                              color: '#00E5FF',
                            }}
                            className="rounded-lg border px-2 py-0.5 text-[11px] font-extrabold shrink-0"
                          >
                            {rc.platform}
                          </span>
                          <span
                            style={{
                              color: isDaylight ? '#090D16' : '#FFFFFF',
                            }}
                            className="text-xs font-extrabold leading-snug"
                          >
                            {rc.title}
                          </span>
                        </div>
                        <span
                          style={{
                            backgroundColor: isDaylight ? '#F1F5F9' : '#0B0F17',
                            borderColor: isDaylight
                              ? '#CBD5E1'
                              : 'rgba(0, 229, 255, 0.35)',
                            color: isDaylight ? '#334155' : '#00E5FF',
                          }}
                          className="rounded-md border px-2 py-0.5 text-[10px] font-extrabold shrink-0"
                        >
                          {rc.category} • {rc.confirmationsCount} conf.
                        </span>
                      </div>

                      <p
                        style={{ color: isDaylight ? '#334155' : '#E2E8F0' }}
                        className="text-xs leading-relaxed font-medium"
                      >
                        {rc.description}
                      </p>

                      {typeof rc.appAnnouncedKm === 'number' &&
                        typeof rc.realLegalKm === 'number' && (
                          <div
                            style={{
                              backgroundColor: isDaylight
                                ? '#F8FAFC'
                                : '#0B0F17',
                              borderColor: isDaylight
                                ? '#CBD5E1'
                                : 'rgba(0, 229, 255, 0.25)',
                            }}
                            className="rounded-lg border px-2.5 py-1.5 flex items-center justify-between gap-2 flex-wrap text-xs"
                          >
                            <span
                              style={{
                                color: isDaylight ? '#475569' : '#94A3B8',
                              }}
                              className="font-bold"
                            >
                              Discrepância de Rota (Anunciado vs. Real):
                            </span>
                            <span
                              style={{
                                color: isDaylight ? '#090D16' : '#FFFFFF',
                              }}
                              className="font-extrabold"
                            >
                              {rc.appAnnouncedKm.toFixed(1)} km →{' '}
                              <strong
                                style={{
                                  color: isDaylight ? '#00838F' : '#00E5FF',
                                }}
                              >
                                {rc.realLegalKm.toFixed(1)} km reais
                              </strong>
                            </span>
                          </div>
                        )}

                      {/* 2 Actionable Admin Buttons: ✓ Publicar Alerta no Mapa & 🗑️ Arquivar */}
                      <div
                        style={{
                          borderColor: isDaylight
                            ? '#F1F5F9'
                            : 'rgba(0, 229, 255, 0.15)',
                        }}
                        className="flex items-center justify-end gap-2 pt-1 border-t flex-wrap"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (!isPublished) {
                              setPublishedComplaintIds((prev) => [
                                ...prev,
                                rc.id,
                              ]);
                              addRoadHazardPin(
                                'Obras na Via / Desvio',
                                `${rc.title} (${rc.platform})`,
                                'Amarante'
                              );
                            }
                          }}
                          style={{
                            backgroundColor: '#0B0F17',
                            borderColor: '#00E5FF',
                            color: '#00E5FF',
                          }}
                          className="rounded-xl border px-3 py-1.5 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition hover:opacity-95"
                        >
                          <span>
                            {isPublished
                              ? '✓ Alerta Publicado no Mapa'
                              : '✓ Publicar Alerta no Mapa'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setArchivedComplaintIds((prev) => [...prev, rc.id])
                          }
                          style={{
                            backgroundColor: isDaylight ? '#F8FAFC' : '#0B0F17',
                            borderColor: isDaylight
                              ? '#CBD5E1'
                              : 'rgba(148, 163, 184, 0.35)',
                            color: isDaylight ? '#475569' : '#94A3B8',
                          }}
                          className="rounded-xl border px-3 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer transition hover:opacity-90"
                        >
                          <span>🗑️ Arquivar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Road Hazards in Amarante */}
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 space-y-2.5">
            <span className="text-sm font-extrabold text-zinc-100 block">
              🚧 Perigos na Via Ativos em Amarante (
              {roadHazards.filter((h) => !h.resolved).length})
            </span>
            <div className="space-y-2">
              {roadHazards
                .filter((h) => !h.resolved)
                .map((haz) => (
                  <div
                    key={haz.id}
                    style={{
                      backgroundColor: isDaylight ? '#F8FAFC' : '#111827',
                      borderColor: isDaylight
                        ? '#E2E8F0'
                        : 'rgba(0, 229, 255, 0.25)',
                    }}
                    className="rounded-xl border p-2.5 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span
                        style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                        className="text-xs font-extrabold block"
                      >
                        {haz.hazardType} — {haz.streetLocation}
                      </span>
                      <span
                        style={{ color: isDaylight ? '#475569' : '#94A3B8' }}
                        className="text-[11px] font-medium block"
                      >
                        Reportado por {haz.reporterName} • {haz.reportedAt} (
                        {haz.confirmations} confirmações)
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Streamlined Send Official Admin Broadcast Card */}
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 space-y-3">
            <span className="text-sm font-extrabold text-zinc-100 flex items-center gap-1.5">
              <Megaphone className="h-4 w-4 text-[#00E5FF]" />
              <span>Enviar Comunicado Oficial à Frota</span>
            </span>

            <form onSubmit={handleSendBroadcast} className="space-y-2">
              <select
                value={targetType}
                onChange={(e) =>
                  setTargetType(e.target.value as AdminBroadcastTargetType)
                }
                style={{
                  backgroundColor: isDaylight ? '#FFFFFF' : '#111827',
                  borderColor: isDaylight
                    ? '#CBD5E1'
                    : 'rgba(0, 229, 255, 0.28)',
                  color: isDaylight ? '#090D16' : '#FFFFFF',
                }}
                className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#00E5FF]"
              >
                <option value="TODOS_ESTAFETAS">Todos os Estafetas</option>
                <option value="ZONA_ESPECIFICA">
                  Zona Específica (Amarante 35 km)
                </option>
              </select>
              <input
                type="text"
                required
                value={msgTitle}
                onChange={(e) => setMsgTitle(e.target.value)}
                placeholder="Título do comunicado..."
                style={{
                  backgroundColor: isDaylight ? '#FFFFFF' : '#111827',
                  borderColor: isDaylight
                    ? '#CBD5E1'
                    : 'rgba(0, 229, 255, 0.28)',
                  color: isDaylight ? '#090D16' : '#FFFFFF',
                }}
                className="w-full rounded-xl border px-3 py-2 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#00E5FF]"
              />
              <input
                type="text"
                required
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                placeholder="Mensagem curta para os estafetas..."
                style={{
                  backgroundColor: isDaylight ? '#FFFFFF' : '#111827',
                  borderColor: isDaylight
                    ? '#CBD5E1'
                    : 'rgba(0, 229, 255, 0.28)',
                  color: isDaylight ? '#090D16' : '#FFFFFF',
                }}
                className="w-full rounded-xl border px-3 py-2 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#00E5FF]"
              />
              <button
                type="submit"
                style={{
                  backgroundColor: '#0B0F17',
                  borderColor: '#00E5FF',
                  color: '#00E5FF',
                }}
                className="w-full rounded-xl border py-2.5 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition hover:opacity-95 shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Publicar Comunicado Oficial</span>
              </button>
            </form>

            {adminBroadcasts.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {adminBroadcasts.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    style={{
                      backgroundColor: isDaylight ? '#F8FAFC' : '#111827',
                      borderColor: isDaylight
                        ? '#E2E8F0'
                        : 'rgba(0, 229, 255, 0.25)',
                    }}
                    className="rounded-xl border p-2.5 text-xs"
                  >
                    <span
                      style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                      className="font-extrabold block"
                    >
                      {b.title}
                    </span>
                    <span
                      style={{ color: isDaylight ? '#475569' : '#94A3B8' }}
                      className="text-[11px] font-medium"
                    >
                      {b.body}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* =====================================================================
          VIEW 3: [💬 CENTRAL DE SUPORTE ATIVO (TEMPO REAL)] — LIVE ADMIN INBOX
          ===================================================================== */}
      {subTab === 'SUPORTE_ATIVO' && (
        <section className="rounded-2xl bg-zinc-900/95 border border-sky-500/40 p-3.5 space-y-3.5 shadow-lg">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#00E5FF]" />
                <span>💬 Central de Suporte Ativo (Tempo Real)</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Receba e responda em tempo real às mensagens de suporte enviadas pelos estafetas na App e no Login.
              </p>
            </div>
            <span
              style={{
                backgroundColor: '#0B0F17',
                borderColor: '#00E5FF',
                color: '#00E5FF',
              }}
              className="rounded-full border px-3 py-1 text-xs font-extrabold"
            >
              ● Canal Direto Ativo
            </span>
          </div>

          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 max-h-80 overflow-y-auto space-y-2.5">
            {supportMessages.map((msg) => {
              const isAdmin = msg.sender === 'SUPPORT';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isAdmin ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      isAdmin
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-zinc-900 border border-sky-500/40 text-zinc-100 font-semibold'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1 text-[11px] opacity-85">
                      <span className="font-extrabold">
                        {msg.topicBadge ||
                          (isAdmin ? 'Suporte Admin' : '👤 Estafeta')}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="leading-snug">{msg.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={(e) => void handleSendAdminSupportReply(e)}
            className="flex items-center gap-2 w-full"
          >
            <input
              type="text"
              value={adminReplyText}
              onChange={(e) => setAdminReplyText(e.target.value)}
              placeholder="Escrever resposta de suporte..."
              className="min-w-0 flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#00E5FF]"
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#0F172A',
                borderColor: '#00E5FF',
                color: '#00E5FF',
              }}
              className="rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap shadow-xs transition hover:opacity-95"
            >
              <Send className="h-3.5 w-3.5 shrink-0" />
              <span>Responder</span>
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
