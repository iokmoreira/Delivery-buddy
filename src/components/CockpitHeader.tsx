import React from 'react';
import { useEstafetas } from '../context/EstafetasContext';

export const CockpitHeader: React.FC = () => {
  const {
    isAppPaused,
    toggleAppPauseMode,
    themeMode,
    toggleVoiceMicListening,
    isListeningSpeechRecognition,
    setIsBubbleMinimized,
    currentMascotState,
    currentMascotImageUrl,
  } = useEstafetas();

  const isDaylight = themeMode === 'DAYLIGHT';

  const mascotRingClass =
    currentMascotState === 'DELIVERY'
      ? 'border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.75)]'
      : currentMascotState === 'INACTIVE'
        ? 'border-slate-500 opacity-90'
        : 'border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.55)]';

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md border-b px-3 py-2.5 transition-colors ${
        isDaylight
          ? 'bg-white/95 border-slate-200/80 text-slate-900 shadow-2xs'
          : 'bg-slate-900/95 border-slate-800 text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* 1. Left: Dynamic 3-State Robot Mascot Badge + Brand + Status Indicator (🟢 Online / ⚪ Pausa) */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`relative h-8 w-8 rounded-full overflow-hidden bg-slate-950 border-2 shrink-0 transition-all ${mascotRingClass}`}
            title={
              currentMascotState === 'DELIVERY'
                ? 'Buddy Mascote: Em Entrega 🚀'
                : currentMascotState === 'INACTIVE'
                  ? 'Buddy Mascote: Em Pausa (Mochila DB)'
                  : 'Buddy Mascote: Online Ativo 👍'
            }
          >
            <img
              src={currentMascotImageUrl}
              alt="Buddy Mascote"
              className="h-full w-full object-cover rounded-full"
            />
          </div>

          <span className="text-sm font-black tracking-tight whitespace-nowrap">
            Delivery Buddy
          </span>

          <button
            type="button"
            onClick={toggleAppPauseMode}
            title="Toque para alternar entre Online e Pausa"
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold cursor-pointer transition shrink-0 whitespace-nowrap ${
              isDaylight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
            }`}
          >
            <span>
              {currentMascotState === 'DELIVERY'
                ? '🚀 Entrega'
                : isAppPaused
                  ? '⚪ Pausa'
                  : '🟢 Online'}
            </span>
          </button>
        </div>

        {/* 2 & 3. Center/Right: ↙️ Minimizar + 🎙️ Falar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsBubbleMinimized(true)}
            title="Minimizar para Bolha Flutuante DB (1 Toque)"
            aria-label="Minimizar Delivery Buddy"
            className={`h-8 rounded-xl px-3 flex items-center justify-center text-xs font-extrabold cursor-pointer transition border whitespace-nowrap ${
              isDaylight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
            }`}
          >
            <span>↙️ Minimizar</span>
          </button>

          <button
            type="button"
            onClick={toggleVoiceMicListening}
            title={
              isListeningSpeechRecognition
                ? 'Ouvindo comando de voz — Toque para parar'
                : 'Toque para falar comando de voz'
            }
            aria-label="Ativar Comando de Voz"
            className={`h-8 rounded-xl px-3.5 flex items-center justify-center text-xs font-extrabold cursor-pointer transition border whitespace-nowrap ${
              isListeningSpeechRecognition
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.75)] animate-pulse'
                : isDaylight
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-xs'
            }`}
          >
            <span>
              {isListeningSpeechRecognition ? '🟢 Ouvindo...' : '🎙️ Falar'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
