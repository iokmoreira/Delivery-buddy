import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  AdminBroadcastTargetType,
  AdminCourierKycStatus,
  AdminSponsorCategory,
  AdminBannerPlacement,
  AiDailyQuotaTier,
  AiNetworkSyncSpeedMode,
  AiSkillLogCategory,
  GeminiStudioModelSelection,
} from '../types/models';
import {
  GEMINI_STUDIO_MODEL_OPTIONS,
  SUPABASE_COMPLETE_SQL_SCHEMA_SCRIPT,
  sanitizeSupabaseUrlInput,
  sanitizeSupabaseKeyInput,
} from '../services/geminiAgent';
import { useEstafetas } from '../context/EstafetasContext';

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
    simulateNewAiSkillLearning,
    heartbeatSecondsLeft,
    deviceScreenProfile,
    startVoiceTeachSkillMode,
    realCourierProfile,
    setIsCourierRegistrationModalOpen,
    setIsOfficialManualModalOpen,
    isAppInstalledStandalone,
    canPromptNativeInstall,
    triggerNativeAppInstallPrompt,
    showManualInstallGuideModal,
    setShowManualInstallGuideModal,
  } = useEstafetas();

  const [subTab, setSubTab] = useState<
    'IA_SKILLS' | 'PATROCINIOS' | 'KYC' | 'COMUNICADOS'
  >('IA_SKILLS');

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
      {/* Top Action Strip: Native Fullscreen App Install + Official Manual */}
      <div className="rounded-xl bg-zinc-900 border border-emerald-500/35 px-3 py-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
              {isAppInstalledStandalone
                ? '✓ MODO NATIVO ECRÃ INTEIRO ATIVO'
                : canPromptNativeInstall
                  ? 'INSTALAÇÃO DIRETA 1-CLIQUE PRONTA'
                  : 'APP STANDALONE & CAPACITOR OTA (com.deliverybuddy.app)'}
            </span>
            <span className="text-xs font-extrabold text-zinc-100 block truncate">
              📲 Instalar Aplicativo Delivery Buddy (Modo Nativo Ecrã Inteiro)
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => {
                void triggerNativeAppInstallPrompt();
              }}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shrink-0"
            >
              <span>📲 Instalar Aplicativo no Telemóvel</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOfficialManualModalOpen(true)}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shrink-0"
            >
              <span>📘 Manual de Uso &amp; Lista de Comandos</span>
            </button>
          </div>
        </div>

        {showManualInstallGuideModal && (
          <div className="rounded-xl bg-zinc-950/95 border border-emerald-500/40 p-2.5 space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-300">
                Guia Rápido (Instalar em 5 Segundos no Telemóvel):
              </span>
              <button
                type="button"
                onClick={() => setShowManualInstallGuideModal(false)}
                className="text-[10px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Fechar ✕
              </button>
            </div>
            <p className="text-zinc-200 font-semibold">
              Toque nos <strong className="text-emerald-400">3 pontos do Chrome ⋮</strong> &rarr; <strong className="text-emerald-400">&ldquo;Instalar aplicação / Adicionar ao ecrã principal&rdquo;</strong> para correr 100% em ecrã inteiro sem barra de URL.
            </p>
          </div>
        )}
      </div>

      {/* Top 4-Tab Segmented Switcher */}
      <div className="bg-zinc-900 p-1 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-1 border border-zinc-800/80">
        <button
          type="button"
          onClick={() => setSubTab('IA_SKILLS')}
          className={`rounded-lg py-1.5 px-2 text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
            subTab === 'IA_SKILLS'
              ? 'bg-white text-zinc-950 font-extrabold'
              : 'text-zinc-200 hover:text-white bg-zinc-950/60'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
          <span className="truncate">IA &amp; Logs de Skills</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('PATROCINIOS')}
          className={`rounded-lg py-1.5 px-2 text-xs transition cursor-pointer truncate ${
            subTab === 'PATROCINIOS'
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          Patrocínios ({adminSponsoredCampaigns.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('KYC')}
          className={`rounded-lg py-1.5 px-2 text-xs transition cursor-pointer truncate ${
            subTab === 'KYC'
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          Estafetas KYC ({adminManagedCouriers.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('COMUNICADOS')}
          className={`rounded-lg py-1.5 px-2 text-xs transition cursor-pointer truncate ${
            subTab === 'COMUNICADOS'
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          Comunicados
        </button>
      </div>

      {/* =====================================================================
          VIEW 0: [IA & LOGS DE SKILLS] — GOOGLE AI STUDIO PRO & HYBRID ENGINE,
          SUPABASE REALTIME & SQL GENERATOR, AND SKILL LEARNING LOBBY
          ===================================================================== */}
      {subTab === 'IA_SKILLS' && (
        <section
          aria-label="Agente IA Google AI Studio Pro, Supabase Realtime e Logs de Aprendizagem de Skills"
          className="rounded-2xl bg-zinc-900/95 border border-zinc-800/80 p-3.5 space-y-3.5 shadow-lg"
        >
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
                    <strong className="font-mono text-indigo-300">
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
                    className="w-full rounded-xl bg-zinc-900 border border-indigo-500/50 px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
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
                  className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
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
                  <strong className="font-mono text-zinc-100">
                    {aiAgentConfig.activeResolvedModelName ||
                      'gemini-pro-latest'}
                  </strong>{' '}
                  • Status:{' '}
                  <strong className="text-emerald-400">
                    {aiAgentConfig.lastResponseStatusText ||
                      '200 OK • Motor gemini-pro-latest Ativo'}
                  </strong>
                </span>
                <span className="font-mono text-zinc-400">
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
                <span className="text-[10px] font-mono text-emerald-400">
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
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold flex items-center gap-1.5 border ${
                  isSupabaseOnline
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                }`}
              >
                <span>
                  {isSupabaseOnline
                    ? '● Supabase Realtime: Online (WebSockets Ativos)'
                    : '○ Aguardar Chaves do Supabase'}
                </span>
              </span>
            </div>

            {/* 2. Credential Inputs (Persisted in localStorage) */}
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 block">
                  1. URL DO PROJETO SUPABASE (Project URL)
                </label>
                <input
                  type="url"
                  value={supabaseUrlDraft}
                  onChange={(e) =>
                    setSupabaseUrlDraft(sanitizeSupabaseUrlInput(e.target.value))
                  }
                  placeholder="https://xxxxxxxxxxxx.supabase.co"
                  aria-label="1. URL DO PROJETO SUPABASE (Project URL)"
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 block">
                  2. CHAVE API PÚBLICA (anon / public key)
                </label>
                <input
                  type="password"
                  value={supabaseKeyDraft}
                  onChange={(e) =>
                    setSupabaseKeyDraft(sanitizeSupabaseKeyInput(e.target.value))
                  }
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  aria-label="2. CHAVE API PÚBLICA (anon / public key)"
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
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
                    <pre className="text-[10px] font-mono text-zinc-300 overflow-x-auto max-h-56 whitespace-pre-wrap select-all leading-relaxed">
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
                <button
                  type="button"
                  onClick={() => simulateNewAiSkillLearning()}
                  className="rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 px-3 py-1.5 text-xs font-extrabold flex items-center gap-1 cursor-pointer transition shrink-0 shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Simular Nova Aprendizagem da IA</span>
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
                    <strong className="text-emerald-400 font-mono">
                      {deviceScreenProfile.screenAspectRatio}
                    </strong>{' '}
                    ({deviceScreenProfile.screenWidthPx}x
                    {deviceScreenProfile.screenHeightPx})
                  </span>
                </div>
              </div>
              <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-extrabold text-emerald-300">
                {aiAgentConfig.continuousLearningEnabled
                  ? 'Modo A (Passivo Automático): ATIVO'
                  : 'Modo A (Passivo Automático): PAUSADO'}
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
                      className="rounded-xl bg-zinc-950 border border-zinc-800/90 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="rounded bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 text-[9px] font-mono font-bold text-indigo-300">
                              {log.platformOrApp} • {log.zoneContext}
                            </span>
                            <span className="text-[10px] font-semibold text-zinc-400">
                              {getCategoryBadgeLabel(log.category)}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400">
                              • Confiança: {log.confidenceScorePct.toFixed(1)}%
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
                          <p className="text-xs font-bold text-zinc-100 leading-snug">
                            {log.skillTitle}
                          </p>
                        </div>

                        <span
                          className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold shrink-0 ${
                            isPublished
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {isPublished
                            ? 'Publicada para Todos os Buddys'
                            : 'Em Análise'}
                        </span>
                      </div>

                      {/* Device Model & Screen Aspect Ratio Compatibility Strip */}
                      <div className="flex items-center justify-between gap-2 flex-wrap rounded-lg bg-zinc-900/90 border border-zinc-800 px-2.5 py-1.5">
                        <span className="text-[10px] font-mono text-zinc-300 flex items-center gap-1">
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

                      <p className="text-[11px] text-zinc-400 leading-snug">
                        {log.actionSequenceSummary}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-900 flex-wrap">
                        <span className="text-[10px] font-mono text-zinc-500">
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

      {/* VIEW 1: PATROCÍNIOS & SEGUROS */}
      {subTab === 'PATROCINIOS' && (
        <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-zinc-300" />
              <span>Campanhas Patrocinadas B2B</span>
            </span>
            <button
              type="button"
              onClick={() => setIsCampaignModalOpen(true)}
              className="rounded-lg bg-white text-zinc-950 px-2.5 py-1 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Campanha</span>
            </button>
          </div>

          <div className="space-y-2">
            {adminSponsoredCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-3 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-zinc-400 block">
                    {camp.category} • {camp.placement}
                  </span>
                  <span className="text-xs font-semibold text-zinc-100 block truncate">
                    {camp.sponsorName} — {camp.offerHeadline}
                  </span>
                  <span className="text-[11px] text-zinc-400 block">
                    {camp.discountOrBonusValue} • {camp.viewsCount} vistas
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAdminSponsoredCampaignActive(camp.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0 cursor-pointer ${
                    camp.isActive
                      ? 'bg-white text-zinc-950'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {camp.isActive ? 'Ativa' : 'Pausada'}
                </button>
              </div>
            ))}
          </div>

          {isCampaignModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleCreateCampaign}
                className="w-full max-w-[380px] rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Publicar Patrocínio B2B
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCampaignModalOpen(false)}
                    className="p-1 rounded bg-zinc-950 text-zinc-400 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    placeholder="Marca / Parceiro (ex: Fidelidade Mota)"
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100"
                  />
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as AdminSponsorCategory)
                    }
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100"
                  >
                    <option value="Seguros (Destaque Especial)">
                      Seguros (Destaque Especial)
                    </option>
                    <option value="Pneus & Travões">Pneus &amp; Travões</option>
                    <option value="Óleo & Manutenção Mecânica">
                      Óleo &amp; Manutenção Mecânica
                    </option>
                    <option value="Combustível & Carregamento Elétrico">
                      Combustível &amp; Elétrico
                    </option>
                  </select>
                  <select
                    value={placement}
                    onChange={(e) =>
                      setPlacement(e.target.value as AdminBannerPlacement)
                    }
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100"
                  >
                    <option value="Destaque no Painel">
                      Destaque no Painel
                    </option>
                    <option value="Catálogo de Prêmios">
                      Catálogo de Prêmios
                    </option>
                  </select>
                  <input
                    type="text"
                    required
                    value={offerHeadline}
                    onChange={(e) => setOfferHeadline(e.target.value)}
                    placeholder="Oferta (ex: Seguro Acidentes Trabalho)"
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100"
                  />
                  <input
                    type="text"
                    value={discountOrBonusValue}
                    onChange={(e) => setDiscountOrBonusValue(e.target.value)}
                    placeholder="Valor (ex: -20% Mensalidade)"
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg py-2 bg-white text-zinc-950 font-semibold text-xs cursor-pointer"
                >
                  Publicar Campanha
                </button>
              </form>
            </div>
          )}
        </section>
      )}

      {/* VIEW 2: ESTAFETAS KYC */}
      {subTab === 'KYC' && (
        <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <span className="text-xs font-extrabold text-zinc-100 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span>
                  Controlo de Contas KYC &amp; Presença Realtime (
                  {adminManagedCouriers.length})
                </span>
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                Sincronizado dinamicamente com a tabela{' '}
                <code className="text-emerald-300 font-mono">
                  public.couriers
                </code>{' '}
                do Supabase (Amarante 25km).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCourierRegistrationModalOpen(true)}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 text-[10px] font-extrabold cursor-pointer transition shrink-0"
            >
              {realCourierProfile
                ? `Editar Meu Registo (${realCourierProfile.name})`
                : '+ Registar Meu Perfil no Mapa'}
            </button>
          </div>

          <div className="space-y-2">
            {adminManagedCouriers.length === 0 ? (
              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-4 text-center space-y-2">
                <p className="text-xs font-bold text-zinc-100">
                  Modo Produção Real Ativo • 0 estafetas registados em{' '}
                  <code>public.couriers</code>
                </p>
                <button
                  type="button"
                  onClick={() => setIsCourierRegistrationModalOpen(true)}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-extrabold cursor-pointer transition"
                >
                  Entrar Online no Mapa &amp; Guardar no Supabase
                </button>
              </div>
            ) : (
              adminManagedCouriers.map((c) => {
                const isSelf =
                  Boolean(c.isSelfRegistered) ||
                  Boolean(realCourierProfile && c.id === realCourierProfile.id);
                return (
                  <div
                    key={c.id}
                    className={`rounded-xl bg-zinc-950 p-3 space-y-2 border ${
                      isSelf
                        ? 'border-emerald-500/50'
                        : 'border-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold text-zinc-100">
                            {c.fullName}
                          </span>
                          <span className="rounded px-1.5 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            ● ONLINE NO MAPA ({c.lastActiveText})
                          </span>
                          <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[9px] font-mono text-zinc-300">
                            KYC: {c.kycStatus}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-400 block mt-0.5">
                          {c.vehicle || 'Mota 125cc'} • Zona:{' '}
                          {c.activeAmaranteZone || c.cityZone}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 block">
                          {c.joinedAt} • {c.courierTag} • Rep: {c.reputationPct}
                          %
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {(
                          [
                            { id: 'Ativo', label: 'Ativo' },
                            { id: 'Pendente IA', label: 'Pendente IA' },
                            { id: 'Suspenso', label: 'Suspender' },
                          ] as { id: AdminCourierKycStatus; label: string }[]
                        ).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() =>
                              updateAdminCourierKycStatus(c.id, st.id)
                            }
                            className={`rounded-lg px-2 py-1 text-[10px] font-bold cursor-pointer transition ${
                              c.kycStatus === st.id
                                ? 'bg-white text-zinc-950'
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-[10px] text-zinc-400 bg-zinc-900/80 border border-zinc-800/80 rounded-lg px-2.5 py-1.5 font-mono">
                      {c.kycProofSummary}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* VIEW 3: COMUNICADOS */}
      {subTab === 'COMUNICADOS' && (
        <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-3">
          <span className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
            <Megaphone className="h-3.5 w-3.5 text-zinc-300" />
            <span>Enviar Comunicado Oficial</span>
          </span>

          <form onSubmit={handleSendBroadcast} className="space-y-2">
            <select
              value={targetType}
              onChange={(e) =>
                setTargetType(e.target.value as AdminBroadcastTargetType)
              }
              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100"
            >
              <option value="TODOS_ESTAFETAS">Todos os Estafetas</option>
              <option value="ZONA_ESPECIFICA">
                Zona Específica (Amarante)
              </option>
            </select>
            <input
              type="text"
              required
              value={msgTitle}
              onChange={(e) => setMsgTitle(e.target.value)}
              placeholder="Título do comunicado..."
              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100"
            />
            <input
              type="text"
              required
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              placeholder="Mensagem curta..."
              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100"
            />
            <button
              type="submit"
              className="w-full rounded-lg py-2 bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Enviar Comunicado</span>
            </button>
          </form>

          <div className="space-y-1.5 pt-1">
            {adminBroadcasts.slice(0, 2).map((b) => (
              <div
                key={b.id}
                className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5 text-xs"
              >
                <span className="font-semibold text-zinc-100 block">
                  {b.title}
                </span>
                <span className="text-[11px] text-zinc-400">{b.body}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
