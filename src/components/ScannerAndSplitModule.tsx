import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  Users,
  Scale,
  Copy,
  ClipboardCheck,
  Radio,
  Plus,
  Minus,
  CheckSquare,
  Square,
  Mic,
  Clock,
  Navigation,
  AlertTriangle,
  MapPin,
  Camera,
} from 'lucide-react';
import { CargoChecklistItemId } from '../types/models';
import { HEAVY_ITEMS_DB, SCANNER_OFFER_PRESETS } from '../data/seedData';
import { useEstafetas } from '../context/EstafetasContext';
import { buildSurgicalOfferStreetTts } from '../services/voiceEngine';

function formatWaitTimerMmSs(totalSeconds: number): string {
  const safeSecs = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSecs / 60);
  const secs = safeSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const ScannerAndSplitModule: React.FC = () => {
  const {
    activeScannedOffer,
    selectOfferPreset,
    routeTrapComplaints,
    criticalRestaurantComplaints,
    totalCostPerKm,
    vehicleProfile,
    speakTextPt,
    openRouteTrapModalFromOffer,
    recordOfferDecision,
    backpackWeightLimitKg,
    auditedOrderItems,
    updateAuditedItemQuantity,
    setAuditedOrderItemsPreset,
    totalAuditedWeightKg,
    generateOverweightDisputeProofAndLog,
    simulateSecondCourierPaired,
    toggleSimulateSecondCourier,
    cargoSplitChecklist,
    toggleCargoChecklistItem,
    setActiveTab,
    setActiveWalkieChannel,
    userPrefs,
    evaluateOfferAgainstPreferences,
    activeDeliveryLifecycle,
    startActiveDeliveryFromOffer,
    startDeliveryTransitStage,
    completeActiveDeliveryStage,
    executeVoiceCommandPt,
    activeSupportSplitMacro,
    triggerSupportSplitOrderMacro,
    isOfferAccepted,
    setIsOfferAccepted,
    aiAgentConfig,
    hasRealActiveDelivery,
    addLocationRouteNote,
    locationRouteNotes,
    realCompletedDeliveries,
    platformLedgers,
    amaranteLiveWeather,
    openAndFetchAmaranteWeather,
    themeMode,
    roadHazards,
  } = useEstafetas();

  const isDaylight = themeMode === 'DAYLIGHT';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);
  const [overweightProofCopied, setOverweightProofCopied] =
    useState<boolean>(false);
  const [includeEmptyReturnDeadZone, setIncludeEmptyReturnDeadZone] =
    useState<boolean>(false);
  const [last50mFeedback, setLast50mFeedback] = useState<string | null>(null);
  const [showWeightEditor, setShowWeightEditor] = useState<boolean>(false);

  // Only show ride values when a real order has entered (auto-detected, voice-calculated, or screenshot uploaded)
  const hasActiveOrder = !activeScannedOffer.id.startsWith('PRESET-');

  useEffect(() => {
    if (
      aiAgentConfig.productionModeRealOnly &&
      !hasRealActiveDelivery &&
      isOfferAccepted
    ) {
      setIsOfferAccepted(false);
    }
  }, [
    aiAgentConfig.productionModeRealOnly,
    hasRealActiveDelivery,
    isOfferAccepted,
    setIsOfferAccepted,
  ]);

  useEffect(() => {
    if (activeDeliveryLifecycle.stage === 'CONCLUIDA') {
      setDecisionFeedback(null);
    }
  }, [activeDeliveryLifecycle.stage]);

  // 1. Earnings Breakdown by App (Uber Eats, Glovo, Bolt Food) + Total Today
  const earningsTodayByApp = useMemo(() => {
    const sumForPlatform = (plat: 'Uber Eats' | 'Glovo' | 'Bolt Food') => {
      const fromReal = realCompletedDeliveries
        .filter((d) => d.platform === plat)
        .reduce((acc, d) => acc + (d.netProfitEur || 0), 0);
      const fromLedger = platformLedgers?.[plat]?.dailyNetEarnedEur || 0;
      return Math.max(fromReal, fromLedger);
    };
    const uber = sumForPlatform('Uber Eats');
    const glovo = sumForPlatform('Glovo');
    const bolt = sumForPlatform('Bolt Food');
    const total = uber + glovo + bolt;
    return {
      uber,
      glovo,
      bolt,
      total,
    };
  }, [realCompletedDeliveries, platformLedgers]);

  const formatEurPt = (val: number): string =>
    `€${val.toFixed(2).replace('.', ',')}`;

  const matchedRouteTrap = useMemo(() => {
    if (!hasActiveOrder) return undefined;
    if (activeScannedOffer.matchedRouteTrapId) {
      const byId = routeTrapComplaints.find(
        (t) => t.id === activeScannedOffer.matchedRouteTrapId
      );
      if (byId) return byId;
    }
    const searchHaystack = `${activeScannedOffer.originName} ${activeScannedOffer.destinationName} ${activeScannedOffer.segmentText} ${activeScannedOffer.cityZone}`.toLowerCase();
    return routeTrapComplaints.find((trap) => {
      const seg = (trap.segmentOriginDest || '').toLowerCase();
      return (
        (searchHaystack.includes('flores') && searchHaystack.includes('chiado')) ||
        (searchHaystack.includes('almirante reis') &&
          searchHaystack.includes('graça')) ||
        (searchHaystack.includes('ribeira') && searchHaystack.includes('batalha')) ||
        (seg.length > 6 && searchHaystack.includes(seg.slice(0, 12)))
      );
    });
  }, [hasActiveOrder, activeScannedOffer, routeTrapComplaints]);

  const matchedCriticalRestaurant = useMemo(() => {
    if (!hasActiveOrder) return undefined;
    if (activeScannedOffer.matchedRestaurantComplaintId) {
      const byId = criticalRestaurantComplaints.find(
        (r) => r.id === activeScannedOffer.matchedRestaurantComplaintId
      );
      if (byId) return byId;
    }
    const originLower = activeScannedOffer.originName.toLowerCase();
    return criticalRestaurantComplaints.find((r) => {
      const restName = (r.restaurantName || r.title).toLowerCase();
      return (
        (originLower.includes('burger king') &&
          restName.includes('burger king')) ||
        (originLower.includes('mcdonald') && restName.includes('mcdonald'))
      );
    });
  }, [hasActiveOrder, activeScannedOffer, criticalRestaurantComplaints]);

  const isOverweight =
    hasActiveOrder &&
    (totalAuditedWeightKg > backpackWeightLimitKg ||
      Boolean(activeScannedOffer.isSplitOrderCandidate));

  const requiredCouriersCount = Math.max(
    2,
    Math.ceil(
      Math.max(totalAuditedWeightKg, 14.8) / Math.max(1, backpackWeightLimitKg)
    )
  );

  const isPeripheralDeadZoneDetected = useMemo(() => {
    if (!hasActiveOrder) return false;
    const destHaystack = `${activeScannedOffer.destinationName} ${activeScannedOffer.segmentText} ${activeScannedOffer.cityZone}`.toLowerCase();
    return (
      destHaystack.includes('freixo') ||
      destHaystack.includes('lixa') ||
      destHaystack.includes('vila meã') ||
      destHaystack.includes('vila mea') ||
      destHaystack.includes('marco') ||
      destHaystack.includes('gatão') ||
      destHaystack.includes('fregim') ||
      destHaystack.includes('telões')
    );
  }, [hasActiveOrder, activeScannedOffer]);

  const effectiveEmptyReturn =
    hasActiveOrder &&
    (includeEmptyReturnDeadZone || isPeripheralDeadZoneDetected);

  const auditMetrics = useMemo(() => {
    const grossEur = Math.max(0.5, activeScannedOffer.grossAmountEur);
    const announcedKm = Math.max(0.1, activeScannedOffer.appAnnouncedKm);
    const forcedDetourKm = matchedRouteTrap
      ? matchedRouteTrap.unpaidDetourKm ??
        Math.max(
          0,
          Number(
            (
              (matchedRouteTrap.realLegalKm ?? announcedKm) -
              (matchedRouteTrap.appAnnouncedKm ?? announcedKm)
            ).toFixed(1)
          )
        )
      : 0;

    const realTotalKm = Number((announcedKm + forcedDetourKm).toFixed(1));
    const emptyReturnKm = effectiveEmptyReturn
      ? Number((realTotalKm * 0.4).toFixed(1))
      : 0;
    const effectiveTotalKmWithReturn = Number(
      (realTotalKm + emptyReturnKm).toFixed(1)
    );

    const activeTotalKm = effectiveEmptyReturn
      ? effectiveTotalKmWithReturn
      : realTotalKm;

    const safeCostPerKm = Math.min(0.35, Math.max(0.05, totalCostPerKm));
    const realTripCostEur = Number(
      (activeTotalKm * safeCostPerKm).toFixed(2)
    );

    const realNetProfitEur = Number(
      Math.max(0.4, grossEur - realTripCostEur).toFixed(2)
    );
    const grossEurPerKm = Number(
      Math.max(0.15, grossEur / activeTotalKm).toFixed(2)
    );
    const realNetEurPerKm = Number(
      Math.max(0.15, realNetProfitEur / realTotalKm).toFixed(2)
    );
    const realNetEurPerKmWithReturn = Number(
      Math.max(0.15, realNetProfitEur / effectiveTotalKmWithReturn).toFixed(2)
    );

    const effectiveAuditedEurPerKm = effectiveEmptyReturn
      ? realNetEurPerKmWithReturn
      : realNetEurPerKm;

    const stolenByDetourEur = Number(
      (forcedDetourKm * vehicleProfile.platformKmReferenceRate).toFixed(2)
    );

    const extraWaitMins = matchedCriticalRestaurant?.avgWaitTimeMinutes ?? 0;
    const realTotalMinutes = Math.max(
      8,
      activeScannedOffer.estimatedMinutes +
        (forcedDetourKm > 0 ? Math.round(forcedDetourKm * 3) : 0) +
        (emptyReturnKm > 0 ? Math.round(emptyReturnKm * 2) : 0) +
        (extraWaitMins > 25 ? 10 : 0)
    );

    const projectedHourlyNetEur = Number(
      Math.max(9.5, (realNetProfitEur / realTotalMinutes) * 60).toFixed(2)
    );

    const hasCriticalTrap =
      forcedDetourKm > 0 ||
      Boolean(matchedCriticalRestaurant && extraWaitMins >= 25) ||
      isOverweight;

    const prefVerdict = evaluateOfferAgainstPreferences(
      grossEur,
      effectiveAuditedEurPerKm,
      hasCriticalTrap,
      activeScannedOffer.originName
    );

    let verdictCode: 'ACEITAR' | 'RECUSAR' = 'ACEITAR';
    let verdictLabel = 'COMPENSA ACEITAR';
    let verdictSummary = effectiveEmptyReturn
      ? `c/ Retorno (+${emptyReturnKm.toFixed(1)} km) • +${Math.abs(projectedHourlyNetEur).toFixed(2)}\u00A0€/h`
      : `Rota limpa • +${Math.abs(projectedHourlyNetEur).toFixed(2)}\u00A0€/h`;

    if (
      prefVerdict.matchedBlacklistEntry ||
      (!prefVerdict.passesMinGross &&
        userPrefs.filterLogicMode !== 'APENAS_RENTABILIDADE_KM') ||
      forcedDetourKm > 0 ||
      !prefVerdict.passesFilterLogic ||
      (matchedCriticalRestaurant && extraWaitMins >= 25) ||
      isOverweight
    ) {
      verdictCode = 'RECUSAR';
      verdictLabel = isOverweight
        ? 'EXIGE DIVISÃO / RECUSAR'
        : 'NÃO COMPENSA';

      if (prefVerdict.matchedBlacklistEntry) {
        verdictSummary = 'Lista Negra Pessoal';
      } else if (forcedDetourKm > 0) {
        verdictSummary = `Desvio +${forcedDetourKm.toFixed(1)} km não pago`;
      } else if (matchedCriticalRestaurant && extraWaitMins >= 25) {
        verdictSummary = `Espera >${extraWaitMins} min no local`;
      } else if (isOverweight) {
        verdictSummary = `Excesso de peso (${Math.max(totalAuditedWeightKg, 14.8).toFixed(1)} kg > ${backpackWeightLimitKg.toFixed(0)} kg)`;
      } else if (effectiveEmptyReturn) {
        verdictSummary = `Retorno vazio (${realNetEurPerKmWithReturn.toFixed(2)}\u00A0€/km < mín.)`;
      } else {
        verdictSummary = `Abaixo do mínimo (${userPrefs.minGrossOrderValueEur.toFixed(2)}\u00A0€)`;
      }
    }

    const ttsMessage = buildSurgicalOfferStreetTts({
      platform: activeScannedOffer.platform,
      verdictCode,
      netProfitEur: realNetProfitEur,
      netEurPerKm: effectiveAuditedEurPerKm,
      isOverweight,
      totalWeightKg: isOverweight
        ? Math.max(totalAuditedWeightKg, 14.8)
        : totalAuditedWeightKg,
    });

    return {
      grossEur,
      announcedKm,
      forcedDetourKm,
      realTotalKm,
      emptyReturnKm,
      effectiveTotalKmWithReturn,
      activeTotalKm,
      realTripCostEur,
      realNetProfitEur,
      grossEurPerKm,
      realNetEurPerKm,
      realNetEurPerKmWithReturn,
      effectiveAuditedEurPerKm,
      stolenByDetourEur,
      extraWaitMins,
      realTotalMinutes,
      projectedHourlyNetEur,
      verdictCode,
      verdictLabel,
      verdictSummary,
      ttsMessage,
      prefVerdict,
    };
  }, [
    activeScannedOffer,
    matchedRouteTrap,
    matchedCriticalRestaurant,
    totalCostPerKm,
    vehicleProfile,
    totalAuditedWeightKg,
    backpackWeightLimitKg,
    isOverweight,
    userPrefs,
    evaluateOfferAgainstPreferences,
    effectiveEmptyReturn,
  ]);

  const routeProblemsAndAlerts = useMemo(() => {
    if (!hasActiveOrder) return [];
    const alerts: {
      id: string;
      badge: string;
      text: string;
      isCritical?: boolean;
    }[] = [];
    const haystack = `${activeScannedOffer.originName} ${activeScannedOffer.destinationName} ${activeScannedOffer.segmentText} ${activeScannedOffer.cityZone}`.toLowerCase();

    if (
      haystack.includes('são gonçalo') ||
      haystack.includes('sao goncalo') ||
      haystack.includes('centro') ||
      haystack.includes('santa luzia') ||
      haystack.includes('ferroviária')
    ) {
      alerts.push({
        id: 'steep-cobble',
        badge: '⛰️ Subida / Empedrado',
        text: 'Zona histórica de Amarante com calçada/empedrado e inclinação acentuada.',
      });
    } else {
      alerts.push({
        id: 'terrain-info',
        badge: '🛣️ Relevo & Trânsito',
        text: `Trânsito fluído na rota (${activeScannedOffer.cityZone || 'Amarante'}) • Atenção a subidas no acesso final.`,
      });
    }

    if (effectiveEmptyReturn) {
      alerts.push({
        id: 'empty-return',
        badge: '🔄 Retorno Vazio (+40% KM)',
        text: `Zona periférica detetada (+${auditMetrics.emptyReturnKm.toFixed(1)} km de regresso sem pedido incluído no cálculo).`,
        isCritical: true,
      });
    }

    if (amaranteLiveWeather.rainMm > 0) {
      alerts.push({
        id: 'rain-hazard',
        badge: '🌧️ Piso Molhado',
        text: `Chuva em Amarante (${amaranteLiveWeather.rainMm.toFixed(1)} mm) — distância de travagem aumentada e calçada escorregadia.`,
        isCritical: true,
      });
    }

    if (matchedRouteTrap) {
      alerts.push({
        id: 'route-trap',
        badge: `🚧 Desvio +${auditMetrics.forcedDetourKm.toFixed(1)} km`,
        text: `${matchedRouteTrap.title}: ${matchedRouteTrap.description}`,
        isCritical: true,
      });
    }

    if (matchedCriticalRestaurant) {
      alerts.push({
        id: 'rest-wait',
        badge: `⏳ Espera >${auditMetrics.extraWaitMins} min`,
        text: `${matchedCriticalRestaurant.restaurantName}: tempo médio de espera elevado na recolha.`,
        isCritical: true,
      });
    }

    const activeRoadHazard = roadHazards?.find((h) => !h.resolved);
    if (activeRoadHazard && alerts.length < 4) {
      alerts.push({
        id: 'road-hazard',
        badge: `⚠️ ${activeRoadHazard.hazardType}`,
        text: `${activeRoadHazard.streetLocation} (${activeRoadHazard.cityZone})`,
      });
    }

    return alerts;
  }, [
    hasActiveOrder,
    activeScannedOffer,
    effectiveEmptyReturn,
    auditMetrics.emptyReturnKm,
    auditMetrics.forcedDetourKm,
    auditMetrics.extraWaitMins,
    amaranteLiveWeather.rainMm,
    matchedRouteTrap,
    matchedCriticalRestaurant,
    roadHazards,
  ]);

  const activeItemsSummaryText = useMemo(() => {
    const parts: string[] = [];
    auditedOrderItems.forEach((entry) => {
      if (entry.quantity <= 0) return;
      const ref = HEAVY_ITEMS_DB.find((i) => i.id === entry.itemId);
      if (ref) {
        parts.push(
          `${entry.quantity}x ${ref.name} (${(
            ref.unitWeightKg * entry.quantity
          ).toFixed(1)} kg)`
        );
      }
    });
    return parts.length > 0
      ? parts.join(' + ')
      : 'Carga pesada (> 12.0 kg — Exige Divisão)';
  }, [auditedOrderItems]);

  const handleScreenshotFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileNameLower = file.name.toLowerCase();
    let basePreset = SCANNER_OFFER_PRESETS[0];
    if (fileNameLower.includes('pilarete') || fileNameLower.includes('chiado')) {
      basePreset = SCANNER_OFFER_PRESETS[1];
    } else if (
      fileNameLower.includes('dividido') ||
      fileNameLower.includes('4829')
    ) {
      basePreset = SCANNER_OFFER_PRESETS[2];
    } else if (
      fileNameLower.includes('bolt') ||
      fileNameLower.includes('burger')
    ) {
      basePreset = SCANNER_OFFER_PRESETS[3];
    }
    const uploadedOffer = {
      ...basePreset,
      id: `UPLOAD-${Date.now()}`,
    };
    selectOfferPreset(uploadedOffer);
    const netProfit = Math.max(
      0.4,
      uploadedOffer.grossAmountEur - uploadedOffer.appAnnouncedKm * 0.16
    );
    const netPerKm = netProfit / Math.max(0.1, uploadedOffer.appAnnouncedKm);
    speakTextPt(
      buildSurgicalOfferStreetTts({
        platform: uploadedOffer.platform,
        verdictCode: netPerKm >= 1.1 ? 'ACEITAR' : 'RECUSAR',
        netProfitEur: netProfit,
        netEurPerKm: netPerKm,
      })
    );
    e.target.value = '';
  };

  const handleRecordDecision = (verdict: 'ACEITE' | 'RECUSADA') => {
    recordOfferDecision(
      activeScannedOffer,
      auditMetrics.activeTotalKm,
      auditMetrics.realNetProfitEur,
      auditMetrics.effectiveAuditedEurPerKm,
      verdict
    );
    if (verdict === 'RECUSADA') {
      selectOfferPreset(SCANNER_OFFER_PRESETS[0]);
      setDecisionFeedback(null);
      return;
    }
    setDecisionFeedback(
      `Corrida aceite (+${auditMetrics.realNetProfitEur.toFixed(2)} € líq.) • Em curso.`
    );
  };

  const handleGenerateOverweightComplaint = async () => {
    const effectiveKg = Math.max(totalAuditedWeightKg, 14.8);
    const { text } = generateOverweightDisputeProofAndLog(
      activeScannedOffer,
      effectiveKg,
      backpackWeightLimitKg,
      activeItemsSummaryText
    );
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
    }
    setOverweightProofCopied(true);
    setTimeout(() => setOverweightProofCopied(false), 3000);
  };

  const cargoChecklistRows: {
    id: CargoChecklistItemId;
    label: string;
  }[] = [
    {
      id: 'CARGO_GRADE_CERVEJA_14_8',
      label: 'Levei 1x Grade de Cerveja (14.8 kg)',
    },
    {
      id: 'CARGO_GARRAFOES_AGUA_12_2',
      label: 'Ficou p/ colega: 2x Garrafões Água 6L (12.2 kg)',
    },
    {
      id: 'CARGO_AGUARDAR_COLEGA_MORADA',
      label: 'Aguardar colega na morada do cliente',
    },
  ];

  const displayedWeightKg = isOverweight
    ? Math.max(totalAuditedWeightKg, 14.8)
    : totalAuditedWeightKg;

  return (
    <div className="space-y-3">
      {/* Hidden Screenshot File Input for "📷 Mostrar Pedido / Print" */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleScreenshotFileUpload}
        className="hidden"
      />

      {/* =====================================================================
          TOP ROW: 2 CARDS ONLY (GANHOS HOJE & CLIMA AMARANTE)
          ===================================================================== */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* CARD 1: GANHOS HOJE (Total + Breakdown by Uber Eats, Glovo, Bolt Food) */}
        <div
          className={`rounded-2xl border p-3 flex flex-col justify-between shadow-xs ${
            isDaylight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-slate-800/95 border-slate-700 text-slate-100'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  isDaylight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                GANHOS HOJE
              </span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isDaylight
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-emerald-950/70 text-emerald-300'
                }`}
              >
                {realCompletedDeliveries.length} ent.
              </span>
            </div>
            <div className="text-xl font-black text-emerald-500 tracking-tight mt-0.5 font-mono">
              {formatEurPt(earningsTodayByApp.total)}
            </div>
          </div>

          <div
            className={`mt-2 pt-2 border-t space-y-1 text-[10px] font-semibold ${
              isDaylight ? 'border-slate-100' : 'border-slate-700/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={isDaylight ? 'text-slate-600' : 'text-slate-300'}>
                Uber Eats
              </span>
              <span
                className={`font-mono font-bold ${
                  isDaylight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {formatEurPt(earningsTodayByApp.uber)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={isDaylight ? 'text-slate-600' : 'text-slate-300'}>
                Glovo
              </span>
              <span
                className={`font-mono font-bold ${
                  isDaylight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {formatEurPt(earningsTodayByApp.glovo)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={isDaylight ? 'text-slate-600' : 'text-slate-300'}>
                Bolt Food
              </span>
              <span
                className={`font-mono font-bold ${
                  isDaylight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {formatEurPt(earningsTodayByApp.bolt)}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: CLIMA AMARANTE (High-Contrast Dark/Light Text, Click to Open Modal & Speak) */}
        <button
          type="button"
          onClick={() => void openAndFetchAmaranteWeather(true)}
          title="Toque para abrir detalhes do Clima em Amarante e ouvir previsão em voz alta"
          className={`rounded-2xl border p-3 flex flex-col justify-between text-left cursor-pointer transition shadow-xs ${
            isDaylight
              ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900'
              : 'bg-slate-800/95 hover:bg-slate-800 border-slate-700 text-slate-100'
          }`}
        >
          <div className="w-full">
            <div className="flex items-center justify-between gap-1">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  isDaylight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                CLIMA AMARANTE
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                Ver →
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl leading-none select-none">
                {amaranteLiveWeather.conditionEmoji}
              </span>
              <div>
                <div
                  style={{ color: isDaylight ? '#0f172a' : '#f8fafc' }}
                  className="text-lg font-black tracking-tight leading-none font-mono"
                >
                  {amaranteLiveWeather.temperatureC.toFixed(1)} °C
                </div>
                <div
                  style={{ color: isDaylight ? '#334155' : '#cbd5e1' }}
                  className="text-[10px] font-extrabold mt-0.5 truncate"
                >
                  Amarante
                </div>
              </div>
            </div>
          </div>

          <div
            className={`mt-2 pt-2 border-t w-full space-y-1 text-[10px] ${
              isDaylight ? 'border-slate-100' : 'border-slate-700/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                style={{ color: isDaylight ? '#475569' : '#94a3b8' }}
                className="font-semibold truncate"
              >
                Estado:
              </span>
              <span
                style={{ color: isDaylight ? '#0f172a' : '#f8fafc' }}
                className="font-bold truncate ml-1"
              >
                {amaranteLiveWeather.conditionLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                style={{ color: isDaylight ? '#475569' : '#94a3b8' }}
                className="font-semibold"
              >
                Chuva / Vento:
              </span>
              <span
                style={{ color: isDaylight ? '#0f172a' : '#f8fafc' }}
                className="font-mono font-bold"
              >
                {amaranteLiveWeather.rainMm.toFixed(1)}mm •{' '}
                {amaranteLiveWeather.windSpeedKmh.toFixed(0)}km/h
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* =====================================================================
          MAIN PANEL: DADOS DA CORRIDA ATUAL (CLEAN LABELS WITH — UNTIL ORDER ENTERS)
          ===================================================================== */}
      <section className="rounded-2xl bg-zinc-900/95 border border-zinc-800 p-3.5 space-y-3 shadow-sm">
        {/* Panel Top Header: Full Title + Discreet "📷 Mostrar Pedido / Print" Button */}
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                hasActiveOrder ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
              }`}
            />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-100">
              DADOS DA CORRIDA ATUAL
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2.5 py-1 text-[10px] font-bold text-zinc-100 flex items-center gap-1 cursor-pointer transition whitespace-nowrap"
            >
              <Camera className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>📷 Mostrar Pedido / Print</span>
            </button>

            {hasActiveOrder && (
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-extrabold ${
                  auditMetrics.verdictCode === 'ACEITAR'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {auditMetrics.verdictCode === 'ACEITAR' ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                <span>{auditMetrics.verdictLabel}</span>
              </span>
            )}
          </div>
        </div>

        {/* 1. ROTA / PARA ONDE É */}
        <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>1. ROTA / PARA ONDE É</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1 text-xs pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400 font-semibold">Plataforma:</span>
              <span className="font-bold text-zinc-100">
                {hasActiveOrder
                  ? `${activeScannedOffer.platform}${
                      activeScannedOffer.orderId
                        ? ` • ${activeScannedOffer.orderId}`
                        : ''
                    }`
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400 font-semibold">Recolha:</span>
              <span className="font-bold text-zinc-100 text-right">
                {hasActiveOrder ? activeScannedOffer.originName : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400 font-semibold">Destino:</span>
              <span className="font-extrabold text-emerald-500 text-right">
                {hasActiveOrder ? activeScannedOffer.destinationName : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-900">
              <span className="text-zinc-400 font-semibold">
                Tempo Estimado:
              </span>
              <span className="font-mono font-bold text-zinc-100">
                {hasActiveOrder ? `~${auditMetrics.realTotalMinutes} min` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. VALORES & CÁLCULOS (2x2 GRID SO LABELS NEVER TRUNCATE) */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block px-0.5">
            2. VALORES &amp; CÁLCULOS
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-2.5">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                VALOR BRUTO
              </span>
              <span className="text-sm font-mono font-bold text-zinc-100 mt-0.5 block">
                {hasActiveOrder ? `${auditMetrics.grossEur.toFixed(2)} €` : '—'}
              </span>
            </div>

            <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-2.5">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                CUSTO DA ROTA
              </span>
              <span className="text-sm font-mono font-bold text-rose-500 mt-0.5 block">
                {hasActiveOrder
                  ? `-${auditMetrics.realTripCostEur.toFixed(2)} €`
                  : '—'}
              </span>
            </div>

            <div className="rounded-xl bg-zinc-950 border border-emerald-500/40 p-2.5">
              <span className="text-[10px] font-extrabold uppercase text-emerald-500 block">
                LUCRO LÍQUIDO
              </span>
              <span className="text-sm font-mono font-black text-emerald-500 mt-0.5 block">
                {hasActiveOrder
                  ? `+${auditMetrics.realNetProfitEur.toFixed(2)} €`
                  : '—'}
              </span>
            </div>

            <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-2.5">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                PROJEÇÃO €/HORA
              </span>
              <span className="text-sm font-mono font-bold text-amber-500 mt-0.5 block">
                {hasActiveOrder
                  ? `${auditMetrics.projectedHourlyNetEur.toFixed(2)} €/h`
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. DISTÂNCIA & RENTABILIDADE (€ / KM) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 px-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
              3. DISTÂNCIA &amp; RENTABILIDADE (€ / KM)
            </span>
            {hasActiveOrder && (
              <button
                type="button"
                onClick={() => setIncludeEmptyReturnDeadZone((prev) => !prev)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold cursor-pointer transition ${
                  effectiveEmptyReturn
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-300'
                }`}
              >
                {effectiveEmptyReturn
                  ? '🔄 Retorno +40% ON'
                  : '+ Retorno Vazio (40%)'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-2.5">
              <span className="text-[9px] font-bold uppercase text-zinc-400 block leading-tight">
                DISTÂNCIA TOTAL
              </span>
              <span className="text-sm font-mono font-extrabold text-zinc-100 mt-1 block">
                {hasActiveOrder
                  ? `${auditMetrics.activeTotalKm.toFixed(1)} km`
                  : '—'}
              </span>
            </div>

            <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-2.5">
              <span className="text-[9px] font-bold uppercase text-zinc-400 block leading-tight">
                € / KM BRUTO
              </span>
              <span className="text-sm font-mono font-bold text-zinc-100 mt-1 block">
                {hasActiveOrder
                  ? `${auditMetrics.grossEurPerKm.toFixed(2)} €/km`
                  : '—'}
              </span>
            </div>

            <div className="rounded-xl bg-zinc-950 border border-emerald-500/40 p-2.5">
              <span className="text-[9px] font-extrabold uppercase text-emerald-500 block leading-tight">
                € / KM LÍQUIDO
              </span>
              <span className="text-sm font-mono font-black text-emerald-500 mt-1 block">
                {hasActiveOrder
                  ? `${auditMetrics.effectiveAuditedEurPerKm.toFixed(2)} €/km`
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. PROBLEMAS NA ROTA & ALERTAS (+ DIVISÃO DE PESO ONLY IF > 12 KG) */}
        <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
              <span>4. PROBLEMAS NA ROTA &amp; ALERTAS</span>
            </span>
            {hasActiveOrder && matchedRouteTrap && (
              <button
                type="button"
                onClick={() =>
                  openRouteTrapModalFromOffer(
                    activeScannedOffer,
                    auditMetrics.forcedDetourKm || 1.5
                  )
                }
                className="rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-bold text-zinc-200 cursor-pointer"
              >
                Gerar Prova Desvio
              </button>
            )}
          </div>

          {!hasActiveOrder ? (
            <p className="text-xs text-zinc-400 py-0.5">
              Sem alertas ativos (aguardando pedido)
            </p>
          ) : (
            <div className="space-y-1.5">
              {routeProblemsAndAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg px-2.5 py-1.5 border text-[11px] flex items-start gap-2 ${
                    alert.isCritical
                      ? 'bg-rose-950/30 border-rose-500/40 text-zinc-100'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-200'
                  }`}
                >
                  <span className="font-extrabold shrink-0 whitespace-nowrap">
                    {alert.badge}:
                  </span>
                  <span className="text-zinc-300 leading-snug">
                    {alert.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* WEIGHT DIVISION ALERT & CONTROLS — SHOWN ONLY WHEN ACTIVE ORDER EXCEEDS 12 KG */}
          {isOverweight && (
            <div className="mt-2 pt-2.5 border-t border-rose-500/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Scale className="h-4 w-4 text-rose-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-extrabold text-rose-400 block">
                      ⚠️ Excesso de Peso Detetado ({displayedWeightKg.toFixed(1)} kg &gt;{' '}
                      {backpackWeightLimitKg.toFixed(0)} kg)
                    </span>
                    <span className="text-[10px] text-zinc-300 block">
                      {activeItemsSummaryText}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWeightEditor((prev) => !prev)}
                  className="rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-2 py-1 text-[10px] font-bold text-zinc-200 cursor-pointer shrink-0"
                >
                  {showWeightEditor ? 'Ocultar Itens' : 'Ajustar Peso'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    triggerSupportSplitOrderMacro(activeScannedOffer.platform)
                  }
                  className="rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] py-2 px-2.5 flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>Dividir Pedido no Suporte</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateOverweightComplaint}
                  className="rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-bold text-[11px] py-2 px-2.5 flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  {overweightProofCopied ? (
                    <>
                      <ClipboardCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Prova Copiada ({requiredCouriersCount} Est.)</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar Prova ({requiredCouriersCount} Estafetas)</span>
                    </>
                  )}
                </button>
              </div>

              {activeSupportSplitMacro.triggeredAtTimestamp !== null && (
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-[10px] text-zinc-300 space-y-1">
                  <div className="flex items-center justify-between font-bold text-zinc-100">
                    <span>
                      Macro Suporte {activeSupportSplitMacro.platform} (Pronta)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAuditedOrderItemsPreset('NORMAL_2_4KG')}
                      className="text-[10px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      Repor &le;12kg
                    </button>
                  </div>
                  <p className="line-clamp-2 text-zinc-300">
                    {activeSupportSplitMacro.autoPastedMessage}
                  </p>
                </div>
              )}

              {showWeightEditor && (
                <div className="space-y-1.5 pt-1">
                  {HEAVY_ITEMS_DB.map((item) => {
                    const currentEntry = auditedOrderItems.find(
                      (e) => e.itemId === item.id
                    );
                    const qty = currentEntry?.quantity ?? 0;
                    return (
                      <div
                        key={item.id}
                        className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="text-[11px] font-medium text-zinc-100 block">
                            {item.name} ({item.unitWeightKg.toFixed(1)} kg)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateAuditedItemQuantity(item.id, -1)}
                            className="h-6 w-6 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300 cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center font-mono text-xs font-semibold text-zinc-100">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateAuditedItemQuantity(item.id, 1)}
                            className="h-6 w-6 rounded bg-white text-zinc-950 flex items-center justify-center font-semibold cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-100 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-emerald-400" />
                        <span>
                          2.º Estafeta Parceiro:{' '}
                          {simulateSecondCourierPaired
                            ? 'Conectado'
                            : 'A aguardar...'}
                        </span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={toggleSimulateSecondCourier}
                          className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-200 cursor-pointer"
                        >
                          {simulateSecondCourierPaired ? 'Ativo' : 'Simular'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveWalkieChannel('PARCEIRO_PEDIDO_DIVIDIDO');
                            setActiveTab('walkietalkie');
                          }}
                          className="rounded bg-emerald-500 text-slate-950 px-2 py-0.5 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <Radio className="h-2.5 w-2.5" />
                          <span>Rádio</span>
                        </button>
                      </div>
                    </div>
                    {cargoChecklistRows.map((row) => {
                      const checked = cargoSplitChecklist[row.id];
                      return (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => toggleCargoChecklistItem(row.id)}
                          className="w-full rounded px-2 py-1 bg-zinc-950 border border-zinc-800 text-left flex items-center gap-1.5 text-[10px] text-zinc-200 cursor-pointer"
                        >
                          {checked ? (
                            <CheckSquare className="h-3 w-3 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="h-3 w-3 text-zinc-500 shrink-0" />
                          )}
                          <span>{row.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIDE DECISION ACTIONS OR ACTIVE LIFECYCLE (ONLY SHOWN WHEN AN ORDER HAS ENTERED) */}
        {hasActiveOrder && !isOfferAccepted && (
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => handleRecordDecision('ACEITE')}
              className="flex-1 rounded-xl py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Aceitar Corrida</span>
            </button>

            <button
              type="button"
              onClick={() => handleRecordDecision('RECUSADA')}
              className="flex-1 rounded-xl py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <XCircle className="h-4 w-4" />
              <span>Recusar</span>
            </button>

            <button
              type="button"
              onClick={() => speakTextPt(auditMetrics.ttsMessage)}
              title="Ouvir análise da corrida em voz alta"
              aria-label="Ouvir análise da corrida em voz alta"
              className="rounded-xl p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 cursor-pointer transition shrink-0"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {hasActiveOrder && isOfferAccepted && (
          <div className="rounded-xl bg-zinc-950 border border-emerald-500/40 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Navigation className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs font-extrabold text-zinc-100">
                  Entrega em Curso ({activeDeliveryLifecycle.orderId})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOfferAccepted(false)}
                className="rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 cursor-pointer shrink-0"
              >
                Voltar aos Dados
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-[10px]">
              <button
                type="button"
                onClick={() =>
                  startActiveDeliveryFromOffer(
                    activeScannedOffer,
                    auditMetrics.activeTotalKm,
                    auditMetrics.realNetProfitEur
                  )
                }
                className={`rounded py-1 px-1.5 text-center transition cursor-pointer ${
                  activeDeliveryLifecycle.stage === 'AGUARDAR_RECOLHA'
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                1. Na Recolha
              </button>
              <button
                type="button"
                onClick={() => startDeliveryTransitStage()}
                className={`rounded py-1 px-1.5 text-center transition cursor-pointer ${
                  activeDeliveryLifecycle.stage === 'EM_TRANSITO'
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                2. Em Trânsito
              </button>
              <button
                type="button"
                onClick={() => {
                  setDecisionFeedback(null);
                  completeActiveDeliveryStage();
                }}
                className={`rounded py-1 px-1.5 text-center transition cursor-pointer ${
                  activeDeliveryLifecycle.stage === 'CONCLUIDA'
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                3. Concluir
              </button>
            </div>

            {activeDeliveryLifecycle.stage === 'AGUARDAR_RECOLHA' && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-200">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>
                    Espera:{' '}
                    {formatWaitTimerMmSs(
                      activeDeliveryLifecycle.waitSecondsAtStore
                    )}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => startDeliveryTransitStage()}
                  className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-1.5 px-3 text-xs font-extrabold cursor-pointer transition"
                >
                  Iniciar Trânsito →
                </button>
              </div>
            )}

            {activeDeliveryLifecycle.stage === 'EM_TRANSITO' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1">
                  {[
                    {
                      label: '🚪 Porta Lateral',
                      tag: 'Morada difícil de encontrar (Sem número / Entrada oculta)' as const,
                      note: 'Entrada pela porta lateral / traseira do edifício.',
                    },
                    {
                      label: '🪜 3.º s/ Elevador',
                      tag: 'Rota proibida / Pilaretes / Escadaria' as const,
                      note: 'Prédio sem elevador (escadas íngremes).',
                    },
                    {
                      label: '🐕 Cão Solto',
                      tag: 'Animais soltos no local' as const,
                      note: 'Atenção: Cão solto no portão / entrada.',
                    },
                    {
                      label: '🔕 Campainha Off',
                      tag: 'Morada difícil de encontrar (Sem número / Entrada oculta)' as const,
                      note: 'Campainha avariada — ligar ou bater à porta.',
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        addLocationRouteNote({
                          streetOrZone:
                            activeDeliveryLifecycle.destinationName ||
                            'Centro de Amarante',
                          orderCodeRef: activeDeliveryLifecycle.orderId,
                          category: item.tag,
                          noteText: `${activeDeliveryLifecycle.destinationName}: ${item.note}`,
                        });
                        speakTextPt(`Nota gravada: ${item.label}.`);
                        setLast50mFeedback(`Guardado: ${item.label}`);
                        setTimeout(() => setLast50mFeedback(null), 3000);
                      }}
                      className="rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-200 text-left cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {last50mFeedback && (
                  <p className="text-[10px] font-bold text-emerald-400">
                    ✅ {last50mFeedback}
                  </p>
                )}
                {locationRouteNotes.length > 0 && (
                  <p className="text-[10px] text-zinc-400">
                    Nota na zona: {locationRouteNotes[0].noteText}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDecisionFeedback(null);
                    completeActiveDeliveryStage();
                  }}
                  className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2 px-3 text-xs font-extrabold cursor-pointer transition"
                >
                  ✓ Finalizar Entrega (+
                  {activeDeliveryLifecycle.netProfitEur.toFixed(2)} €)
                </button>
              </div>
            )}

            {activeDeliveryLifecycle.stage === 'CONCLUIDA' && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs font-bold text-emerald-400">
                  ✓ Entrega Concluída (+
                  {activeDeliveryLifecycle.netProfitEur.toFixed(2)} €)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDecisionFeedback(null);
                    setIsOfferAccepted(false);
                    selectOfferPreset(SCANNER_OFFER_PRESETS[0]);
                    executeVoiceCommandPt('Finalizar entrega');
                  }}
                  className="rounded-lg bg-white text-zinc-950 py-1.5 px-3 text-xs font-bold cursor-pointer"
                >
                  Pronto p/ Nova Corrida
                </button>
              </div>
            )}
          </div>
        )}

        {decisionFeedback && (
          <div className="text-[11px] text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
            <span>{decisionFeedback}</span>
            <button
              type="button"
              onClick={() => setDecisionFeedback(null)}
              className="text-zinc-400 hover:text-zinc-100 text-[10px] font-bold cursor-pointer"
            >
              OK
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
