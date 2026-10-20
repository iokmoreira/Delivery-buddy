import React from 'react';
import { useEstafetas } from '../context/EstafetasContext';

export const CockpitHeader: React.FC = () => {
  const {
    isAppPaused,
    toggleAppPauseMode,
    themeMode,
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
      className={`sticky top-0 z-40 backdrop-blur-md border-b px-3.5 py-2.5 transition-colors ${
        isDaylight
          ? 'bg-white/95 border-slate-200/80 text-slate-900 shadow-2xs'
          : 'bg-slate-900/95 border-slate-800 text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left: Dynamic 3-State Robot Mascot Logo + Delivery Buddy Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`relative h-9 w-9 rounded-full overflow-hidden bg-slate-950 border-2 shrink-0 transition-all ${mascotRingClass}`}
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

          <span className="text-base font-black tracking-tight whitespace-nowrap">
            Delivery Buddy
          </span>
        </div>

        {/* Right: Compact Status Badge (🟢 Online / ⚪ Pausa / 🚀 Em Entrega) */}
        <button
          type="button"
          onClick={toggleAppPauseMode}
          title="Toque para alternar entre Online e Pausa"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold cursor-pointer transition shrink-0 whitespace-nowrap ${
            currentMascotState === 'DELIVERY'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-400/60'
              : isDaylight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
          }`}
        >
          <span>
            {currentMascotState === 'DELIVERY'
              ? '🚀 Em Entrega'
              : isAppPaused
                ? '⚪ Pausa'
                : '🟢 Online'}
          </span>
        </button>
      </div>
    </header>
  );
};
