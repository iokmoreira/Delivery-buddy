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

        {/* Right: Sleek Dark Slate & Light Neon Blue Admin Capsule (No Crown, Tech Buddy HUD Icon) */}
        <button
          type="button"
          onClick={() => {
            setViewMode('PAINEL_ADMIN');
            setActiveTab('admin_backoffice');
          }}
          style={{
            backgroundColor: '#0F172A',
            border: '1.5px solid #00E5FF',
            color: '#00E5FF',
            boxShadow: '0 2px 10px rgba(0, 229, 255, 0.2)',
          }}
          className="rounded-full px-3 py-1.5 text-sm font-extrabold flex items-center gap-1.5 cursor-pointer transition hover:brightness-110 active:scale-95 shrink-0"
          title="Abrir Painel de Administrador (CEO Dashboard)"
        >
          {/* Mini Buddy Admin Avatar Icon (Robot Head/Visor + Glowing #00E5FF Tech HUD Badge) */}
          <span
            style={{
              backgroundColor: 'rgba(0, 229, 255, 0.14)',
              border: '1px solid rgba(0, 229, 255, 0.45)',
            }}
            className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Antenna */}
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
              {/* Buddy Helmet Shell */}
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
              {/* Dark Visor */}
              <rect
                x="6.5"
                y="8"
                width="11"
                height="6.5"
                rx="3.2"
                fill="#0F172A"
              />
              {/* Glowing Neon Blue Eyes + HUD */}
              <circle cx="9.6" cy="11.2" r="1.3" fill="#00E5FF" />
              <circle cx="14.4" cy="11.2" r="1.3" fill="#00E5FF" />
              <path
                d="M10.5 13.2H13.5"
                stroke="#00E5FF"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="tracking-tight text-[#00E5FF]">Admin</span>
        </button>
      </div>
    </header>
  );
};
