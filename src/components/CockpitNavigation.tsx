import React from 'react';
import {
  ScanLine,
  Users,
  MapPinned,
  Wallet,
  SlidersHorizontal,
} from 'lucide-react';
import { AppTabId } from '../types/models';
import { useEstafetas } from '../context/EstafetasContext';

export const CockpitNavigation: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    viewMode,
    setCourierWorkspaceSection,
    themeMode,
  } = useEstafetas();

  if (viewMode === 'PAINEL_ADMIN') {
    return null;
  }

  const isDaylight = themeMode === 'DAYLIGHT';

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
      icon: <Users className="h-5 w-5 shrink-0" />,
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
        className={`max-w-[440px] mx-auto backdrop-blur-md border-t px-2 py-1.5 grid grid-cols-5 gap-1 items-center pointer-events-auto transition-colors ${
          isDaylight
            ? 'bg-white/95 border-slate-200/80 shadow-lg'
            : 'bg-slate-900/95 border-slate-800 shadow-2xl'
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
                className="flex items-center justify-center"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (item.section) {
                      setCourierWorkspaceSection(item.section);
                    }
                    setActiveTab(item.id);
                  }}
                  className={`w-15 h-15 -mt-3.5 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-950 text-white ring-2 ring-slate-900 font-extrabold scale-105 shadow-lg'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/20'
                  }`}
                >
                  {item.icon}
                  <span className="text-[10px] leading-none whitespace-nowrap">
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
