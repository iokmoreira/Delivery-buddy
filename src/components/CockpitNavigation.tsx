import React, { useEffect, useState } from 'react';
import {
  ScanLine,
  MapPinned,
  Wallet,
  SlidersHorizontal,
} from 'lucide-react';
import { AppTabId } from '../types/models';
import { useEstafetas } from '../context/EstafetasContext';
import { playBuddyOpenChime } from '../services/voiceEngine';

const CURRENT_OTA_BUILD_VERSION = 'v3.0.0-login-voice-intro';
const LAST_SEEN_OTA_BUILD_KEY = 'buddy_last_seen_ota_build_v1';
const PENDING_OTA_TOAST_KEY = 'buddy_pending_ota_toast_v1';

export const CockpitNavigation: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    viewMode,
    setCourierWorkspaceSection,
    themeMode,
    currentMascotState,
    currentMascotImageUrl,
    userPrefs,
  } = useEstafetas();

  const [showOtaUpdatedPopup, setShowOtaUpdatedPopup] = useState(false);

  useEffect(() => {
    let timerId: number | undefined;

    const triggerPopup = () => {
      setShowOtaUpdatedPopup(true);
      playBuddyOpenChime();
      if (timerId) window.clearTimeout(timerId);
      timerId = window.setTimeout(() => {
        setShowOtaUpdatedPopup(false);
      }, 5500);
    };

    try {
      const hasOtaQuery = window.location.search.includes('ota_ts=');
      const hasPendingFlag =
        window.localStorage.getItem(PENDING_OTA_TOAST_KEY) === '1';
      const lastSeenBuild = window.localStorage.getItem(
        LAST_SEEN_OTA_BUILD_KEY
      );
      const isNewBuild = lastSeenBuild !== CURRENT_OTA_BUILD_VERSION;

      if (hasOtaQuery || hasPendingFlag || isNewBuild) {
        window.localStorage.setItem(
          LAST_SEEN_OTA_BUILD_KEY,
          CURRENT_OTA_BUILD_VERSION
        );
        window.localStorage.removeItem(PENDING_OTA_TOAST_KEY);
        triggerPopup();
      }
    } catch {
      // ignore storage errors
    }

    const onManualOtaToast = () => {
      triggerPopup();
    };
    window.addEventListener('buddy-ota-updated-toast', onManualOtaToast);

    return () => {
      if (timerId) window.clearTimeout(timerId);
      window.removeEventListener('buddy-ota-updated-toast', onManualOtaToast);
    };
  }, []);

  if (viewMode === 'PAINEL_ADMIN') {
    return null;
  }

  const isDaylight = themeMode === 'DAYLIGHT';
  const isAnonymous = Boolean(userPrefs?.anonymousMode);

  // Dynamic Buddy Mascot status badge & glow ring config
  const buddyStatusConfig = isAnonymous
    ? {
        ringClass:
          'ring-2 ring-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.55)]',
        dotClass: 'bg-purple-400',
        badgeEmoji: '🥷',
        statusShort: 'Anónimo',
      }
    : currentMascotState === 'DELIVERY'
    ? {
        ringClass:
          'ring-2 ring-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.65)]',
        dotClass: 'bg-amber-400 animate-ping',
        badgeEmoji: '🚀',
        statusShort: 'Entrega',
      }
    : currentMascotState === 'INACTIVE'
    ? {
        ringClass:
          'ring-2 ring-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.35)]',
        dotClass: 'bg-slate-400',
        badgeEmoji: '⚪',
        statusShort: 'Pausa',
      }
    : {
        ringClass:
          'ring-2 ring-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.6)]',
        dotClass: 'bg-emerald-400',
        badgeEmoji: '🟢',
        statusShort: 'Online',
      };

  const bottomNavItems: {
    id: AppTabId;
    label: string;
    section?: 'AREA_PRIVADA' | 'AREA_PUBLICA_SOCIAL';
    icon: React.ReactNode;
    isSecondaryGroup?: boolean;
    isCenterHighlight?: boolean;
  }[] = [
    {
      id: 'scanner',
      label: 'Início',
      section: 'AREA_PRIVADA',
      icon: <ScanLine className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'financas',
      label: 'Finanças',
      section: 'AREA_PRIVADA',
      icon: <Wallet className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'walkietalkie',
      label: 'Buddys',
      section: 'AREA_PUBLICA_SOCIAL',
      icon: null,
      isCenterHighlight: true,
    },
    {
      id: 'radar',
      label: 'Mapa',
      section: 'AREA_PUBLICA_SOCIAL',
      icon: <MapPinned className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'menu_mais',
      label: 'Ajustes',
      icon: <SlidersHorizontal className="h-4 w-4 shrink-0" />,
      isSecondaryGroup: true,
    },
  ];

  const isMenuMaisActive =
    activeTab === 'menu_mais' ||
    activeTab === 'voz_suporte' ||
    activeTab === 'reclamacoes' ||
    activeTab === 'calculadora';

  return (
    <nav
      aria-label="Navegação Principal"
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
    >
      <div
        className={`max-w-[440px] mx-auto backdrop-blur-md border-t px-2 py-1 grid grid-cols-5 gap-1 items-center pointer-events-auto transition-colors ${
          isDaylight
            ? 'bg-white/95 border-slate-200/80 shadow-lg'
            : 'bg-[#090e13]/95 border-slate-800 shadow-2xl'
        }`}
      >
        {bottomNavItems.map((item) => {
          const isActive = item.isSecondaryGroup
            ? isMenuMaisActive
            : activeTab === item.id;

          if (item.isCenterHighlight) {
            return (
              <div
                key={item.id}
                className="relative flex items-center justify-center"
              >
                {/* Animated OTA Update Speech Bubble rising directly above the center Buddy button */}
                {showOtaUpdatedPopup && (
                  <div
                    role="status"
                    onClick={() => setShowOtaUpdatedPopup(false)}
                    style={{
                      backgroundColor: '#064e3b',
                      borderColor: '#34d399',
                      color: '#ffffff',
                    }}
                    className="absolute -top-18 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-2xl border-2 px-3.5 py-2 shadow-[0_8px_25px_rgba(16,185,129,0.55)] animate-bounce cursor-pointer flex flex-col items-center"
                  >
                    <span className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                      <span>🤖 ✅ Aplicativo atualizado!</span>
                    </span>
                    <span className="text-[9px] text-emerald-200">
                      {CURRENT_OTA_BUILD_VERSION} • Pronto
                    </span>
                    <div
                      style={{
                        borderTopColor: '#34d399',
                      }}
                      className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] absolute -bottom-[8px] left-1/2 -translate-x-1/2"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (item.section) {
                      setCourierWorkspaceSection(item.section);
                    }
                    setActiveTab(item.id);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    boxShadow: 'none',
                  }}
                  className={`-mt-6 flex flex-col items-center justify-center transition cursor-pointer relative ${
                    isActive ? 'scale-105' : 'hover:scale-102'
                  }`}
                >
                  <img
                    src={currentMascotImageUrl}
                    alt={`Buddy ${buddyStatusConfig.statusShort}`}
                    style={{
                      height: '62px',
                      width: '62px',
                      objectFit: 'contain',
                      filter: isActive
                        ? 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.7))'
                        : 'drop-shadow(0 3px 8px rgba(0, 0, 0, 0.75))',
                    }}
                    className="rounded-full select-none pointer-events-none"
                  />
                  <span
                    className={`text-xs leading-none whitespace-nowrap font-extrabold tracking-tight mt-0.5 ${
                      isActive
                        ? 'text-emerald-400'
                        : isDaylight
                          ? 'text-slate-800'
                          : 'text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.section) {
                  setCourierWorkspaceSection(item.section);
                }
                setActiveTab(item.id);
              }}
              className={`rounded-xl py-1.5 px-1 flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                isActive
                  ? 'bg-slate-950 text-white font-semibold shadow-xs'
                  : 'bg-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {item.icon}
              <span className="text-[10px] leading-none whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
