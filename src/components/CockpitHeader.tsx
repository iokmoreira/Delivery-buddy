import React from 'react';
import { useEstafetas } from '../context/EstafetasContext';
import { isCourierAdminByName } from '../services/cloudSync';
import { BUDDY_AVATARS, requestBuddyLaunchReplay } from '../utils/buddyAvatars';

export const CockpitHeader: React.FC = () => {
  const {
    isAppPaused,
    toggleAppPauseMode,
    userPrefs,
    toggleAnonymousMode,
    themeMode,
    currentMascotState,
    setViewMode,
    setActiveTab,
    realCourierProfile,
    verifiedAccount,
  } = useEstafetas();

  const isDaylight = themeMode === 'DAYLIGHT';
  const isAnonymous = Boolean(userPrefs?.anonymousMode);
  const activeCourierName =
    realCourierProfile?.name?.trim() ||
    verifiedAccount?.courierName?.trim() ||
    '';
  const isFounderAdmin = isCourierAdminByName(activeCourierName);

  // Cycle: Online -> Ausente (Pausa) -> Modo Ninja (Anónimo) -> Online
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
    ? 'bg-[#0F172A] ring-1 ring-[#00E5FF]'
    : currentMascotState === 'DELIVERY'
      ? 'bg-[#00E5FF] animate-ping shadow-[0_0_10px_rgba(0,229,255,0.95)]'
      : isAppPaused
        ? 'bg-slate-400'
        : 'bg-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.85)]';

  return (
    <header
      style={{
        backgroundColor: isDaylight ? '#FFFFFF' : '#05070B',
        borderColor: isDaylight ? '#E2E8F0' : 'rgba(0, 229, 255, 0.25)',
        color: isDaylight ? '#090D16' : '#FFFFFF',
      }}
      className="sticky top-0 z-40 backdrop-blur-md border-b px-3.5 py-1.5 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left: Tappable 3D Buddy brand icon (replays the Jetpack Launch animation) + Delivery Buddy title (tap cycles status) */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={requestBuddyLaunchReplay}
            title="Toque no Buddy para ver a animação de lançamento"
            aria-label="Rever animação de lançamento do Buddy"
            className="relative h-[46px] w-[46px] shrink-0 rounded-full overflow-hidden bg-black ring-[1.5px] ring-[#00E5FF]/60 shadow-[0_0_10px_rgba(0,229,255,0.35)] cursor-pointer transition-transform hover:scale-105 active:scale-95 border-0 p-0"
          >
            <img
              src={BUDDY_AVATARS.flying}
              alt="Buddy Mascote"
              className="h-full w-full object-cover scale-110 select-none pointer-events-none"
            />
          </button>

          <button
            type="button"
            onClick={handleCycleHeaderStatus}
            title="Toque para alternar estado: Online → Ausente → Modo Ninja"
            style={{
              backgroundColor: 'transparent',
              color: isDaylight ? '#090D16' : '#FFFFFF',
            }}
            className="flex items-center gap-2 min-w-0 text-left cursor-pointer border-0 p-0"
          >
            <span
              style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
              className="text-lg font-extrabold tracking-tight whitespace-nowrap"
            >
              Delivery Buddy
            </span>
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${statusDotClass}`}
            />
          </button>
        </div>

        {/* Right: Sleek Obsidian Black & Light Neon Blue Admin Capsule — STRICTLY restricted to Founder ('Presidente') */}
        {isFounderAdmin && (
          <button
            type="button"
            onClick={() => {
              setViewMode('PAINEL_ADMIN');
              setActiveTab('admin_backoffice');
            }}
            style={{
              backgroundColor: '#0B0F17',
              border: '1.5px solid #00E5FF',
              color: '#00E5FF',
              boxShadow: '0 2px 10px rgba(0, 229, 255, 0.22)',
            }}
            className="rounded-full px-3 py-1.5 text-sm font-extrabold flex items-center gap-1.5 cursor-pointer transition hover:brightness-110 active:scale-95 shrink-0"
            title="Abrir Painel de Administrador (CEO Dashboard)"
          >
            {/* Mini Buddy Admin Avatar Icon (Robot Head/Visor in Light Neon Blue #00E5FF) */}
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
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
              <circle cx="12" cy="1.8" r="1.5" fill="#00E5FF" />
              {/* Buddy Helmet Shell */}
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
              {/* Dark Visor */}
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
              {/* Glowing Neon Blue Eyes */}
              <circle cx="9.6" cy="11.4" r="1.4" fill="#00E5FF" />
              <circle cx="14.4" cy="11.4" r="1.4" fill="#00E5FF" />
            </svg>
            <span
              style={{ color: '#00E5FF' }}
              className="tracking-tight font-extrabold"
            >
              Admin
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
