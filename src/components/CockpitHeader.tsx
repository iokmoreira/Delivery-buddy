import React from 'react';
import { useEstafetas } from '../context/EstafetasContext';

export const CockpitHeader: React.FC = () => {
  const {
    isAppPaused,
    toggleAppPauseMode,
    userPrefs,
    toggleAnonymousMode,
    themeMode,
    currentMascotState,
    currentMascotImageUrl,
    setViewMode,
    setActiveTab,
  } = useEstafetas();

  const isDaylight = themeMode === 'DAYLIGHT';
  const isAnonymous = Boolean(userPrefs?.anonymousMode);

  // Cycle: 🟢 Online -> ⚪ Pausa -> 🥷 Anónimo -> 🟢 Online
  const handleCycleHeaderStatus = () => {
    if (!isAppPaused && !isAnonymous) {
      // Online -> Pausa
      toggleAppPauseMode();
    } else if (isAppPaused) {
      // Pausa -> Anónimo
      toggleAppPauseMode();
      if (!isAnonymous) {
        toggleAnonymousMode();
      }
    } else {
      // Anónimo -> Online
      toggleAnonymousMode();
    }
  };

  const mascotRingClass = isAnonymous
    ? 'border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.65)]'
    : currentMascotState === 'DELIVERY'
      ? 'border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.75)]'
      : currentMascotState === 'INACTIVE'
        ? 'border-slate-500 opacity-90'
        : 'border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.55)]';

  const statusDotClass = isAnonymous
    ? 'bg-purple-400'
    : currentMascotState === 'DELIVERY'
      ? 'bg-amber-400 animate-ping'
      : isAppPaused
        ? 'bg-slate-400'
        : 'bg-emerald-400';

  const statusTextLabel = isAnonymous
    ? '🥷 Anónimo'
    : currentMascotState === 'DELIVERY'
      ? '🚀 Em Entrega'
      : isAppPaused
        ? '⚪ Pausa'
        : '🟢 Online';

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md border-b px-3.5 py-2 transition-colors ${
        isDaylight
          ? 'bg-white/95 border-slate-200/80 text-slate-900 shadow-2xs'
          : 'bg-slate-900/95 border-slate-800 text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left: Clickable 3-State Robot Mascot Logo + Delivery Buddy Title with Integrated Status */}
        <button
          type="button"
          onClick={handleCycleHeaderStatus}
          title="Toque para alternar estado: Online → Pausa → Anónimo"
          className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group bg-transparent border-0 p-0"
        >
          <div
            className={`relative h-11 w-11 rounded-full overflow-hidden bg-[#090e13] border-2 shrink-0 transition-all p-0.5 ${mascotRingClass}`}
          >
            <img
              src={currentMascotImageUrl}
              alt="Buddy Mascote"
              className="h-full w-full object-contain rounded-full"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight whitespace-nowrap">
                Delivery Buddy
              </span>
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusDotClass}`}
              />
            </div>
            <span className="text-xs font-bold text-emerald-400 block leading-tight">
              {statusTextLabel} • Toque p/ mudar
            </span>
          </div>
        </button>

        {/* Right: Compact Executive Admin Button (No duplicate Online button!) */}
        <button
          type="button"
          onClick={() => {
            setViewMode('PAINEL_ADMIN');
            setActiveTab('admin_backoffice');
          }}
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.14)',
            borderColor: 'rgba(251, 191, 36, 0.55)',
            color: '#fde68a',
          }}
          className="rounded-xl border px-3 py-1.5 text-sm font-extrabold flex items-center gap-1.5 cursor-pointer transition hover:opacity-95 shrink-0 shadow-sm"
          title="Abrir Painel de Administrador (CEO Dashboard)"
        >
          <span>👑 Admin</span>
        </button>
      </div>
    </header>
  );
};
