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

  const statusDotClass = isAnonymous
    ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
    : currentMascotState === 'DELIVERY'
      ? 'bg-[#00E5FF] animate-ping shadow-[0_0_10px_rgba(0,229,255,0.95)]'
      : isAppPaused
        ? 'bg-slate-400'
        : 'bg-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.85)]';

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md border-b px-3.5 py-1.5 transition-colors ${
        isDaylight
          ? 'bg-white/95 border-slate-200/80 text-slate-900 shadow-2xs'
          : 'bg-slate-900/95 border-slate-800 text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left: Clickable 3-State Transparent 3D Robot Mascot (52px) + Delivery Buddy Title with 8px Status Dot */}
        <button
          type="button"
          onClick={handleCycleHeaderStatus}
          title="Toque para alternar estado: Online → Pausa → Anónimo"
          className="flex items-center gap-2 min-w-0 text-left cursor-pointer group bg-transparent border-0 p-0"
        >
          <div className="relative h-[52px] w-[52px] shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
            <img
              src={currentMascotImageUrl}
              alt="Buddy Mascote"
              className="h-full w-full object-contain select-none pointer-events-none"
            />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg font-extrabold tracking-tight whitespace-nowrap">
              Delivery Buddy
            </span>
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${statusDotClass}`}
            />
          </div>
        </button>

        {/* Right: Compact Executive Admin Button */}
        <button
          type="button"
          onClick={() => {
            setViewMode('PAINEL_ADMIN');
            setActiveTab('admin_backoffice');
          }}
          style={{
            backgroundColor: 'rgba(0, 229, 255, 0.14)',
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
