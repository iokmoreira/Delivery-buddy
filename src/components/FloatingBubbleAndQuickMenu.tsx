import React, { useEffect, useRef, useState } from 'react';
import {
  Bike,
  Minimize2,
  X,
  ScanLine,
  Radio,
  Compass,
  Wallet,
  Calculator,
  Mic,
  AlertTriangle,
  EyeOff,
  Eye,
  PauseCircle,
  PlayCircle,
  Volume2,
  VolumeX,
  ShieldAlert,
  BookOpen,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import { AppTabId, EphemeralVoiceCardCategory } from '../types/models';
import { useEstafetas } from '../context/EstafetasContext';
import { stopBuddySpeech } from '../services/voiceEngine';
import { BubbleRestingPreset } from '../utils/buddyMascotEngine';

type DraggableBubbleId = 'logo' | 'sos' | 'ptt' | 'buddy';

interface BubbleXY {
  x: number;
  y: number;
}

type BubblePositionsMap = Record<DraggableBubbleId, BubbleXY>;

const BUBBLES_STORAGE_KEY = 'estafetas_floating_bubbles_xy_v1';

const clampBubbleX = (x: number): number => {
  const w = typeof window !== 'undefined' ? window.innerWidth : 400;
  return Math.max(8, Math.min(w - 64, Math.round(x)));
};

const clampBubbleY = (y: number): number => {
  const h = typeof window !== 'undefined' ? window.innerHeight : 760;
  return Math.max(8, Math.min(h - 120, Math.round(y)));
};

const getDefaultBubblePositions = (): BubblePositionsMap => {
  const w = typeof window !== 'undefined' ? window.innerWidth : 400;
  const h = typeof window !== 'undefined' ? window.innerHeight : 760;
  const defaultRightX = clampBubbleX(
    Math.min(w - 64, Math.round(w / 2 + 220 - 58))
  );
  return {
    logo: { x: defaultRightX, y: clampBubbleY(h - 130) },
    ptt: { x: defaultRightX, y: clampBubbleY(h - 188) },
    sos: { x: defaultRightX, y: clampBubbleY(h - 246) },
    buddy: { x: defaultRightX, y: clampBubbleY(h - 304) },
  };
};

const loadSavedBubblePositions = (): BubblePositionsMap => {
  const fallback = getDefaultBubblePositions();
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(BUBBLES_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<BubblePositionsMap>;
    return {
      logo: {
        x: clampBubbleX(parsed.logo?.x ?? fallback.logo.x),
        y: clampBubbleY(parsed.logo?.y ?? fallback.logo.y),
      },
      ptt: {
        x: clampBubbleX(parsed.ptt?.x ?? fallback.ptt.x),
        y: clampBubbleY(parsed.ptt?.y ?? fallback.ptt.y),
      },
      sos: {
        x: clampBubbleX(parsed.sos?.x ?? fallback.sos.x),
        y: clampBubbleY(parsed.sos?.y ?? fallback.sos.y),
      },
      buddy: {
        x: clampBubbleX(parsed.buddy?.x ?? fallback.buddy.x),
        y: clampBubbleY(parsed.buddy?.y ?? fallback.buddy.y),
      },
    };
  } catch {
    return fallback;
  }
};

const CATEGORY_CLEAN_LABELS: Record<EphemeralVoiceCardCategory, string> = {
  TRANSITO: 'Trânsito na Rota',
  DEMANDA_ZONA: 'Procura na Zona',
  MINHAS_ESTATISTICAS: 'Estatísticas do Turno',
  CLIMA: 'Clima na Zona',
  ENTREGA_ATUAL_ULTIMA: 'Resumo da Entrega',
  STATUS_PEDIDO: 'Estado do Pedido',
  STATUS_ESTABELECIMENTO: 'Inteligência de Loja',
  ESTADO_ROTA: 'Auditoria de Rota',
  MENSAGEM_AMIZADE: 'Mensagens & Buddys',
  SUPORTE_PLATAFORMA: 'Suporte da Plataforma',
  SOS_CONFIRMACAO: 'Confirmação SOS',
  GRAVACAO_SKILL_IA: 'Gravação de Nova Skill IA',
  MERCADO_PROJECOES: 'Mercado & Projeções',
};

export const FloatingBubbleAndQuickMenu: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setCourierWorkspaceSection,
    isBubbleMinimized,
    setIsBubbleMinimized,
    isQuickSummaryOpen,
    setIsQuickSummaryOpen,
    activeBubbleAnimation,
    dismissBubbleAnimation,
    personalGoals,
    buddyRewards,
    communityReputationPct,
    userPrefs,
    toggleAnonymousMode,
    isAppPaused,
    toggleAppPauseMode,
    ttsVoiceEnabled,
    toggleTtsVoice,
    activeJoinedZonePact,
    activeSosBeacon,
    openWelcomeTour,
    ephemeralVoiceOverlay,
    executeVoiceCommandPt,
    isListeningSpeechRecognition,
    isSpeakingTts,
    sosPendingConfirmation,
    requestOrConfirmSosActivation,
    cancelSosPendingConfirmation,
    alertPopupPrefs,
    voiceActivationConfig,
    isPttActive,
    themeMode,
    onlineDirectoryCouriers,
    minimizedBuddyBubbleCourierId,
    setMinimizedBuddyBubbleCourierId,
    setActiveBuddyPopupCourierId,
    setBuddyPopupSizeMode,
    liveVoiceTranscription,
    updateLiveVoiceTranscriptText,
    setLiveVoiceEditing,
    clearLiveVoiceTranscriptText,
    confirmSendLiveDictatedMessage,
    cancelLiveVoiceTranscription,
    deviceScreenProfile,
    activeSkillTeachingSession,
    addTapStepToSkillTeachingSession,
    completeAndSaveVoiceTaughtSkill,
    cancelVoiceTeachSkillMode,
    lastHeardLiveTranscript,
    lastHeardSpokenText,
    lastExecutedVoiceActionText,
    isTwoStepWakeActive,
    twoStepWakeSecondsLeft,
    lastAutoDetectedOfferBanner,
    dismissAutoDetectedOfferBanner,
    speakTextPt,
    cancelSpeechNow,
    isAmaranteWeatherModalOpen,
    setIsAmaranteWeatherModalOpen,
    amaranteLiveWeather,
    isLoadingAmaranteWeather,
    rainBonusFinanceActive,
    toggleRainBonusFinanceActive,
    openAndFetchAmaranteWeather,
    currentMascotState,
    currentMascotImageUrl,
    bubbleRestingPreset,
    toggleVoiceMicListening,
  } = useEstafetas();

  const [bubblePositions, setBubblePositions] = useState<BubblePositionsMap>(
    () => loadSavedBubblePositions()
  );
  const [isSavingVoiceSkill, setIsSavingVoiceSkill] = useState<boolean>(false);

  const computeCoordsForPreset = React.useCallback(
    (preset: BubbleRestingPreset): BubbleXY => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 400;
      const h = typeof window !== 'undefined' ? window.innerHeight : 760;
      const rightX = clampBubbleX(w - 72);
      const leftX = clampBubbleX(12);
      const topY = clampBubbleY(68);
      const bottomY = clampBubbleY(h - 150);
      const midY = clampBubbleY(Math.round(h * 0.46));

      if (preset === 'TOP_LEFT') {
        return { x: leftX, y: topY };
      }
      if (preset === 'TOP_RIGHT') {
        return { x: rightX, y: topY };
      }
      if (preset === 'BOTTOM_LEFT') {
        return { x: leftX, y: bottomY };
      }
      if (preset === 'MIDDLE_RIGHT') {
        return { x: rightX, y: midY };
      }
      if (preset === 'MIDDLE_LEFT') {
        return { x: leftX, y: midY };
      }
      return { x: rightX, y: bottomY };
    },
    []
  );

  const computeRestingLogoCoords = React.useCallback((): BubbleXY => {
    return computeCoordsForPreset(bubbleRestingPreset);
  }, [bubbleRestingPreset, computeCoordsForPreset]);

  // Snap to configured resting preset when minimized or when preset changes
  useEffect(() => {
    if (bubbleRestingPreset === 'CUSTOM_DRAG') return;
    const nextLogo = computeCoordsForPreset(bubbleRestingPreset);
    setBubblePositions((prev) => ({
      ...prev,
      logo: nextLogo,
    }));
  }, [bubbleRestingPreset, isBubbleMinimized, computeCoordsForPreset]);

  // Listen to explicit preset tap event from Ajustes so tapping ANY preset (even re-tapping current) immediately moves the bubble!
  useEffect(() => {
    const handleSnapPreset = (ev: Event) => {
      const customEv = ev as CustomEvent<{ preset?: BubbleRestingPreset }>;
      const chosen = customEv.detail?.preset || bubbleRestingPreset;
      if (chosen === 'CUSTOM_DRAG') return;
      const targetCoords = computeCoordsForPreset(chosen);
      setBubblePositions((prev) => ({
        ...prev,
        logo: targetCoords,
      }));
    };
    window.addEventListener('buddy-snap-bubble-preset', handleSnapPreset);
    return () =>
      window.removeEventListener('buddy-snap-bubble-preset', handleSnapPreset);
  }, [bubbleRestingPreset, computeCoordsForPreset]);

  const activeDragRef = useRef<{
    id: DraggableBubbleId;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    initialX: number;
    initialY: number;
    hasDragged: boolean;
  } | null>(null);

  const lastPointerTapAtRef = useRef<Record<DraggableBubbleId, number>>({
    logo: 0,
    sos: 0,
    ptt: 0,
    buddy: 0,
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        BUBBLES_STORAGE_KEY,
        JSON.stringify(bubblePositions)
      );
    } catch {
      // ignore storage errors
    }
  }, [bubblePositions]);

  useEffect(() => {
    const handleResize = () => {
      setBubblePositions((prev) => ({
        logo: {
          x: clampBubbleX(prev.logo.x),
          y: clampBubbleY(prev.logo.y),
        },
        ptt: {
          x: clampBubbleX(prev.ptt.x),
          y: clampBubbleY(prev.ptt.y),
        },
        sos: {
          x: clampBubbleX(prev.sos.x),
          y: clampBubbleY(prev.sos.y),
        },
        buddy: {
          x: clampBubbleX(prev.buddy.x),
          y: clampBubbleY(prev.buddy.y),
        },
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBubblePointerDown = (
    id: DraggableBubbleId,
    e: React.PointerEvent<HTMLElement>
  ) => {
    e.stopPropagation();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore pointer capture error
    }
    const cur = bubblePositions[id];
    activeDragRef.current = {
      id,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initialX: cur.x,
      initialY: cur.y,
      hasDragged: false,
    };
  };

  const handleBubblePointerMove = (
    id: DraggableBubbleId,
    e: React.PointerEvent<HTMLElement>
  ) => {
    const drag = activeDragRef.current;
    if (!drag || drag.id !== id || drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;
    const distance = Math.hypot(dx, dy);

    // 6px Tap vs. Drag Threshold
    if (distance >= 6) {
      drag.hasDragged = true;
    }

    if (drag.hasDragged) {
      const nextX = clampBubbleX(drag.initialX + dx);
      const nextY = clampBubbleY(drag.initialY + dy);
      setBubblePositions((prev) => ({
        ...prev,
        [id]: { x: nextX, y: nextY },
      }));
    }
  };

  const handleBubblePointerUp = (
    id: DraggableBubbleId,
    e: React.PointerEvent<HTMLElement>,
    onTapAction: () => void
  ) => {
    e.stopPropagation();
    const drag = activeDragRef.current;
    if (!drag || drag.id !== id || drag.pointerId !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore release error
    }

    const wasDrag = drag.hasDragged;
    activeDragRef.current = null;

    if (!wasDrag) {
      lastPointerTapAtRef.current[id] = Date.now();
      onTapAction();
    } else if (id === 'logo' && bubbleRestingPreset !== 'CUSTOM_DRAG') {
      const snapTarget = computeRestingLogoCoords();
      setBubblePositions((prev) => ({
        ...prev,
        logo: snapTarget,
      }));
    }
  };

  const handleBubblePointerCancel = (
    id: DraggableBubbleId,
    e: React.PointerEvent<HTMLElement>
  ) => {
    const drag = activeDragRef.current;
    if (!drag || drag.id !== id) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    activeDragRef.current = null;
  };

  const handleBubbleFallbackClick = (
    id: DraggableBubbleId,
    e: React.MouseEvent<HTMLElement>,
    onTapAction: () => void
  ) => {
    e.stopPropagation();
    if (Date.now() - lastPointerTapAtRef.current[id] < 450) {
      e.preventDefault();
      return;
    }
    onTapAction();
  };

  const isDaylight = themeMode === 'DAYLIGHT';

  const minimizedBuddyCourier = onlineDirectoryCouriers.find(
    (c) => c.id === minimizedBuddyBubbleCourierId
  );

  const dailyPct = Math.min(
    100,
    Math.round(
      (personalGoals.currentDailyNetEarnedEur /
        Math.max(1, personalGoals.dailyNetGoalEur)) *
        100
    )
  );

  const handleNavigateFromQuickMenu = (tab: AppTabId) => {
    setActiveTab(tab);
    setIsBubbleMinimized(false);
    setIsQuickSummaryOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageCards: {
    id: AppTabId | 'guia_pratico';
    title: string;
    subtitle: string;
    badge: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'scanner',
      title: 'Avaliador & Scanner',
      subtitle: 'Decisão rápida e peso 12kg',
      badge: 'Veredito',
      icon: <ScanLine className="h-4 w-4 text-zinc-200" />,
    },
    {
      id: 'walkietalkie',
      title: 'Social Buddys & SOS',
      subtitle: 'Blog, amigos e emergência',
      badge: activeSosBeacon?.active ? 'SOS ATIVO' : 'Comunidade',
      icon: <Radio className="h-4 w-4 text-zinc-200" />,
    },
    {
      id: 'radar',
      title: 'Mapa & Notas Local',
      subtitle: 'Calor 2m30s e notas de rota',
      badge: activeJoinedZonePact
        ? `>= ${activeJoinedZonePact.minCollectiveOrderEur.toFixed(0)}€`
        : '2m30s',
      icon: <Compass className="h-4 w-4 text-zinc-200" />,
    },
    {
      id: 'financas',
      title: 'Finanças Privadas',
      subtitle: 'Estatísticas, metas e caixa',
      badge: `${buddyRewards.buddyCoins} Coins`,
      icon: <Wallet className="h-4 w-4 text-zinc-200" />,
    },
    {
      id: 'reclamacoes',
      title: 'Rotas & Reclamações',
      subtitle: 'Provas de desvio e pilaretes',
      badge: 'Provas',
      icon: <AlertTriangle className="h-4 w-4 text-zinc-200" />,
    },
    {
      id: 'voz_suporte',
      title: 'Alertas, Voz & Mensagens',
      subtitle: 'Pop-up 45%, Trigger Word e Macros',
      badge: 'Voz BR',
      icon: <Mic className="h-4 w-4 text-zinc-200" />,
    },
    {
      id: 'calculadora',
      title: 'Predefinições & Fiscal',
      subtitle: 'Custos/km, filtros e lista negra',
      badge: 'CAE & Taxas',
      icon: <Calculator className="h-4 w-4 text-zinc-200" />,
    },
    {
      id: 'guia_pratico',
      title: 'Guia Rápido',
      subtitle: 'Tutorial rápido de 4 passos',
      badge: 'Ajuda',
      icon: <BookOpen className="h-4 w-4 text-zinc-200" />,
    },
  ];

  // =========================================================================
  // FREELY DRAGGABLE (X, Y) FLOATING BUBBLES (No Outer Grey Dock Container)
  // 1. Minimized Buddy Avatar Bubble (with photo & X close button)
  // 2. Freely Draggable Round SOS Bubble
  // 3. Conditional Freely Draggable Round PTT Bubble (hidden when Trigger Word is ON)
  // 4. Freely Draggable Round Logo Bubble
  // =========================================================================
  const renderFloatingCornerBubblesStack = () => {
    const reopenBuddyProfileAction = () => {
      if (!minimizedBuddyCourier) return;
      setIsBubbleMinimized(false);
      setCourierWorkspaceSection('AREA_PUBLICA_SOCIAL');
      setActiveTab('walkietalkie');
      setBuddyPopupSizeMode('45VH');
      setActiveBuddyPopupCourierId(minimizedBuddyCourier.id);
      setMinimizedBuddyBubbleCourierId(null);
    };

    return (
      <>
        {/* Foreground Buddy Floating Voice Bubble (74px x 74px, Transparent, Crisp Light Neon Blue Ring, Reactive 3-Pose Mascot) */}
        <button
          type="button"
          style={{
            left: `${bubblePositions.logo.x}px`,
            top: `${bubblePositions.logo.y}px`,
            width: '74px',
            height: '74px',
            padding: '2px',
            pointerEvents: 'auto',
          }}
          onPointerDown={(e) => handleBubblePointerDown('logo', e)}
          onPointerMove={(e) => handleBubblePointerMove('logo', e)}
          onPointerUp={(e) =>
            handleBubblePointerUp('logo', e, toggleVoiceMicListening)
          }
          onPointerCancel={(e) => handleBubblePointerCancel('logo', e)}
          onClick={(e) =>
            handleBubbleFallbackClick('logo', e, toggleVoiceMicListening)
          }
          title="Toque 1x na bolinha Buddy para Falar (Reconhecimento de Voz) • Arraste livremente"
          aria-label="Falar com Delivery Buddy (Bolinha de Voz)"
          className={`fixed z-40 rounded-full flex flex-col items-center justify-center touch-none select-none cursor-grab active:cursor-grabbing transition-all duration-200 bg-transparent ${
            isListeningSpeechRecognition
              ? 'border-[2.5px] border-[#00E5FF] ring-4 ring-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.75)]'
              : currentMascotState === 'DELIVERY'
                ? 'border-[2.5px] border-[#00E5FF] shadow-[0_0_16px_rgba(0,229,255,0.65)]'
                : currentMascotState === 'INACTIVE'
                  ? 'border-[2px] border-[#00E5FF]/60 shadow-none'
                  : 'border-[2.5px] border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.45)]'
          }`}
        >
          {(isListeningSpeechRecognition || currentMascotState === 'DELIVERY') && (
            <span
              className="absolute inset-0 rounded-full animate-ping pointer-events-none bg-[#00E5FF]/35"
            />
          )}
          <div className="h-full w-full pointer-events-none relative z-10 flex items-center justify-center">
            <img
              src={currentMascotImageUrl}
              alt="Buddy Mascote Voz"
              style={{ objectFit: 'contain' }}
              className="h-full w-full object-contain"
            />
          </div>
        </button>

        {/* Minimized Buddy Avatar Bubble ("Bolinha com Foto do Perfil" - Freely Draggable) */}
        {minimizedBuddyCourier && (
          <div
            style={{
              left: `${bubblePositions.buddy.x}px`,
              top: `${bubblePositions.buddy.y}px`,
            }}
            className="fixed z-40"
          >
            <button
              type="button"
              onPointerDown={(e) => handleBubblePointerDown('buddy', e)}
              onPointerMove={(e) => handleBubblePointerMove('buddy', e)}
              onPointerUp={(e) =>
                handleBubblePointerUp('buddy', e, reopenBuddyProfileAction)
              }
              onPointerCancel={(e) => handleBubblePointerCancel('buddy', e)}
              onClick={(e) =>
                handleBubbleFallbackClick('buddy', e, reopenBuddyProfileAction)
              }
              title={`Arrastar ou tocar para reabrir Perfil 45% de ${minimizedBuddyCourier.callsign}`}
              aria-label={`Reabrir Perfil de ${minimizedBuddyCourier.callsign}`}
              className="w-12 h-12 rounded-full shadow-xl border-2 border-emerald-400 overflow-hidden bg-slate-900 flex items-center justify-center touch-none select-none cursor-grab active:cursor-grabbing"
            >
              {minimizedBuddyCourier.avatarPhotoUrl ? (
                <img
                  src={minimizedBuddyCourier.avatarPhotoUrl}
                  alt={minimizedBuddyCourier.callsign}
                  className="w-full h-full object-cover pointer-events-none"
                />
              ) : (
                <span className="text-xs font-extrabold text-white pointer-events-none">
                  {minimizedBuddyCourier.avatarInitials ||
                    minimizedBuddyCourier.callsign.slice(0, 2).toUpperCase()}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMinimizedBuddyBubbleCourierId(null);
              }}
              title={`Fechar bolinha de ${minimizedBuddyCourier.callsign}`}
              aria-label={`Fechar bolinha de ${minimizedBuddyCourier.callsign}`}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-sm cursor-pointer"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        )}

        {/* Floating Two-Step Wake Pill ("🎙️ Estou a ouvir...") */}
        {isTwoStepWakeActive && (
          <div
            role="status"
            aria-live="assertive"
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#090d16]/95 border-2 border-[#00E5FF] px-4 py-1.5 text-xs font-extrabold text-[#00E5FF] shadow-[0_0_24px_rgba(0,229,255,0.65)] flex items-center gap-2 pointer-events-none"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#00E5FF] animate-ping shrink-0" />
            <span>
              🎙️ Estou a ouvir... ({twoStepWakeSecondsLeft}s) • Diga o comando!
            </span>
          </div>
        )}

        {/* High-Contrast Auto-Detected Offer Verdict Toast / Banner (Traffic-Light Verdict 🟢 / 🟡 / 🔴) */}
        {lastAutoDetectedOfferBanner && (
          <div
            role="alert"
            aria-live="assertive"
            className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-[410px] rounded-2xl p-3.5 shadow-[0_14px_38px_rgba(0,0,0,0.75)] border-2 backdrop-blur-md transition-all ${
              lastAutoDetectedOfferBanner.trafficLight === 'GREEN_ACCEPT' ||
              (lastAutoDetectedOfferBanner.passes &&
                !lastAutoDetectedOfferBanner.trafficLight)
                ? 'bg-emerald-950/95 border-emerald-400 text-white'
                : lastAutoDetectedOfferBanner.trafficLight === 'YELLOW_EVALUATE'
                  ? 'bg-amber-950/95 border-amber-400 text-white'
                  : 'bg-rose-950/95 border-rose-400 text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                    lastAutoDetectedOfferBanner.trafficLight ===
                      'GREEN_ACCEPT' ||
                    (lastAutoDetectedOfferBanner.passes &&
                      !lastAutoDetectedOfferBanner.trafficLight)
                      ? 'bg-emerald-400 text-slate-950'
                      : lastAutoDetectedOfferBanner.trafficLight ===
                          'YELLOW_EVALUATE'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-rose-400 text-slate-950'
                  }`}
                >
                  {lastAutoDetectedOfferBanner.trafficLight === 'GREEN_ACCEPT'
                    ? '🟢 ACEITAR'
                    : lastAutoDetectedOfferBanner.trafficLight ===
                        'YELLOW_EVALUATE'
                      ? '🟡 AVALIAR'
                      : lastAutoDetectedOfferBanner.trafficLight ===
                          'RED_DECLINE'
                        ? '🔴 RECUSAR'
                        : `⚡ ${lastAutoDetectedOfferBanner.verdictLabel}`}
                </span>
                <span className="text-[11px] font-extrabold text-zinc-200">
                  {lastAutoDetectedOfferBanner.platform} •{' '}
                  {lastAutoDetectedOfferBanner.detectedAt}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    speakTextPt(lastAutoDetectedOfferBanner.spokenSummary)
                  }
                  className="rounded-lg bg-white/15 hover:bg-white/25 px-2 py-1 text-[10px] font-extrabold text-white cursor-pointer"
                >
                  🔊 Ouvir
                </button>
                <button
                  type="button"
                  onClick={dismissAutoDetectedOfferBanner}
                  aria-label="Fechar alerta de oferta"
                  className="rounded-lg bg-white/15 hover:bg-white/25 p-1 text-white cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-black/35 px-3 py-2 border border-white/10">
              <div>
                <p className="text-[9px] font-bold uppercase text-zinc-300">
                  Oferta Bruta
                </p>
                <p className="text-sm font-black text-white">
                  {lastAutoDetectedOfferBanner.grossEur.toFixed(2)} € •{' '}
                  {lastAutoDetectedOfferBanner.realKm.toFixed(1)} km
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase text-zinc-300">
                  Lucro Líquido
                </p>
                <p className="text-sm font-black text-emerald-300">
                  +{lastAutoDetectedOfferBanner.netProfitEur.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase text-zinc-300">
                  Tarifa Real
                </p>
                <p className="text-sm font-black text-amber-300">
                  {lastAutoDetectedOfferBanner.netEurPerKm.toFixed(2)} €/km
                  {lastAutoDetectedOfferBanner.netEurPerHour
                    ? ` • ${lastAutoDetectedOfferBanner.netEurPerHour.toFixed(0)}€/h`
                    : ''}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => executeVoiceCommandPt('Buddy aceitar pedido')}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-1.5 px-2.5 text-[11px] font-black cursor-pointer transition"
              >
                🟢 Aceitar (&ldquo;Buddy aceitar&rdquo;)
              </button>
              <button
                type="button"
                onClick={() => executeVoiceCommandPt('Buddy recusar pedido')}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white py-1.5 px-2.5 text-[11px] font-black cursor-pointer transition"
              >
                🔴 Recusar (&ldquo;Buddy recusar&rdquo;)
              </button>
            </div>
          </div>
        )}

        {/* Prominent 4-Second Persistent Real-Time Live Voice Transcription HUD Card */}
        {(lastHeardLiveTranscript || isListeningSpeechRecognition) && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed ${
              lastAutoDetectedOfferBanner ? 'top-44' : 'top-16'
            } left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-[400px] rounded-2xl px-4 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.75)] border-2 backdrop-blur-md transition-all pointer-events-none ${
              lastHeardLiveTranscript?.startsWith('✅')
                ? 'bg-[#090d16]/95 border-emerald-400 text-white'
                : lastHeardLiveTranscript?.startsWith('⚠️')
                  ? 'bg-[#090d16]/95 border-amber-400 text-white'
                  : 'bg-[#090d16]/95 border-emerald-400 text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                    isListeningSpeechRecognition
                      ? 'bg-emerald-400 animate-ping'
                      : 'bg-emerald-400'
                  }`}
                />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                  MICROFONE ATIVO • TRANSCRIÇÃO EM TEMPO REAL
                </span>
              </div>
              <span className="text-[10px] font-bold text-zinc-300">
                PT-PT
              </span>
            </div>
            <div className="space-y-1 text-xs sm:text-sm leading-snug break-words">
              <div className="font-extrabold text-white">
                🗣️ Ouvido:{' '}
                <span className="text-emerald-300">
                  &ldquo;
                  {lastHeardSpokenText ||
                    (lastHeardLiveTranscript
                      ? lastHeardLiveTranscript
                          .replace(/^✅\s*Comando:\s*/i, '')
                          .replace(/^🗣️\s*Ouvindo:\s*/i, '')
                      : 'A escutar a sua voz...')}
                  &rdquo;
                </span>
              </div>
              <div className="font-bold text-zinc-200">
                ✅ Comando executado:{' '}
                <span className="text-amber-300 font-extrabold">
                  {lastExecutedVoiceActionText ||
                    (isListeningSpeechRecognition
                      ? 'A aguardar conclusão da frase...'
                      : 'Comando processado')}
                </span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // =========================================================================
  // REAL-TIME LIVE VOICE TRANSCRIPTION POP-UP SHEET (45% VIEWPORT)
  // Supports Real-Time Word-by-Word Display (interimResults = true + 60ms stream),
  // Inline Editing, Dictated Message 2s Auto-Send Countdown, and Voice Command Answer Card.
  // =========================================================================
  const renderEphemeralVoiceOverlayCard = () => {
    const isPopupVisible =
      Boolean(liveVoiceTranscription && liveVoiceTranscription.isOpen) ||
      Boolean(ephemeralVoiceOverlay && ephemeralVoiceOverlay.isOpen);

    if (!isPopupVisible) return null;

    const isDictationMode =
      liveVoiceTranscription?.mode === 'MENSAGEM_DITADA';
    const isListeningNow =
      liveVoiceTranscription?.phase === 'LISTENING_STREAMING' ||
      isListeningSpeechRecognition ||
      isPttActive;

    const cleanCategoryTitle = ephemeralVoiceOverlay
      ? CATEGORY_CLEAN_LABELS[ephemeralVoiceOverlay.cardCategory] ||
        'Resposta Buddy'
      : isDictationMode
      ? 'Mensagem Ditada'
      : 'Comando Buddy';

    const heightClass =
      alertPopupPrefs.sizeVh === '35VH'
        ? 'min-h-[35vh] max-h-[82vh]'
        : alertPopupPrefs.sizeVh === '55VH'
          ? 'min-h-[55vh] max-h-[88vh]'
          : 'min-h-[45vh] max-h-[85vh]';

    const alignClass =
      alertPopupPrefs.position === 'TOP'
        ? 'items-start pt-4'
        : alertPopupPrefs.position === 'CENTER'
          ? 'items-center'
          : 'items-end pb-4';

    const sizeBadgeLabel =
      alertPopupPrefs.sizeVh === '35VH'
        ? '35% da Tela'
        : alertPopupPrefs.sizeVh === '55VH'
          ? '55% da Tela'
          : '45% da Tela';

    const displayedTranscript =
      liveVoiceTranscription?.transcriptText ||
      liveVoiceTranscription?.fullTargetText ||
      ephemeralVoiceOverlay?.commandSpoken?.replace(/^["“]|["”]$/g, '') ||
      '';

    const recipientLabel =
      liveVoiceTranscription?.dictationTarget?.recipientName || 'Destinatário';
    const countdownSecFormatted = (
      liveVoiceTranscription?.sendCountdownSeconds ?? 2
    ).toFixed(1);
    const countdownProgressPct =
      liveVoiceTranscription?.sendCountdownProgressPct ?? 100;
    const isEditingInline = Boolean(liveVoiceTranscription?.isEditingText);

    const triggerSourceLabel =
      liveVoiceTranscription?.triggeredVia === 'PTT'
        ? 'Push-to-Talk (PTT)'
        : liveVoiceTranscription?.triggeredVia === 'TRIGGER_WORD'
          ? `Trigger Word ("${voiceActivationConfig.customTriggerWord || 'Buddy'}...")`
          : liveVoiceTranscription?.triggeredVia === 'DICTATION_MIC'
            ? `Ditado de Voz • ${recipientLabel}`
            : cleanCategoryTitle;

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pop-up de Transcrição de Voz ao Vivo"
        onClick={cancelLiveVoiceTranscription}
        title="Toque em qualquer área fora do pop-up (55% da tela) para fechar imediatamente e cortar o reconhecimento/áudio"
        className={`fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px] flex justify-center px-3 ${alignClass} cursor-pointer`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-[420px] ${heightClass} rounded-3xl border p-4 sm:p-5 shadow-2xl flex flex-col justify-between gap-3 overflow-y-auto cursor-default transition-all ${
            isDaylight
              ? 'bg-white text-slate-900 border-slate-200'
              : 'bg-slate-800 text-slate-100 border-slate-700'
          }`}
        >
          {/* 1. TOP STATUS BAR: Pulsing Mic Wave + Status Badge + Detected Mode Pill + Close (X) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Animated Pulsing Microphone Wave Indicator + Status Badge */}
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold tracking-wide shadow-xs ${
                    isListeningNow
                      ? 'bg-emerald-500 text-slate-950 animate-pulse'
                      : isSpeakingTts
                        ? 'bg-sky-600 text-white'
                        : isDaylight
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-950'
                  }`}
                >
                  <span className="inline-flex items-end gap-0.5 h-3.5">
                    <span
                      className={`w-0.5 rounded-full bg-current transition-all ${
                        isListeningNow ? 'h-3.5 animate-bounce' : 'h-2'
                      }`}
                    />
                    <span
                      className={`w-0.5 rounded-full bg-current transition-all ${
                        isListeningNow ? 'h-2.5 animate-pulse' : 'h-3'
                      }`}
                    />
                    <span
                      className={`w-0.5 rounded-full bg-current transition-all ${
                        isListeningNow ? 'h-3.5 animate-bounce' : 'h-1.5'
                      }`}
                    />
                  </span>
                  <span>
                    {isListeningNow
                      ? 'A Ouvir a tua voz (pt-BR)...'
                      : 'Transcrição Concluída'}
                  </span>
                </span>

                {/* Detected Mode Pill: Comando Buddy or Mensagem Ditada */}
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                    isDictationMode
                      ? isDaylight
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        : 'bg-indigo-950/70 text-indigo-200 border-indigo-700'
                      : isDaylight
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-emerald-950/70 text-emerald-200 border-emerald-700'
                  }`}
                >
                  {isDictationMode ? 'Mensagem Ditada' : 'Comando Buddy'}
                </span>
              </div>

              <button
                type="button"
                onClick={cancelLiveVoiceTranscription}
                title="Fechar pop-up e cortar reconhecimento/áudio imediatamente"
                aria-label="Fechar Pop-up de Transcrição de Voz"
                className={`h-8 w-8 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition ${
                  isDaylight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Source / Recipient Sub-bar */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span
                className={`font-semibold truncate ${
                  isDaylight ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                {isDictationMode
                  ? `Destinatário: ${recipientLabel}`
                  : triggerSourceLabel}
              </span>
              <span
                className={`text-[11px] shrink-0 ${
                  isDaylight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {isSpeakingTts
                  ? '🔊 A falar (pt-BR)...'
                  : ephemeralVoiceOverlay &&
                      alertPopupPrefs.durationMode !== 'MANUAL'
                    ? `Fecha em ${ephemeralVoiceOverlay.countdownSecondsLeft}s`
                    : sizeBadgeLabel}
              </span>
            </div>
          </div>

          {/* 2. LARGE LIVE TRANSCRIPT BOX (text-2xl font-bold leading-snug + Inline Edit + Limpar) */}
          <div
            onClick={() => {
              if (!isEditingInline) {
                setLiveVoiceEditing(true);
              }
            }}
            title="Toque no texto transcrito para editar rapidamente ou diga 'Limpar' / 'Cancelar'"
            className={`rounded-2xl p-3.5 border-2 transition cursor-text ${
              isListeningNow
                ? isDaylight
                  ? 'bg-emerald-50/70 border-emerald-400'
                  : 'bg-slate-900 border-emerald-500/80'
                : isDaylight
                  ? 'bg-slate-50 border-slate-300/90'
                  : 'bg-slate-900/95 border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  isDaylight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {isEditingInline
                  ? 'Edição Rápida da Transcrição ao Vivo'
                  : 'Transcrição de Voz ao Vivo (Palavra a Palavra)'}
              </span>
              <div
                className="flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setLiveVoiceEditing(!isEditingInline)}
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-bold cursor-pointer transition ${
                    isDaylight
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {isEditingInline ? 'Concluir' : 'Editar'}
                </button>
                <button
                  type="button"
                  onClick={clearLiveVoiceTranscriptText}
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-bold cursor-pointer transition ${
                    isDaylight
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                      : 'bg-amber-950/70 hover:bg-amber-900/70 text-amber-200'
                  }`}
                >
                  Limpar
                </button>
              </div>
            </div>

            {isEditingInline ? (
              <div
                className="space-y-2"
                onClick={(e) => e.stopPropagation()}
              >
                <textarea
                  rows={2}
                  value={displayedTranscript}
                  onChange={(e) => updateLiveVoiceTranscriptText(e.target.value)}
                  placeholder="Edite ou escreva o comando / mensagem..."
                  className={`w-full rounded-xl p-2 text-xl font-bold leading-snug focus:outline-none border ${
                    isDaylight
                      ? 'bg-white text-slate-900 border-slate-300'
                      : 'bg-slate-950 text-slate-100 border-slate-700'
                  }`}
                />
                {!isDictationMode && displayedTranscript.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setLiveVoiceEditing(false);
                      executeVoiceCommandPt(displayedTranscript.trim());
                    }}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    Executar Comando Editado
                  </button>
                )}
              </div>
            ) : (
              <p
                className={`text-2xl font-bold leading-snug tracking-tight break-words ${
                  isDaylight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {displayedTranscript ? (
                  <>
                    &ldquo;{displayedTranscript}&rdquo;
                    {isListeningNow && (
                      <span className="inline-block w-1.5 h-6 ml-1 align-middle bg-emerald-500 animate-pulse" />
                    )}
                  </>
                ) : (
                  <span
                    className={
                      isDaylight ? 'text-slate-400' : 'text-slate-500'
                    }
                  >
                    A escutar a tua voz em português...
                  </span>
                )}
              </p>
            )}
          </div>

          {/* 3A. FOR DICTATED MESSAGES: Recipient + Automatic 2-Second Send Countdown Bar + Enviar Agora / Cancelar */}
          {isDictationMode && (
            <div
              className={`rounded-2xl p-3.5 space-y-2.5 border ${
                isDaylight
                  ? 'bg-indigo-50/70 border-indigo-200'
                  : 'bg-indigo-950/40 border-indigo-800/80'
              }`}
            >
              {liveVoiceTranscription?.phase === 'MESSAGE_SENT_CONFIRMATION' ? (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 block">
                      ✓ Mensagem Enviada com Sucesso
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        isDaylight ? 'text-slate-700' : 'text-slate-200'
                      }`}
                    >
                      Entregue a <strong>{recipientLabel}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={cancelLiveVoiceTranscription}
                    className="rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold">
                      {liveVoiceTranscription?.phase ===
                      'TRANSCRIPT_READY_COUNTDOWN'
                        ? `A enviar mensagem em ${countdownSecFormatted}s...`
                        : isListeningNow
                          ? 'A captar ditado palavra a palavra...'
                          : `Pronto para enviar para ${recipientLabel}`}
                    </span>
                    <span className=" text-[11px] font-bold text-indigo-600 dark:text-indigo-300">
                      {recipientLabel}
                    </span>
                  </div>

                  {/* 2-Second Automatic Send Countdown Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-300/70 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-100"
                      style={{
                        width: `${
                          isListeningNow ? 35 : countdownProgressPct
                        }%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={cancelLiveVoiceTranscription}
                      className={`rounded-xl px-3.5 py-2 text-xs font-bold cursor-pointer transition ${
                        isDaylight
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmSendLiveDictatedMessage()}
                      disabled={!displayedTranscript.trim()}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Enviar Agora</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 3B. FOR VOICE COMMANDS: Smooth Transition from Completed Transcript into Visual + Spoken Answer Card */}
          {!isDictationMode && ephemeralVoiceOverlay && (
            <div
              className={`rounded-2xl p-3.5 space-y-2 border ${
                isDaylight
                  ? 'bg-slate-50 border-slate-200/90'
                  : 'bg-slate-900/90 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[11px] font-extrabold uppercase tracking-wider ${
                    isDaylight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  {ephemeralVoiceOverlay.title} •{' '}
                  {ephemeralVoiceOverlay.primaryMetricLabel}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    isDaylight
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {cleanCategoryTitle}
                </span>
              </div>

              <div className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
                {ephemeralVoiceOverlay.primaryMetricValue}
              </div>

              <div
                className={`space-y-1 border-t pt-2 ${
                  isDaylight ? 'border-slate-200/80' : 'border-slate-800'
                }`}
              >
                {ephemeralVoiceOverlay.secondaryDetails.map(
                  (detail: string, idx: number) => (
                    <div
                      key={idx}
                      className={`text-xs font-medium leading-snug ${
                        isDaylight ? 'text-slate-700' : 'text-slate-200'
                      }`}
                    >
                      • {detail}
                    </div>
                  )
                )}
              </div>

              {(sosPendingConfirmation.isPending ||
                ephemeralVoiceOverlay.cardCategory === 'SOS_CONFIRMACAO') && (
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      cancelSosPendingConfirmation();
                      cancelLiveVoiceTranscription();
                    }}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer transition ${
                      isDaylight
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      requestOrConfirmSosActivation('Acidente na Via')
                    }
                    className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs font-extrabold cursor-pointer transition shadow-sm"
                  >
                    Confirmar SOS (
                    {sosPendingConfirmation.secondsRemaining > 0
                      ? `${sosPendingConfirmation.secondsRemaining}s`
                      : 'Agora'}
                    )
                  </button>
                </div>
              )}

              {(activeSkillTeachingSession?.isRecording ||
                ephemeralVoiceOverlay.cardCategory === 'GRAVACAO_SKILL_IA') && (
                <div
                  className={`mt-2.5 rounded-xl p-2.5 space-y-2 border ${
                    isDaylight
                      ? 'bg-indigo-50/80 border-indigo-200'
                      : 'bg-indigo-950/60 border-indigo-700/80'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300">
                      📱 {deviceScreenProfile.deviceModel} • Proporção{' '}
                      {deviceScreenProfile.screenAspectRatio}
                    </span>
                    <span className="rounded-md bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold">
                      Compatível & Pronta (Mesma Proporção{' '}
                      {deviceScreenProfile.screenAspectRatio})
                    </span>
                  </div>

                  {activeSkillTeachingSession && (
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {activeSkillTeachingSession.recordedSteps.map(
                        (stepText, sIdx) => (
                          <div
                            key={sIdx}
                            className={`text-[11px] rounded-lg px-2 py-1 ${
                              isDaylight
                                ? 'bg-white text-slate-800 border border-indigo-100'
                                : 'bg-slate-900 text-slate-200 border border-slate-800'
                            }`}
                          >
                            {stepText}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        addTapStepToSkillTeachingSession(
                          'Toque Dividir Pedido / Excesso de Peso'
                        )
                      }
                      className="rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 dark:bg-indigo-900/70 dark:text-indigo-100 px-2 py-1 text-[10px] font-bold cursor-pointer"
                    >
                      + Toque Dividir Pedido
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addTapStepToSkillTeachingSession(
                          'Colar Mensagem Técnica & Enviar no Chat'
                        )
                      }
                      className="rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 dark:bg-indigo-900/70 dark:text-indigo-100 px-2 py-1 text-[10px] font-bold cursor-pointer"
                    >
                      + Colar Texto & Enviar
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        cancelVoiceTeachSkillMode();
                        cancelLiveVoiceTranscription();
                      }}
                      className={`rounded-xl px-2.5 py-1.5 text-xs font-bold cursor-pointer ${
                        isDaylight
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isSavingVoiceSkill}
                      onClick={async () => {
                        setIsSavingVoiceSkill(true);
                        await completeAndSaveVoiceTaughtSkill();
                        setIsSavingVoiceSkill(false);
                      }}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-3.5 py-1.5 text-xs font-extrabold cursor-pointer shadow-xs"
                    >
                      {isSavingVoiceSkill
                        ? 'A Sintetizar no Gemini Pro...'
                        : 'Enviar p/ Gemini Pro & Guardar Skill'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Footer: Instant "Cancelar Alerta" / "Cancelar" Cutoff + Quick Dictation/Settings */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span
              className={`text-[11px] leading-tight ${
                isDaylight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Toque fora ({sizeBadgeLabel}) ou diga{' '}
              <strong className="font-semibold">&ldquo;Cancelar&rdquo;</strong> /{' '}
              <strong className="font-semibold">&ldquo;Limpar&rdquo;</strong>
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  cancelLiveVoiceTranscription();
                  setIsBubbleMinimized(false);
                  setActiveTab('voz_suporte');
                }}
                className={`rounded-xl px-2.5 py-2 text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                  isDaylight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
                title="Personalizar Posição, Tamanho (45%) e Duração do Pop-up"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Ajustar</span>
              </button>

              <button
                type="button"
                onClick={cancelLiveVoiceTranscription}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2 text-xs font-bold cursor-pointer transition shadow-xs"
              >
                Cancelar Alerta
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isBubbleMinimized) {
    const restoreFromInvisibleBubble = () => {
      cancelLiveVoiceTranscription();
      setIsBubbleMinimized(false);
    };

    return (
      <>
        {/* Ephemeral Voice Alert Pop-up (if active) */}
        <div className="pointer-events-auto">
          {renderEphemeralVoiceOverlayCard()}
        </div>

        {/* Live Transcript Feedback Pill or Two-Step Wake Pill near the Floating DB Bubble */}
        {(isTwoStepWakeActive || lastHeardLiveTranscript) && (
          <div
            style={{
              top: `${Math.max(12, bubblePositions.logo.y - 44)}px`,
              right: '14px',
              pointerEvents: 'none',
            }}
            role="status"
            aria-live="polite"
            className="fixed z-50 max-w-[300px] rounded-full bg-emerald-950/95 border border-[#00E5FF] px-3 py-1.5 text-[11px] font-bold text-emerald-100 shadow-[0_0_22px_rgba(0,229,255,0.55)] flex items-center gap-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-[#00E5FF] animate-ping shrink-0" />
            <span className="truncate">
              {isTwoStepWakeActive
                ? `🎙️ Estou a ouvir... (${twoStepWakeSecondsLeft}s)`
                : `🎙️ Ouvido: "${lastHeardLiveTranscript}"`}
            </span>
          </div>
        )}

        {/* Single Compact Draggable Circular DB Robot Mascot Bubble (74px x 74px, Transparent, Crisp Light Neon Blue Ring) */}
        <button
          type="button"
          style={{
            left: `${bubblePositions.logo.x}px`,
            top: `${bubblePositions.logo.y}px`,
            width: '74px',
            height: '74px',
            padding: '2px',
            pointerEvents: 'auto',
          }}
          onPointerDown={(e) => handleBubblePointerDown('logo', e)}
          onPointerMove={(e) => handleBubblePointerMove('logo', e)}
          onPointerUp={(e) =>
            handleBubblePointerUp('logo', e, restoreFromInvisibleBubble)
          }
          onPointerCancel={(e) => handleBubblePointerCancel('logo', e)}
          onClick={(e) =>
            handleBubbleFallbackClick('logo', e, restoreFromInvisibleBubble)
          }
          title="Toque 1x para Maximizar Delivery Buddy ou diga 'Buddy maximizar' • Arraste livremente (X, Y)"
          aria-label="Maximizar Delivery Buddy (Bolinha Flutuante DB)"
          className={`fixed z-50 rounded-full flex flex-col items-center justify-center touch-none select-none cursor-grab active:cursor-grabbing transition-all duration-200 bg-transparent ${
            isListeningSpeechRecognition
              ? 'border-[2.5px] border-[#00E5FF] ring-4 ring-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.75)]'
              : currentMascotState === 'DELIVERY'
                ? 'border-[2.5px] border-[#00E5FF] shadow-[0_0_16px_rgba(0,229,255,0.65)]'
                : currentMascotState === 'INACTIVE'
                  ? 'border-[2px] border-[#00E5FF]/60 shadow-none'
                  : 'border-[2.5px] border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.45)]'
          }`}
        >
          {(isListeningSpeechRecognition || currentMascotState === 'DELIVERY') && (
            <span
              className="absolute inset-0 rounded-full animate-ping pointer-events-none bg-[#00E5FF]/35"
            />
          )}
          <div className="h-full w-full pointer-events-none relative z-10 flex items-center justify-center">
            <img
              src={currentMascotImageUrl}
              alt="Buddy Mascote"
              style={{ objectFit: 'contain' }}
              className="h-full w-full object-contain"
            />
          </div>
        </button>
      </>
    );
  }

  return (
    <>
      {/* ±45% Screen Ephemeral Alert Pop-up */}
      {renderEphemeralVoiceOverlayCard()}
      {/* Freely Draggable Floating Bubbles */}
      {renderFloatingCornerBubblesStack()}

      {activeBubbleAnimation && !ephemeralVoiceOverlay && (
        <div
          role="status"
          aria-live="assertive"
          className="fixed top-16 right-4 z-50 max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-block rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-300">
                {activeBubbleAnimation.badgeText} •{' '}
                {activeBubbleAnimation.triggeredAt}
              </span>
              <h4 className="text-xs font-bold text-zinc-100">
                {activeBubbleAnimation.title}
              </h4>
              <p className="text-[11px] text-zinc-400 leading-snug">
                {activeBubbleAnimation.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={dismissBubbleAnimation}
              className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {isQuickSummaryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <section className="w-full max-w-[400px] max-h-[88vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-100">
                  <Bike className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-100">
                    Resumo Rápido do Turno
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Controlo de estado e acesso direto
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsQuickSummaryOpen(false)}
                className="rounded-lg p-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5">
                <span className="text-[10px] font-medium uppercase text-zinc-500 block">
                  Meta Diária
                </span>
                <div className="text-xs font-bold text-zinc-100 mt-0.5">
                  {dailyPct}% ({personalGoals.currentDailyNetEarnedEur.toFixed(0)}€)
                </div>
              </div>

              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5">
                <span className="text-[10px] font-medium uppercase text-zinc-500 block">
                  Reputação
                </span>
                <div className="text-xs font-bold text-zinc-100 mt-0.5">
                  {communityReputationPct}%
                </div>
              </div>

              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5">
                <span className="text-[10px] font-medium uppercase text-zinc-500 block">
                  Acordo Ativo
                </span>
                <div className="text-xs font-bold text-zinc-100 mt-0.5">
                  {activeJoinedZonePact
                    ? `>= ${activeJoinedZonePact.minCollectiveOrderEur.toFixed(2)}€`
                    : 'Livre'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={toggleAppPauseMode}
                className={`rounded-xl py-2 px-3 font-semibold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                  isAppPaused
                    ? 'bg-white text-zinc-950 border-white'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                }`}
              >
                {isAppPaused ? (
                  <>
                    <PlayCircle className="h-3.5 w-3.5" />
                    <span>Retomar Turno</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Pausar Turno</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={toggleAnonymousMode}
                className={`rounded-xl py-2 px-3 font-semibold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                  userPrefs.anonymousMode
                    ? 'bg-white text-zinc-950 border-white'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                }`}
              >
                {userPrefs.anonymousMode ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Anónimo: ON</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Modo Público</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={toggleTtsVoice}
                className={`rounded-xl py-2 px-3 font-semibold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                  ttsVoiceEnabled
                    ? 'bg-white text-zinc-950 border-white'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                }`}
              >
                {ttsVoiceEnabled ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Voz: ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3.5 w-3.5" />
                    <span>Voz: OFF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickSummaryOpen(false);
                  setIsBubbleMinimized(true);
                }}
                className="rounded-xl py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Micro-Logo (36x36)</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                Secções da Aplicação
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {pageCards.map((card) => {
                  const isCurrent = activeTab === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        if (card.id === 'guia_pratico') {
                          setIsQuickSummaryOpen(false);
                          openWelcomeTour();
                        } else {
                          handleNavigateFromQuickMenu(card.id);
                        }
                      }}
                      className={`rounded-xl p-2.5 text-left border transition flex flex-col justify-between gap-1.5 cursor-pointer ${
                        isCurrent
                          ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                          : 'bg-zinc-950 hover:bg-zinc-800/80 border-zinc-800 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <div className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                          {card.icon}
                        </div>
                        <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-300">
                          {card.badge}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-100 leading-snug">
                          {card.title}
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                          {card.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleNavigateFromQuickMenu('walkietalkie')}
              className="w-full rounded-xl py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <ShieldAlert className="h-4 w-4 text-zinc-300" />
              <span>Abrir Social Buddys &amp; SOS</span>
            </button>
          </section>
        </div>
      )}

      {/* LIVE OPEN-METEO AMARANTE WEATHER MODAL (Strict Light/Dark Theme Contrast + Tap-Anywhere to Mute) */}
      {isAmaranteWeatherModalOpen && (() => {
        const isDaylight = themeMode === 'DAYLIGHT';
        const modalBg = isDaylight ? '#FFFFFF' : '#05070B';
        const cardBg = isDaylight ? '#FFFFFF' : '#0B0F17';
        const pillBg = isDaylight ? '#F8FAFC' : '#111827';
        const primaryText = isDaylight ? '#090D16' : '#FFFFFF';
        const secondaryText = isDaylight ? '#475569' : '#94A3B8';
        const neonAccent = isDaylight ? '#00B8D4' : '#00E5FF';
        const neonText = isDaylight ? '#00838F' : '#00E5FF';
        const cardBorder = isDaylight ? '#00B8D4' : '#00E5FF';
        const subtleBorder = isDaylight ? '#CBD5E1' : 'rgba(0, 229, 255, 0.35)';

        return (
          <div
            style={{ backgroundColor: 'rgba(5, 7, 11, 0.85)' }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-3"
            onClick={() => {
              stopBuddySpeech();
              cancelSpeechNow();
              setIsAmaranteWeatherModalOpen(false);
            }}
          >
            <div
              style={{
                backgroundColor: modalBg,
                borderColor: cardBorder,
                color: primaryText,
              }}
              className="w-full max-w-md min-h-[82vh] max-h-[92vh] overflow-y-auto rounded-3xl border-2 p-5 shadow-2xl flex flex-col justify-between gap-4 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                stopBuddySpeech();
                cancelSpeechNow();
              }}
              title="Toque em qualquer área deste quadro para silenciar a voz imediatamente"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      style={{
                        backgroundColor: isDaylight ? '#ECFEFF' : '#0B0F17',
                        borderColor: cardBorder,
                        color: neonText,
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs sm:text-sm font-extrabold"
                    >
                      🌦️ Open-Meteo Tempo Real • Amarante
                    </span>
                    <h3
                      style={{ color: primaryText }}
                      className="text-2xl font-extrabold mt-2"
                    >
                      Clima Atual em Amarante
                    </h3>
                    <p
                      style={{ color: secondaryText }}
                      className="text-sm sm:text-base font-semibold mt-0.5"
                    >
                      Atualizado às {amaranteLiveWeather.updatedAt} • Raio 35 km
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      stopBuddySpeech();
                      cancelSpeechNow();
                      setIsAmaranteWeatherModalOpen(false);
                    }}
                    style={{
                      backgroundColor: pillBg,
                      borderColor: subtleBorder,
                      color: primaryText,
                    }}
                    className="rounded-xl border p-2.5 cursor-pointer shrink-0 transition hover:opacity-90"
                    aria-label="Fechar Clima de Amarante"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Primary Weather Metrics — Clean 2-Row Stacked Layout (Zero Text Overlap) */}
                <div
                  style={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  }}
                  className="rounded-2xl border-2 p-4 shadow-md"
                >
                  {/* Row 1 (Full Width): Weather Icon + Bold Temperature + Full Condition Badge on Right */}
                  <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-4xl sm:text-5xl select-none shrink-0 leading-none">
                        {amaranteLiveWeather.conditionEmoji}
                      </span>
                      <div
                        style={{ color: primaryText }}
                        className="text-3xl sm:text-4xl font-black tracking-tight whitespace-nowrap"
                      >
                        {isLoadingAmaranteWeather
                          ? '...'
                          : `${amaranteLiveWeather.temperatureC.toFixed(1)} °C`}
                      </div>
                    </div>
                    <div
                      style={{
                        backgroundColor: pillBg,
                        borderColor: subtleBorder,
                        color: neonText,
                      }}
                      className="rounded-xl border px-3 py-1.5 text-sm sm:text-base font-extrabold text-right leading-snug"
                    >
                      {amaranteLiveWeather.conditionLabel}
                    </div>
                  </div>

                  {/* Row 2 (2 Equal Columns): Chuva & Vento Side by Side */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div
                      style={{
                        backgroundColor: pillBg,
                        borderColor: subtleBorder,
                        color: primaryText,
                      }}
                      className="rounded-xl border px-3 py-2 text-sm sm:text-base font-extrabold flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <span>💧 Chuva:</span>
                      <span style={{ color: neonText }}>
                        {amaranteLiveWeather.rainMm.toFixed(1)} mm
                      </span>
                    </div>
                    <div
                      style={{
                        backgroundColor: pillBg,
                        borderColor: subtleBorder,
                        color: primaryText,
                      }}
                      className="rounded-xl border px-3 py-2 text-sm sm:text-base font-extrabold flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <span>💨 Vento:</span>
                      <span style={{ color: primaryText }}>
                        {amaranteLiveWeather.windSpeedKmh.toFixed(0)} km/h
                      </span>
                    </div>
                  </div>
                </div>

                {/* Road & Safety Telemetry for Couriers in Amarante */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    style={{
                      backgroundColor: cardBg,
                      borderColor: subtleBorder,
                    }}
                    className="rounded-2xl border p-3.5"
                  >
                    <span
                      style={{ color: secondaryText }}
                      className="text-xs sm:text-sm font-extrabold block"
                    >
                      Estado do Piso (Amarante)
                    </span>
                    <span
                      style={{ color: primaryText }}
                      className="text-sm sm:text-base font-black mt-1 block leading-snug"
                    >
                      {amaranteLiveWeather.rainMm > 0
                        ? '🌧️ Calçada Molhada / Escorregadia'
                        : '🛣️ Piso Seco • Aderência Normal'}
                    </span>
                  </div>
                  <div
                    style={{
                      backgroundColor: cardBg,
                      borderColor: subtleBorder,
                    }}
                    className="rounded-2xl border p-3.5"
                  >
                    <span
                      style={{ color: secondaryText }}
                      className="text-xs sm:text-sm font-extrabold block"
                    >
                      Visibilidade &amp; Vento
                    </span>
                    <span
                      style={{ color: neonText }}
                      className="text-sm sm:text-base font-black mt-1 block leading-snug"
                    >
                      {amaranteLiveWeather.windSpeedKmh > 28
                        ? '⚠️ Rajadas na Ponte S. Gonçalo'
                        : '✓ Boa Visibilidade em Rota'}
                    </span>
                  </div>
                </div>

                {/* 1-Tap Rain Bonus Toggle in Finanças */}
                <div
                  style={{
                    backgroundColor: cardBg,
                    borderColor: subtleBorder,
                  }}
                  className="rounded-2xl border p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <div
                      style={{ color: primaryText }}
                      className="text-base sm:text-lg font-extrabold"
                    >
                      ☔ Modo Chuva / Bónus de Chuva (Finanças)
                    </div>
                    <p
                      style={{ color: secondaryText }}
                      className="text-xs sm:text-sm font-semibold leading-snug mt-1"
                    >
                      Ativa o suplemento de piso molhado nas metas e cálculos de
                      lucro €/km.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      stopBuddySpeech();
                      cancelSpeechNow();
                      toggleRainBonusFinanceActive();
                    }}
                    style={
                      rainBonusFinanceActive
                        ? {
                            backgroundColor: neonAccent,
                            borderColor: neonAccent,
                            color: '#05070B',
                          }
                        : {
                            backgroundColor: pillBg,
                            borderColor: subtleBorder,
                            color: primaryText,
                          }
                    }
                    className="shrink-0 rounded-xl px-4 py-3 text-sm font-black transition cursor-pointer border shadow-xs"
                  >
                    {rainBonusFinanceActive ? 'ATIVO (ON)' : 'ATIVAR'}
                  </button>
                </div>

                {/* Audio & Refresh Actions */}
                <div className="grid grid-cols-2 gap-3">
                  {isSpeakingTts ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        stopBuddySpeech();
                        cancelSpeechNow();
                      }}
                      style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                      className="rounded-xl border border-red-400 py-3.5 px-3 text-sm sm:text-base font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <VolumeX className="h-5 w-5" />
                      <span>🔇 Parar Fala</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rainNote =
                          amaranteLiveWeather.rainMm > 0
                            ? ', com chuva'
                            : ', sem chuva';
                        speakTextPt(
                          `Amarante: ${Math.round(amaranteLiveWeather.temperatureC)} graus, ${amaranteLiveWeather.conditionLabel.toLowerCase()}${rainNote}.`
                        );
                      }}
                      style={{
                        backgroundColor: pillBg,
                        borderColor: subtleBorder,
                        color: primaryText,
                      }}
                      className="rounded-xl border py-3.5 px-3 text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer transition hover:opacity-90"
                    >
                      <Volume2
                        style={{ color: neonText }}
                        className="h-5 w-5 shrink-0"
                      />
                      <span>Ouvir em Voz Alta</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void openAndFetchAmaranteWeather(true);
                    }}
                    style={{
                      backgroundColor: pillBg,
                      borderColor: cardBorder,
                      color: neonText,
                    }}
                    className="rounded-xl border py-3.5 px-3 text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer transition hover:opacity-90"
                  >
                    <span>🔄 Atualizar Agora</span>
                  </button>
                </div>
              </div>

              {/* Larger, Ergonomic Bottom Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stopBuddySpeech();
                  cancelSpeechNow();
                  setIsAmaranteWeatherModalOpen(false);
                }}
                style={{
                  backgroundColor: neonAccent,
                  color: '#05070B',
                }}
                className="py-4 text-base sm:text-lg font-black rounded-2xl w-full shadow-lg cursor-pointer transition active:scale-[0.99]"
              >
                Fechar Clima
              </button>
            </div>
          </div>
        );
      })()}
    </>
  );
};
