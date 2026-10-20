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
    batterySurvivalMode,
    batteryLevelPct,
    isBatteryCharging,
    toggleBatterySurvivalMode,
  } = useEstafetas();

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
    viewMode === 'PAINEL_ADMIN' || activeTab === 'admin_backoffice';
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
                  style={{ backgroundColor: '#10b981', color: '#022c22' }}
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

        {/* Module 5: Unplugged Motorcycle Charger Alert Banner */}
        {unpluggedChargerAlertActive && (
          <div
            style={{ backgroundColor: '#78350f', color: '#fef3c7' }}
            className="sticky top-11 z-50 mx-3 mt-1.5 rounded-xl border border-amber-400 px-3 py-2 flex items-center justify-between gap-2 shadow-lg"
          >
            <span className="text-xs font-extrabold">
              ⚡ Atenção: Carregador desligado no suporte da mota!
            </span>
            <button
              type="button"
              onClick={dismissUnpluggedChargerAlert}
              style={{ backgroundColor: '#f59e0b', color: '#0f172a' }}
              className="rounded-lg px-2.5 py-1 text-[10px] font-black cursor-pointer shrink-0"
            >
              OK
            </button>
          </div>
        )}

        {batterySurvivalMode &&
          batteryLevelPct < 15 &&
          !isBatteryCharging &&
          !batteryBannerDismissed && (
            <div
              style={{ backgroundColor: '#064e3b', color: '#ecfdf5' }}
              className="mx-3 mt-1 rounded-lg px-2.5 py-1 text-[10px] font-bold flex items-center justify-between gap-2"
            >
              <span>
                🔋 Modo Sobrevivência de Bateria Ativo ({batteryLevelPct}% • Poupança Extrema)
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="">OLED Eco</span>
                <button
                  type="button"
                  onClick={() => {
                    setBatteryBannerDismissed(true);
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

        {/* Main Application UI (Hidden when minimized into Micro-Logo Mode) */}
        {!isBubbleMinimized && (
          <>
            {isAdminView ? (
              <header className="sticky top-0 z-40 min-h-14 py-2.5 bg-zinc-950/95 border-b border-slate-200 px-4 flex items-center justify-between gap-2 flex-wrap shadow-xs">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      backgroundColor: '#0F172A',
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
                        x="4"
                        y="5"
                        width="16"
                        height="13"
                        rx="6.5"
                        fill="#F8FAFC"
                        stroke="#00E5FF"
                        strokeWidth="1.6"
                      />
                      <rect
                        x="6.5"
                        y="8"
                        width="11"
                        height="6.5"
                        rx="3.2"
                        fill="#0F172A"
                      />
                      <circle cx="9.6" cy="11.2" r="1.3" fill="#00E5FF" />
                      <circle cx="14.4" cy="11.2" r="1.3" fill="#00E5FF" />
                    </svg>
                  </span>
                  <span
                    style={{ color: '#0F172A' }}
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
                      backgroundColor: '#F8FAFC',
                      borderColor: '#CBD5E1',
                      color: '#0F172A',
                    }}
                    className="rounded-xl border px-3 py-1.5 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition hover:border-[#00E5FF]"
                  >
                    <span>📘 Manual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('MODO_ESTAFETA');
                      setActiveTab('scanner');
                    }}
                    style={{
                      backgroundColor: '#0F172A',
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
              <CockpitHeader />
            )}

            <main
              className={
                isMapFullscreenCockpit
                  ? 'flex-1 w-full px-1.5 pt-1 pb-14 overflow-hidden flex flex-col'
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
            <CockpitNavigation />
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
