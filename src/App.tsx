import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import {
  EstafetasProvider,
  useEstafetas,
} from './context/EstafetasContext';
import { CockpitHeader } from './components/CockpitHeader';
import { CockpitNavigation } from './components/CockpitNavigation';
import { ScannerAndSplitModule } from './components/ScannerAndSplitModule';
import { WalkieTalkieAndSosModule } from './components/WalkieTalkieAndSosModule';
import { ComplaintsAndRouteTrapsModule } from './components/ComplaintsAndRouteTrapsModule';
import { CalculatorAndCostsModule } from './components/CalculatorAndCostsModule';
import { ShiftRadarModule } from './components/ShiftRadarModule';
import { AuthAndVerificationGate } from './components/AuthAndVerificationGate';
import { FinanceGoalsAndRewardsModule } from './components/FinanceGoalsAndRewardsModule';
import { FloatingBubbleAndQuickMenu } from './components/FloatingBubbleAndQuickMenu';
import { VoiceCopilotAndSupportMacrosModule } from './components/VoiceCopilotAndSupportMacrosModule';
import { AdminBackofficeModule } from './components/AdminBackofficeModule';
import {
  ChromeMascotGalleryBridgeView,
  InteractiveManualAndHelpDrawer,
  MenuMaisHubView,
} from './components/InteractiveManualAndHelpDrawer';
import { TranslatorAndSignLanguageModal } from './components/TranslatorAndSignLanguageModal';
import { DeliverySpeedRealitySummary } from './utils/amaranteCopilotTelemetry';
import { isCourierAdminByName } from './services/cloudSync';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class CockpitErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage:
        error?.message || 'Erro inesperado ao renderizar interface.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-6 space-y-4 text-center shadow-lg">
            <h1 className="text-lg font-bold text-slate-900">
              Delivery Buddy — Recuperação Rápida
            </h1>
            <p className="text-xs text-slate-500">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.clear();
                } catch {
                  // ignore
                }
                window.location.reload();
              }}
              className="w-full rounded-xl py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer"
            >
              Restaurar Sessão e Abrir Aplicação
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppCockpitShell: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    isAuthenticated,
    isBubbleMinimized,
    setIsBubbleMinimized,
    themeMode,
    setIsOfficialManualModalOpen,
    rainLockActive,
    setRainLockActive,
    crashCountdownSeconds,
    cancelCrashCountdown,
    triggerSosEmergencyBeacon,
    unpluggedChargerAlertActive,
    dismissUnpluggedChargerAlert,
    snoozeUnpluggedChargerAlert,
    userBatteryAlertThreshold,
    batterySurvivalMode,
    batteryLevelPct,
    isBatteryCharging,
    toggleBatterySurvivalMode,
    speakTextPt,
    realCourierProfile,
    verifiedAccount,
    isLogoutSweepModalOpen,
    logoutSweepProgressPct,
    logoutSweepCompleted,
  } = useEstafetas();

  const isFounderAdmin = isCourierAdminByName(
    realCourierProfile?.name?.trim() ||
      verifiedAccount?.courierName?.trim() ||
      ''
  );

  const [deliveryRealitySummary, setDeliveryRealitySummary] =
    React.useState<DeliverySpeedRealitySummary | null>(null);
  const [isMapRoadFullscreen, setIsMapRoadFullscreen] =
    React.useState<boolean>(false);

  React.useEffect(() => {
    const handleRealitySummary = (ev: Event) => {
      const customEv = ev as CustomEvent<DeliverySpeedRealitySummary>;
      if (customEv.detail) {
        setDeliveryRealitySummary(customEv.detail);
      }
    };
    const handleMapFullscreen = (ev: Event) => {
      const customEv = ev as CustomEvent<{ expanded?: boolean }>;
      setIsMapRoadFullscreen(Boolean(customEv.detail?.expanded));
    };
    window.addEventListener(
      'buddy-delivery-reality-summary',
      handleRealitySummary
    );
    window.addEventListener('buddy-map-fullscreen-state', handleMapFullscreen);
    return () => {
      window.removeEventListener(
        'buddy-delivery-reality-summary',
        handleRealitySummary
      );
      window.removeEventListener(
        'buddy-map-fullscreen-state',
        handleMapFullscreen
      );
    };
  }, []);

  React.useEffect(() => {
    if (activeTab !== 'radar' && isMapRoadFullscreen) {
      setIsMapRoadFullscreen(false);
    }
  }, [activeTab, isMapRoadFullscreen]);

  // Bind Android Hardware / Gesture Back button (popstate) to minimize into floating bubble
  React.useEffect(() => {
    if (!isAuthenticated || isBubbleMinimized) return;
    try {
      window.history.pushState({ buddyCockpitOpen: true }, '');
    } catch {
      // ignore
    }
    const handlePopState = () => {
      setIsBubbleMinimized(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, isBubbleMinimized, setIsBubbleMinimized]);

  const [batteryBannerDismissed, setBatteryBannerDismissed] =
    React.useState<boolean>(false);
  const [rainTapCount, setRainTapCount] = React.useState<number>(0);
  const rainTapResetRef = React.useRef<number | null>(null);

  const handleRainCornerTap = () => {
    if (rainTapResetRef.current) {
      window.clearTimeout(rainTapResetRef.current);
    }
    const next = rainTapCount + 1;
    if (next >= 3) {
      setRainTapCount(0);
      setRainLockActive(false);
      return;
    }
    setRainTapCount(next);
    rainTapResetRef.current = window.setTimeout(() => {
      setRainTapCount(0);
    }, 1500);
  };

  const themeClass =
    themeMode === 'DAYLIGHT' ? 'theme-daylight' : 'theme-night';

  const isAuthorizedOrigin = React.useMemo(() => {
    if (typeof window === 'undefined') return true;
    const host = (window.location.hostname || '').toLowerCase();
    const winAny = window as unknown as {
      BuddyNativeOverlay?: {
        getAppPackageName?: () => string;
      };
    };
    const nativePkg =
      typeof winAny.BuddyNativeOverlay?.getAppPackageName === 'function'
        ? winAny.BuddyNativeOverlay.getAppPackageName()
        : '';
    if (
      nativePkg &&
      nativePkg !== 'com.pbg.deliverybuddy' &&
      nativePkg !== 'com.deliverybuddy.app'
    ) {
      return false;
    }
    const allowedHosts = [
      'iokmoreira.github.io',
      'localhost',
      '127.0.0.1',
      '',
    ];
    return allowedHosts.includes(host) || host.endsWith('.github.io');
  }, []);

  if (!isAuthorizedOrigin) {
    return (
      <div
        style={{ backgroundColor: '#05070B', color: '#FFFFFF' }}
        className="min-h-screen flex items-center justify-center p-6 text-center"
      >
        <div
          style={{
            backgroundColor: '#0B0F17',
            borderColor: '#00E5FF',
          }}
          className="max-w-sm w-full rounded-2xl border p-6 space-y-3"
        >
          <Shield className="h-8 w-8 text-[#00E5FF] mx-auto" />
          <h1 className="text-base font-extrabold text-white">
            Delivery Buddy — Proteção Anti-Clone Ativa
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Esta aplicação apenas pode ser executada no pacote oficial Android ou no domínio oficial Delivery Buddy.
          </p>
        </div>
      </div>
    );
  }

  const isChromeMascotUploadBridgeMode =
    typeof window !== 'undefined' &&
    window.location.search.includes('upload_mascot=1');

  if (isChromeMascotUploadBridgeMode) {
    return (
      <div id="app-audit-root" className="min-h-screen theme-night">
        <ChromeMascotGalleryBridgeView />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        id="app-audit-root"
        className={`min-h-screen ${themeClass}`}
      >
        <AuthAndVerificationGate />
      </div>
    );
  }

  const isAdminView =
    isFounderAdmin &&
    (viewMode === 'PAINEL_ADMIN' || activeTab === 'admin_backoffice');
  const isMapFullscreenCockpit = !isAdminView && activeTab === 'radar';

  return (
    <div
      id="app-audit-root"
      style={
        isBubbleMinimized
          ? {
              background: 'transparent',
              backgroundColor: 'transparent',
              pointerEvents: 'none',
            }
          : undefined
      }
      className={`${isMapFullscreenCockpit ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'} ${themeClass} transition-colors duration-200`}
    >
      {isBubbleMinimized && (
        <style>{`
          html, body, #root, #app-audit-root, .daylight-shell-backdrop {
            background: transparent !important;
            background-color: transparent !important;
            pointer-events: none !important;
            box-shadow: none !important;
            border: none !important;
          }
        `}</style>
      )}
      <div
        className={
          isBubbleMinimized
            ? 'w-full min-h-screen relative pointer-events-none'
            : isAdminView
              ? 'daylight-shell-backdrop max-w-4xl mx-auto min-h-screen flex flex-col relative'
              : isMapFullscreenCockpit
                ? 'daylight-shell-backdrop max-w-[440px] mx-auto h-[100dvh] overflow-hidden shadow-xl border-x border-slate-200/70 flex flex-col relative'
                : 'daylight-shell-backdrop max-w-[440px] mx-auto min-h-screen shadow-xl border-x border-slate-200/70 flex flex-col relative'
        }
      >
        {/* Module 1: Rain Lock ("Modo Chuva") Anti-Ghost-Touch Shield (Unlocked by 3 rapid taps) */}
        {rainLockActive && (
          <div
            style={{ backgroundColor: 'rgba(2, 6, 23, 0.45)', color: '#ffffff' }}
            className="fixed inset-0 z-[120] backdrop-blur-[1px] flex flex-col items-center justify-between p-5 select-none"
          >
            <div className="w-full flex items-center justify-between gap-2">
              <div
                style={{ backgroundColor: '#0c4a6e', color: '#e0f2fe' }}
                className="rounded-2xl border border-sky-400/60 px-3 py-2 text-xs font-extrabold shadow-lg"
              >
                🌧️ Modo Chuva Ativo • Ecrã Protegido contra Gotas de Água
              </div>
              <button
                type="button"
                onClick={handleRainCornerTap}
                style={{ backgroundColor: '#0284c7', color: '#ffffff' }}
                className="rounded-2xl border-2 border-white px-3.5 py-2.5 text-xs font-black shadow-xl cursor-pointer active:scale-95 transition whitespace-nowrap"
              >
                🔓 Desbloquear ({3 - rainTapCount}x)
              </button>
            </div>
            <div
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)', color: '#f8fafc' }}
              className="rounded-2xl border border-sky-500/50 px-4 py-2.5 text-center max-w-xs shadow-lg"
            >
              <p className="text-xs font-extrabold">
                Comandos de Voz &ldquo;Buddy...&rdquo; 100% Ativos
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Toque 3 vezes rápidas no botão superior direito para desbloquear o ecrã.
              </p>
            </div>
          </div>
        )}

        {/* Module 2: Passive Crash Detection 45-Second Auto-SOS Countdown Modal */}
        {crashCountdownSeconds !== null && (
          <div
            style={{ backgroundColor: 'rgba(69, 10, 10, 0.95)', color: '#ffffff' }}
            className="fixed inset-0 z-[130] flex items-center justify-center p-5"
          >
            <div
              style={{ backgroundColor: '#7f1d1d', color: '#ffffff' }}
              className="max-w-sm w-full rounded-3xl border-2 border-red-400 p-5 space-y-4 text-center shadow-2xl"
            >
              <span className="inline-block rounded-full bg-red-950 border border-red-400 px-3 py-1 text-xs font-extrabold uppercase tracking-wider">
                🚨 Deteção de Impacto / Queda na Via
              </span>
              <h2 className="text-xl font-black">
                A enviar SOS automático em {crashCountdownSeconds}s
              </h2>
              <p className="text-xs leading-relaxed opacity-95">
                Foi detetada uma desaceleração brusca. Se não cancelar, a sua localização GPS exata em Amarante será enviada a todos os estafetas num raio de 5 km.
              </p>
              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelCrashCountdown}
                  style={{ backgroundColor: '#00E5FF', color: '#05070B' }}
                  className="w-full rounded-2xl py-3.5 px-4 text-sm font-black cursor-pointer shadow-lg"
                >
                  ✓ ESTOU BEM — CANCELAR ALERTA
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cancelCrashCountdown();
                    triggerSosEmergencyBeacon('Acidente na Via');
                  }}
                  style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                  className="w-full rounded-2xl border border-white/50 py-2.5 px-4 text-xs font-extrabold cursor-pointer"
                >
                  🚨 Enviar SOS Imediatamente Agora
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Module 5: Unplugged Motorcycle Charger Alert Banner (Strictly Only When Battery <= User Threshold) */}
        {unpluggedChargerAlertActive &&
          batteryLevelPct <= userBatteryAlertThreshold &&
          !isBatteryCharging && (
            <div
              style={{ backgroundColor: '#78350f', color: '#fef3c7' }}
              className="sticky top-11 z-50 mx-3 mt-1.5 rounded-xl border border-amber-400 px-3 py-2 flex items-center justify-between gap-2 shadow-lg"
            >
              <span className="text-xs font-extrabold">
                ⚡ Bateria em {batteryLevelPct}% (≤{userBatteryAlertThreshold}%) • Carregador desligado!
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={snoozeUnpluggedChargerAlert}
                  style={{ backgroundColor: '#0B0F17', color: '#00E5FF', borderColor: '#00E5FF' }}
                  className="rounded-lg border px-2 py-1 text-[10px] font-black cursor-pointer"
                >
                  Adiar 30m
                </button>
                <button
                  type="button"
                  onClick={dismissUnpluggedChargerAlert}
                  style={{ backgroundColor: '#f59e0b', color: '#0f172a' }}
                  className="rounded-lg px-2.5 py-1 text-[10px] font-black cursor-pointer"
                >
                  ✕ OK
                </button>
              </div>
            </div>
          )}

        {batterySurvivalMode &&
          batteryLevelPct <= userBatteryAlertThreshold &&
          !isBatteryCharging &&
          !batteryBannerDismissed && (
            <div
              style={{
                backgroundColor: '#0B0F17',
                borderColor: '#00E5FF',
                color: '#00E5FF',
              }}
              className="mx-3 mt-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold flex items-center justify-between gap-2"
            >
              <span>
                🔋 Modo Sobrevivência Ativo ({batteryLevelPct}% ≤ {userBatteryAlertThreshold}%)
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span>OLED Eco</span>
                <button
                  type="button"
                  onClick={() => {
                    setBatteryBannerDismissed(true);
                    snoozeUnpluggedChargerAlert();
                    if (batterySurvivalMode) {
                      toggleBatterySurvivalMode();
                    }
                  }}
                  title="Fechar aviso de bateria"
                  className="rounded px-1.5 py-0.5 bg-emerald-950/80 hover:bg-emerald-800 text-emerald-100 font-black cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

        {/* Floating Bubble Mode (Micro-Logo 36x36px + ±45% Screen Ephemeral Voice Alert Pop-up) */}
        <FloatingBubbleAndQuickMenu />

        {/* Interactive Onboarding Manual (4 Steps) & Contextual "?" Help Sheet */}
        <InteractiveManualAndHelpDrawer />

        {/* Simultaneous Voice Translator & Libras ("Mãos do Buddy") Modal */}
        <TranslatorAndSignLanguageModal />

        {/* End-of-Delivery Summary with "Time-Saved vs. Risk" Reality Check Modal */}
        {deliveryRealitySummary && (
          <div
            style={{ backgroundColor: 'rgba(5, 7, 11, 0.86)' }}
            className="fixed inset-0 z-[140] backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div
              style={{
                backgroundColor:
                  themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#05070B',
                borderColor: '#00E5FF',
                color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                boxShadow: '0 16px 42px rgba(0, 229, 255, 0.25)',
              }}
              className="max-w-sm w-full rounded-3xl border-2 p-4 space-y-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    style={{
                      backgroundColor: '#05070B',
                      borderColor: '#00E5FF',
                      color: '#00E5FF',
                    }}
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
                  >
                    🏁 Resumo de Fim de Entrega • {deliveryRealitySummary.platform}
                  </span>
                  <h3 className="text-base font-black mt-1.5 leading-snug">
                    {deliveryRealitySummary.routeLabel}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDeliveryRealitySummary(null)}
                  style={{
                    backgroundColor:
                      themeMode === 'DAYLIGHT' ? '#F8FAFC' : '#0B0F17',
                    borderColor:
                      themeMode === 'DAYLIGHT'
                        ? '#CBD5E1'
                        : 'rgba(0, 229, 255, 0.35)',
                    color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                  }}
                  className="rounded-xl border px-2.5 py-1 text-xs font-black cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div
                  style={{
                    backgroundColor:
                      themeMode === 'DAYLIGHT' ? '#F8FAFC' : '#0B0F17',
                    borderColor: '#00E5FF',
                  }}
                  className="rounded-2xl border p-2.5"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                    Lucro Líquido
                  </p>
                  <p
                    style={{
                      color: themeMode === 'DAYLIGHT' ? '#0284C7' : '#00E5FF',
                    }}
                    className="text-lg font-black tabular-nums mt-0.5"
                  >
                    +{deliveryRealitySummary.netProfitEur.toFixed(2)} €
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor:
                      themeMode === 'DAYLIGHT' ? '#F8FAFC' : '#0B0F17',
                    borderColor:
                      themeMode === 'DAYLIGHT'
                        ? '#CBD5E1'
                        : 'rgba(0, 229, 255, 0.35)',
                  }}
                  className="rounded-2xl border p-2.5"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                    Distância Real
                  </p>
                  <p className="text-lg font-black tabular-nums mt-0.5">
                    {deliveryRealitySummary.distanceKm.toFixed(1)} km
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor:
                      themeMode === 'DAYLIGHT' ? '#F8FAFC' : '#0B0F17',
                    borderColor:
                      themeMode === 'DAYLIGHT'
                        ? '#CBD5E1'
                        : 'rgba(0, 229, 255, 0.35)',
                  }}
                  className="rounded-2xl border p-2.5"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                    Velocidade Média
                  </p>
                  <p className="text-base font-black tabular-nums mt-0.5">
                    {deliveryRealitySummary.avgSpeedKmh} km/h
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor:
                      themeMode === 'DAYLIGHT' ? '#F8FAFC' : '#0B0F17',
                    borderColor:
                      themeMode === 'DAYLIGHT'
                        ? '#CBD5E1'
                        : 'rgba(0, 229, 255, 0.35)',
                  }}
                  className="rounded-2xl border p-2.5"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                    Velocidade Máxima
                  </p>
                  <p className="text-base font-black tabular-nums mt-0.5">
                    {deliveryRealitySummary.maxSpeedKmh} km/h{' '}
                    <span className="text-[10px] font-bold opacity-70">
                      (Lim. {deliveryRealitySummary.predominantLimitKmh})
                    </span>
                  </p>
                </div>
              </div>

              {/* Comparativo Real de Tempo Ganho (Δt = d * (1/v_segura - 1/v_real)) */}
              <div
                style={{
                  backgroundColor:
                    themeMode === 'DAYLIGHT' ? '#F0F9FF' : '#0B0F17',
                  borderColor: '#00E5FF',
                }}
                className="rounded-2xl border-2 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    style={{
                      color: themeMode === 'DAYLIGHT' ? '#0284C7' : '#00E5FF',
                    }}
                    className="text-[11px] font-black uppercase tracking-wider"
                  >
                    {deliveryRealitySummary.didExceedSpeedLimit
                      ? `⚡ Tempo Ganho Acima do Limite: +${deliveryRealitySummary.secondsSavedBySpeeding}s`
                      : '🛡️ Condução 100% Segura Dentro do Limite'}
                  </span>
                  <span className="text-[10px] font-extrabold opacity-75">
                    Δt Real
                  </span>
                </div>
                <p className="text-xs font-bold leading-relaxed">
                  &ldquo;{deliveryRealitySummary.spokenMessagePt}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    speakTextPt(deliveryRealitySummary.spokenMessagePt)
                  }
                  style={{
                    backgroundColor:
                      themeMode === 'DAYLIGHT' ? '#F8FAFC' : '#0B0F17',
                    borderColor: '#00E5FF',
                    color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                  }}
                  className="rounded-2xl border py-2.5 px-3 text-xs font-black cursor-pointer transition hover:opacity-95"
                >
                  🔊 Ouvir Resumo
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryRealitySummary(null)}
                  style={{
                    backgroundColor: '#00E5FF',
                    color: '#05070B',
                  }}
                  className="rounded-2xl py-2.5 px-3 text-xs font-black cursor-pointer shadow-md transition hover:opacity-95"
                >
                  ✓ Continuar Turno
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Safe Disconnect & Pre-Logout Full Data Sweep Modal */}
        {isLogoutSweepModalOpen && (
          <div className="fixed inset-0 z-[290] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-5">
            <div
              style={{
                backgroundColor:
                  themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#05070B',
                borderColor: '#00E5FF',
                color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                boxShadow: '0 24px 60px rgba(0, 229, 255, 0.25)',
              }}
              className="w-full max-w-md rounded-3xl border-2 p-6 space-y-4 text-center"
            >
              <div className="mx-auto h-14 w-14 rounded-2xl bg-[#00E5FF]/15 border border-[#00E5FF] flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                {logoutSweepCompleted ? '✅' : '🔄'}
              </div>
              <h3
                style={{
                  color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                }}
                className="text-base font-black tracking-tight"
              >
                {logoutSweepCompleted
                  ? '✓ Todos os dados salvos com segurança!'
                  : '🔄 A Guardar Dados do Turno na Nuvem...'}
              </h3>
              <p
                style={{
                  color: themeMode === 'DAYLIGHT' ? '#334155' : '#CBD5E1',
                }}
                className="text-xs font-semibold leading-relaxed"
              >
                A recolher quilometragem, entregas, finanças, passadeiras
                ensinadas e ajustes para salvar nos bancos de dados... Aguarde 2
                segundos para desconectar em segurança.
              </p>

              {/* Neon-Blue Animated Progress Bar (0% -> 100%) */}
              <div className="space-y-1.5 pt-1">
                <div className="w-full h-3 rounded-full bg-slate-800/80 border border-[#00E5FF]/40 overflow-hidden p-0.5">
                  <div
                    style={{
                      width: `${Math.max(5, Math.min(100, logoutSweepProgressPct))}%`,
                      backgroundColor: '#00E5FF',
                      boxShadow: '0 0 14px rgba(0, 229, 255, 0.85)',
                    }}
                    className="h-full rounded-full transition-all duration-100"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-black text-[#00E5FF]">
                  <span>
                    {logoutSweepCompleted
                      ? '✓ Sincronização Cloud + Cofre Local Concluída'
                      : 'A transmitir pacote OFFLINE + Cofre de Turno...'}
                  </span>
                  <span>{logoutSweepProgressPct}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Application UI (Hidden when minimized into Micro-Logo Mode) */}
        {!isBubbleMinimized && (
          <>
            {isAdminView ? (
              <header
                style={{
                  backgroundColor:
                    themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#05070B',
                  borderColor:
                    themeMode === 'DAYLIGHT'
                      ? '#E2E8F0'
                      : 'rgba(0, 229, 255, 0.25)',
                  color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                }}
                className="sticky top-0 z-40 min-h-16 pt-4 mt-1 pb-2.5 border-b px-4 flex items-center justify-between gap-2 flex-wrap shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      backgroundColor: '#0B0F17',
                      border: '1.5px solid #00E5FF',
                    }}
                    className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,229,255,0.2)]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <line
                        x1="12"
                        y1="2"
                        x2="12"
                        y2="5"
                        stroke="#00E5FF"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle cx="12" cy="1.8" r="1.4" fill="#00E5FF" />
                      <rect
                        x="3.5"
                        y="5"
                        width="17"
                        height="13.5"
                        rx="6.75"
                        fill="#0B0F17"
                        stroke="#00E5FF"
                        strokeWidth="1.8"
                      />
                      <rect
                        x="6.2"
                        y="8"
                        width="11.6"
                        height="6.8"
                        rx="3.4"
                        fill="#05070B"
                        stroke="#00E5FF"
                        strokeWidth="1.2"
                      />
                      <circle cx="9.6" cy="11.4" r="1.4" fill="#00E5FF" />
                      <circle cx="14.4" cy="11.4" r="1.4" fill="#00E5FF" />
                    </svg>
                  </span>
                  <span
                    style={{
                      color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                    }}
                    className="text-base font-extrabold tracking-tight"
                  >
                    Painel de Administrador
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOfficialManualModalOpen(true)}
                    style={{
                      backgroundColor:
                        themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#0B0F17',
                      borderColor:
                        themeMode === 'DAYLIGHT'
                          ? '#CBD5E1'
                          : 'rgba(0, 229, 255, 0.35)',
                      color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                    }}
                    className="rounded-xl border px-3 py-1.5 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition hover:border-[#00E5FF]"
                  >
                    <span>📘 Manual &amp; Dossiê Legal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('MODO_ESTAFETA');
                      setActiveTab('scanner');
                    }}
                    style={{
                      backgroundColor: '#0B0F17',
                      borderColor: '#00E5FF',
                      color: '#00E5FF',
                    }}
                    className="rounded-xl border px-3.5 py-1.5 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition hover:opacity-95"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Voltar à App</span>
                  </button>
                </div>
              </header>
            ) : (
              !(isMapFullscreenCockpit && isMapRoadFullscreen) && (
                <CockpitHeader />
              )
            )}

            <main
              className={
                isMapFullscreenCockpit
                  ? isMapRoadFullscreen
                    ? 'flex-1 w-full p-0 overflow-hidden flex flex-col'
                    : 'flex-1 w-full px-1.5 pt-1 pb-[68px] overflow-hidden flex flex-col'
                  : 'flex-1 w-full px-3.5 pt-2.5 pb-24'
              }
            >
              {isAdminView ? (
                <AdminBackofficeModule />
              ) : (
                <>
                  {activeTab === 'scanner' && <ScannerAndSplitModule />}
                  {activeTab === 'walkietalkie' && <WalkieTalkieAndSosModule />}
                  {activeTab === 'radar' && <ShiftRadarModule />}
                  {activeTab === 'financas' && <FinanceGoalsAndRewardsModule />}
                  {activeTab === 'menu_mais' && <MenuMaisHubView />}
                  {activeTab === 'voz_suporte' && (
                    <VoiceCopilotAndSupportMacrosModule />
                  )}
                  {activeTab === 'reclamacoes' && (
                    <ComplaintsAndRouteTrapsModule />
                  )}
                  {activeTab === 'calculadora' && <CalculatorAndCostsModule />}
                </>
              )}
            </main>

            {/* Clean 5-Item Bottom Navigation Bar */}
            {!(isMapFullscreenCockpit && isMapRoadFullscreen) && (
              <CockpitNavigation />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export function App() {
  return (
    <CockpitErrorBoundary>
      <EstafetasProvider>
        <AppCockpitShell />
      </EstafetasProvider>
    </CockpitErrorBoundary>
  );
}

export default App;
