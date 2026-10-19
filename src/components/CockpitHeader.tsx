import React from 'react';
import { Sun, Moon, Mic, BookOpen } from 'lucide-react';
import { useEstafetas } from '../context/EstafetasContext';

export const CockpitHeader: React.FC = () => {
  const {
    isAppPaused,
    userOrderAvailabilityStatus,
    toggleUserOrderAvailabilityStatus,
    themeMode,
    toggleThemeMode,
    voiceActivationConfig,
    toggleVoiceMicListening,
    isListeningSpeechRecognition,
    wakeLockEnabled,
    toggleWakeLock,
    rainLockActive,
    toggleRainLock,
    setIsOfficialManualModalOpen,
    setIsBubbleMinimized,
  } = useEstafetas();

  const isAvailable = userOrderAvailabilityStatus === 'DISPONIVEL';
  const isDaylight = themeMode === 'DAYLIGHT';
  const triggerWordLabel =
    voiceActivationConfig.customTriggerWord?.trim() || 'Buddy';

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md border-b px-2.5 py-2 transition-colors ${
        isDaylight
          ? 'bg-white/95 border-slate-200/80 text-slate-900 shadow-2xs'
          : 'bg-slate-900/95 border-slate-800 text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        {/* Left: Brand Name + Compact Status Pill */}
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-xs sm:text-sm font-extrabold tracking-tight truncate">
            Delivery Buddy
          </span>

          <button
            type="button"
            onClick={toggleUserOrderAvailabilityStatus}
            title="Toque para alternar entre Disponível (Livre) e Ocupado (Com Pedido)"
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-[10px] font-bold cursor-pointer transition shrink-0 whitespace-nowrap ${
              isDaylight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isAppPaused
                  ? 'bg-slate-400'
                  : isAvailable
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
              }`}
            />
            <span>
              {isAppPaused
                ? 'Pausa'
                : isAvailable
                  ? 'Disponível'
                  : 'Ocupado'}
            </span>
          </button>
        </div>

        {/* Right: Minimizar + WakeLock + Rain Lock + Trigger Word + Manual + Theme Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsBubbleMinimized(true)}
            title="Minimizar para Modo Bolha / Invisível (1 Toque)"
            aria-label="Minimizar Delivery Buddy"
            className={`h-7 rounded-lg px-1.5 flex items-center gap-0.5 text-[10px] font-extrabold cursor-pointer transition border whitespace-nowrap ${
              isDaylight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <span>↙️ Minimizar</span>
          </button>

          <button
            type="button"
            onClick={toggleWakeLock}
            title={`Manter Ecrã Ligado na Mota: ${wakeLockEnabled ? 'ON (WakeLock Ativo)' : 'OFF'}`}
            className={`h-7 rounded-lg px-1.5 flex items-center gap-0.5 text-[10px] font-extrabold cursor-pointer transition border whitespace-nowrap ${
              wakeLockEnabled
                ? isDaylight
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                : isDaylight
                  ? 'bg-slate-100 text-slate-500 border-slate-200'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span>🔒 Ecrã</span>
          </button>

          <button
            type="button"
            onClick={toggleRainLock}
            title="Modo Chuva / Proteção Anti-Gotas no Ecrã (Desbloqueio por 3 toques rápidos)"
            className={`h-7 rounded-lg px-1.5 flex items-center gap-1 text-[10px] font-extrabold cursor-pointer transition border whitespace-nowrap ${
              rainLockActive
                ? 'bg-sky-600 text-white border-sky-400'
                : isDaylight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>🌧️</span>
          </button>

          <button
            type="button"
            onClick={toggleVoiceMicListening}
            title={
              isListeningSpeechRecognition
                ? `🎙️ Microfone Aberto (Escutando "${triggerWordLabel}...") — Toque para Pausar`
                : `🎙️ Ativar Microfone Contínuo ("${triggerWordLabel}...")`
            }
            aria-label="Alternar Microfone Contínuo Buddy"
            className={`h-7 rounded-lg px-1.5 flex items-center gap-1 text-[10px] font-bold cursor-pointer transition border whitespace-nowrap ${
              isListeningSpeechRecognition
                ? 'bg-emerald-500 text-white border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                : isDaylight
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border-emerald-800/80'
            }`}
          >
            <Mic className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[54px]">
              &ldquo;{triggerWordLabel}&rdquo;
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsOfficialManualModalOpen(true)}
            title="📘 Manual de Uso & Lista de Comandos"
            aria-label="Abrir Manual de Uso e Lista de Comandos"
            className={`h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer transition ${
              isDaylight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleThemeMode}
            title={
              isDaylight
                ? 'Mudar para Modo Escuro Suave (Noite)'
                : 'Mudar para Modo Claro Solar (Dia)'
            }
            aria-label="Alternar Modo Dia / Noite"
            className={`h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer transition ${
              isDaylight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isDaylight ? (
              <Moon className="h-3.5 w-3.5" />
            ) : (
              <Sun className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
