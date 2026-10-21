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
  AlertTriangle,
  MapPin,
  Camera,
  Languages,
  ScanLine,
  X,
} from 'lucide-react';
import { CargoChecklistItemId } from '../types/models';
import { HEAVY_ITEMS_DB, SCANNER_OFFER_PRESETS } from '../data/seedData';
import { useEstafetas } from '../context/EstafetasContext';
import {
  buildSurgicalOfferStreetTts,
  stopBuddySpeech,
} from '../services/voiceEngine';
import { learnFromScannedOrderSample } from '../services/orderScreenLearner';
import { publishLearnedOrderTemplateToCloud } from '../services/cloudSync';
import {
  getEnabledProfilePlatforms,
  PlatformBrandDot,
} from '../utils/platformBrand';

/**
 * Meta Diária progress: centered labels + slim 4px track with a visible
 * cyan glow start dot even at 0% (never looks like a browser scrollbar).
 */
const MetaDiariaProgress: React.FC<{
  pct: number;
  currentLabel: string;
  targetLabel: string;
  isDaylight: boolean;
}> = ({ pct, currentLabel, targetLabel, isDaylight }) => {
  const safePct = Math.max(0, Math.min(100, Math.round(pct)));
  const accent = isDaylight ? '#0284C7' : '#00E5FF';
  return (
    <div className="w-full overflow-x-hidden flex flex-col items-center text-center gap-2">
      <span
        className={`text-xs font-bold uppercase tracking-wider ${
          isDaylight ? 'text-slate-500' : 'text-slate-400'
        }`}
      >
        Meta Diária{' '}
        <span style={{ color: accent }} className="font-black">
          {safePct}%
        </span>
      </span>
      <div className="w-full max-w-[280px] px-1.5">
        <div
          className="relative w-full h-1 rounded-full"
          style={{
            backgroundColor: isDaylight
              ? 'rgba(8, 47, 73, 0.10)'
              : 'rgba(0, 229, 255, 0.12)',
          }}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
            style={{
              width: `${safePct}%`,
              background: 'linear-gradient(90deg, #0284C7 0%, #00E5FF 100%)',
            }}
          />
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-2.5 w-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
            style={{
              left: `${safePct}%`,
              backgroundColor: accent,
              boxShadow: '0 0 8px 2px rgba(0, 229, 255, 0.55)',
            }}
          />
        </div>
      </div>
      <span
        className={`text-sm font-extrabold whitespace-nowrap ${
          isDaylight ? 'text-slate-900' : 'text-white'
        }`}
      >
        {currentLabel}{' '}
        <span className={isDaylight ? 'text-slate-400' : 'text-slate-500'}>
          /
        </span>{' '}
        {targetLabel}
      </span>
    </div>
  );
};

export const ScannerAndSplitModule: React.FC = () => {
  const {
    activeScannedOffer,
    selectOfferPreset,
    routeTrapComplaints,
    criticalRestaurantComplaints,
    totalCostPerKm,
    vehicleProfile,
    speakTextPt,
    cancelSpeechNow,
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
    completeActiveDeliveryStage,
    activeSupportSplitMacro,
    triggerSupportSplitOrderMacro,
    isOfferAccepted,
    setIsOfferAccepted,
    aiAgentConfig,
    hasRealActiveDelivery,
    realCompletedDeliveries,
    platformLedgers,
    amaranteLiveWeather,
    openAndFetchAmaranteWeather,
    themeMode,
    roadHazards,
    personalGoals,
    addManualDeliveryRecord,
    openTranslatorModal,
    activePlatforms,
  } = useEstafetas();

  const isDaylight = themeMode === 'DAYLIGHT';
  // Only render the delivery platforms enabled in the courier profile (e.g. Glovo only)
  const enabledProfilePlatforms = useMemo(
    () => getEnabledProfilePlatforms(activePlatforms),
    [activePlatforms]
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [overweightProofCopied, setOverweightProofCopied] =
    useState<boolean>(false);
  const [includeEmptyReturnDeadZone, setIncludeEmptyReturnDeadZone] =
    useState<boolean>(false);
  const [showWeightEditor, setShowWeightEditor] = useState<boolean>(false);
  const [isEarningsModalOpen, setIsEarningsModalOpen] =
    useState<boolean>(false);
  const hasSpokenForModalOpenRef = useRef<boolean>(false);

  // Intercept Smart Back ("↩ Voltar") when Resumo de Ganhos modal or Weight Editor is open
  useEffect(() => {
    const handleSmartBack = (ev: Event) => {
      if (isEarningsModalOpen) {
        stopBuddySpeech();
        cancelSpeechNow();
        setIsEarningsModalOpen(false);
        ev.preventDefault();
        return;
      }
      if (showWeightEditor) {
        setShowWeightEditor(false);
        ev.preventDefault();
      }
    };
    window.addEventListener('buddy-smart-back', handleSmartBack);
    return () =>
      window.removeEventListener('buddy-smart-back', handleSmartBack);
  }, [isEarningsModalOpen, showWeightEditor, cancelSpeechNow]);

  // Mode B when a real order is active; Mode A when idle (no active order)
  const hasActiveOrder =
    !activeScannedOffer.id.startsWith('PRESET-') ||
    hasRealActiveDelivery ||
    isOfferAccepted;

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

  // 1. Earnings Breakdown by App (Uber Eats, Glovo, Bolt Food) + Daily Statistics Summary
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

    const totalKm = realCompletedDeliveries.reduce(
      (acc, d) => acc + (d.realKm || 0),
      0
    );
    const totalGross = realCompletedDeliveries.reduce(
      (acc, d) => acc + (d.grossEur || d.netProfitEur || 0),
      0
    );
    const safeCostPerKm = Math.min(0.35, Math.max(0.05, totalCostPerKm));
    const fuelCostDeducted = Number((totalKm * safeCostPerKm).toFixed(2));
    const avgNetPerKm =
      totalKm > 0 ? Number((total / totalKm).toFixed(2)) : 0;
    const estimatedTotalHours =
      realCompletedDeliveries.length > 0
        ? Math.max(0.25, (realCompletedDeliveries.length * 18) / 60)
        : 0;
    const avgHourlyEur =
      estimatedTotalHours > 0
        ? Number((total / estimatedTotalHours).toFixed(2))
        : 0;
    const goalTargetEur = Math.max(10, personalGoals?.dailyNetGoalEur || 85);
    const goalProgressPct = Math.min(
      100,
      Math.round((total / goalTargetEur) * 100)
    );

    return {
      uber,
      glovo,
      bolt,
      total,
      totalKm,
      totalGross: Math.max(total, totalGross),
      fuelCostDeducted,
      avgNetPerKm,
      avgHourlyEur,
      goalTargetEur,
      goalProgressPct,
      lastDelivery: realCompletedDeliveries[0] || null,
    };
  }, [realCompletedDeliveries, platformLedgers, totalCostPerKm, personalGoals]);

  const formatEurPt = (val: number): string =>
    `€${val.toFixed(2).replace('.', ',')}`;

  // Speak ONLY ONCE when Resumo de Ganhos modal opens (never on parent click and never on close)
  useEffect(() => {
    if (isEarningsModalOpen) {
      if (!hasSpokenForModalOpenRef.current) {
        hasSpokenForModalOpenRef.current = true;
        speakTextPt(
          `Hoje: ${earningsTodayByApp.total.toFixed(2).replace('.', ',')} euros líquidos em ${realCompletedDeliveries.length} entregas.`
        );
      }
    } else {
      hasSpokenForModalOpenRef.current = false;
    }
  }, [
    isEarningsModalOpen,
    earningsTodayByApp.total,
    realCompletedDeliveries.length,
    speakTextPt,
  ]);

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

    // Self-Learning Visual Calibration: train platform template and sync to Amarante cloud
    const updatedTemplates = learnFromScannedOrderSample({
      platform: uploadedOffer.platform,
      grossEur: uploadedOffer.grossAmountEur,
      distanceKm: uploadedOffer.appAnnouncedKm,
      estimatedMinutes: uploadedOffer.estimatedMinutes,
      originName: uploadedOffer.originName,
      destinationName: uploadedOffer.destinationName,
    });
    const learnedTemplate = updatedTemplates[uploadedOffer.platform];
    if (learnedTemplate) {
      void publishLearnedOrderTemplateToCloud(learnedTemplate);
    }

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

  const handleCompleteActiveRide = () => {
    recordOfferDecision(
      activeScannedOffer,
      auditMetrics.activeTotalKm,
      auditMetrics.realNetProfitEur,
      auditMetrics.effectiveAuditedEurPerKm,
      'ACEITE'
    );
    completeActiveDeliveryStage({
      netProfitEur: auditMetrics.realNetProfitEur,
      grossEur: auditMetrics.grossEur,
      realKm: auditMetrics.activeTotalKm,
      platform: activeScannedOffer.platform,
      originName: activeScannedOffer.originName,
      destinationName: activeScannedOffer.destinationName,
    });
    setIsOfferAccepted(false);
    selectOfferPreset(SCANNER_OFFER_PRESETS[0]);
  };

  const handleCloseOrDeclineActiveRide = () => {
    recordOfferDecision(
      activeScannedOffer,
      auditMetrics.activeTotalKm,
      auditMetrics.realNetProfitEur,
      auditMetrics.effectiveAuditedEurPerKm,
      'RECUSADA'
    );
    setIsOfferAccepted(false);
    selectOfferPreset(SCANNER_OFFER_PRESETS[0]);
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
    <div
      className={
        hasActiveOrder
          ? 'space-y-3 pt-2.5 pb-24'
          : 'h-[calc(100dvh-124px)] overflow-hidden flex flex-col gap-2.5 pt-2 pb-1'
      }
    >
      {/* Hidden Screenshot File Input for "📷 Ler Pedido / Print" */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleScreenshotFileUpload}
        className="hidden"
      />

      {/* =====================================================================
          MODE A: WHEN NO RIDE IS ACTIVE (!hasActiveOrder)
          1. Top Row: 2 Ultra-Compact Pill Cards (No Titles, No Bottom Lines)
          2. Main Panel: ÚLTIMA ENTREGA (Top) & RESUMO DA ESTATÍSTICA DIÁRIA (Bottom)
          ===================================================================== */}
      {!hasActiveOrder && (
        <>
          {/* 1. TOP SUMMARY BAR (Balanced, centered 2-column header — no outer border lines) */}
          <div
            className={`grid grid-cols-2 py-3 px-3 rounded-2xl overflow-x-hidden shrink-0 ${
              isDaylight
                ? 'bg-slate-50 text-slate-900'
                : 'bg-slate-900/80 text-slate-100'
            }`}
          >
            {/* LEFT COLUMN (Resumo de Ganhos trigger): Stacked €0,00 on top + 0 entregas hoje below */}
            <button
              type="button"
              onClick={() => setIsEarningsModalOpen(true)}
              title="Toque para abrir Resumo de Ganhos & Estatísticas de Hoje"
              className="flex flex-col items-center justify-center cursor-pointer transition text-center hover:opacity-85"
            >
              <span
                className={`text-2xl font-extrabold tracking-tight leading-none ${
                  isDaylight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {formatEurPt(earningsTodayByApp.total)}
              </span>
              <span
                className={`text-xs font-medium mt-1 whitespace-nowrap ${
                  isDaylight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {realCompletedDeliveries.length} entregas hoje
              </span>
            </button>

            {/* RIGHT COLUMN (Clima trigger): Custom Duotone SVG Weather Icon on Left + Stacked 17.9 °C & Amarante on Right */}
            <button
              type="button"
              onClick={() => void openAndFetchAmaranteWeather(false)}
              title="Toque para abrir Clima Atual em Amarante e ouvir previsão"
              className={`border-l flex items-center justify-center gap-2.5 cursor-pointer transition text-left hover:opacity-85 ${
                isDaylight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              {/* Custom Duotone SVG Weather Icon (Sun + Cloud Vector, strokeWidth=2) */}
              <svg
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 shrink-0"
                aria-hidden="true"
              >
                {/* Geometric Sun & Rays in Cyan Accent */}
                <circle
                  cx="12"
                  cy="12"
                  r="4.5"
                  fill={isDaylight ? '#E0F2FE' : 'rgba(0, 229, 255, 0.16)'}
                  stroke={isDaylight ? '#0284C7' : '#00E5FF'}
                  strokeWidth="2"
                />
                <path
                  d="M12 4V5.8M12 18.2V20M4 12H5.8M18.2 12H20M6.34 6.34L7.62 7.62M16.38 16.38L17.66 17.66M17.66 6.34L16.38 7.62M7.62 16.38L6.34 17.66"
                  stroke={isDaylight ? '#0284C7' : '#00E5FF'}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Crisp Vector Cloud in Matte Slate */}
                <path
                  d="M11.5 25H22.5C25.2614 25 27.5 22.7614 27.5 20C27.5 17.3923 25.5037 15.2508 22.9539 15.0205C22.2484 11.8683 19.4357 9.5 16.05 9.5C12.1564 9.5 9 12.6564 9 16.55C9 16.7438 9.0078 16.9358 9.0231 17.1255C7.3095 17.6481 6 19.2422 6 21.15C6 23.2763 7.7237 25 9.85 25H11.5Z"
                  fill={isDaylight ? '#FFFFFF' : '#0F172A'}
                  stroke={isDaylight ? '#0F172A' : '#F8FAFC'}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex flex-col items-start justify-center min-w-0">
                <span
                  className={`text-xl font-extrabold tracking-tight leading-none whitespace-nowrap ${
                    isDaylight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {amaranteLiveWeather.temperatureC.toFixed(1)} °C
                </span>
                <span
                  className={`text-xs font-medium mt-1 whitespace-nowrap ${
                    isDaylight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Amarante
                </span>
              </div>
            </button>
          </div>

          {/* 2. ÚLTIMA ENTREGA SECTION (Clean Structured Header + Segmented SVG Action Bar + Proportional Surface) */}
          <section className="space-y-2 shrink-0">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#00B8D4] shadow-[0_0_6px_rgba(0,229,255,0.7)] shrink-0" />
                <h2
                  className={`text-base font-extrabold tracking-tight ${
                    isDaylight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Última Entrega
                </h2>
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => openTranslatorModal('TRADUTOR')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition whitespace-nowrap ${
                    isDaylight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                  }`}
                >
                  <Languages
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isDaylight ? 'text-[#0284C7]' : 'text-[#00E5FF]'
                    }`}
                    strokeWidth={2.2}
                  />
                  <span>Tradutor &amp; Libras</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition whitespace-nowrap ${
                    isDaylight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                  }`}
                >
                  <ScanLine
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isDaylight ? 'text-[#0284C7]' : 'text-[#00E5FF]'
                    }`}
                    strokeWidth={2.2}
                  />
                  <span>Ler Pedido</span>
                </button>
              </div>
            </div>

            {earningsTodayByApp.lastDelivery ? (
              <div
                className={`py-2.5 px-4 rounded-2xl space-y-1 text-center ${
                  isDaylight ? 'bg-slate-50' : 'bg-slate-900/60'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`text-xs font-extrabold uppercase tracking-wide inline-flex items-center gap-1.5 ${
                      isDaylight ? 'text-slate-700' : 'text-slate-200'
                    }`}
                  >
                    <PlatformBrandDot
                      platform={earningsTodayByApp.lastDelivery.platform}
                      size={9}
                    />
                    {earningsTodayByApp.lastDelivery.platform}
                  </span>
                  <span
                    className={`text-xl font-black ${
                      isDaylight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    +{formatEurPt(earningsTodayByApp.lastDelivery.netProfitEur)}
                  </span>
                </div>
                <div
                  className={`text-sm font-bold truncate ${
                    isDaylight ? 'text-slate-800' : 'text-slate-100'
                  }`}
                >
                  {earningsTodayByApp.lastDelivery.segment}
                </div>
                <div
                  className={`grid grid-cols-3 text-xs pt-1 ${
                    isDaylight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  <span>
                    Distância:{' '}
                    <strong
                      className={
                        isDaylight
                          ? 'text-slate-900 font-bold'
                          : 'text-white font-bold'
                      }
                    >
                      {earningsTodayByApp.lastDelivery.realKm.toFixed(1)} km
                    </strong>
                  </span>
                  <span>
                    Líquido:{' '}
                    <strong
                      className={
                        isDaylight
                          ? 'text-[#0284C7] font-bold'
                          : 'text-[#00E5FF] font-bold'
                      }
                    >
                      {earningsTodayByApp.lastDelivery.netEurPerKm.toFixed(2)}{' '}
                      €/km
                    </strong>
                  </span>
                  <span>~18 min</span>
                </div>
              </div>
            ) : (
              <div
                className={`py-2.5 px-4 rounded-2xl text-center ${
                  isDaylight ? 'bg-slate-50' : 'bg-slate-900/60'
                }`}
              >
                <p
                  className={`text-sm font-bold ${
                    isDaylight ? 'text-slate-800' : 'text-slate-100'
                  }`}
                >
                  Nenhuma entrega registada hoje
                </p>
                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    isDaylight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Assim que aceitar ou ler um pedido, entrará automaticamente em
                  modo de entrega.
                </p>
              </div>
            )}
          </section>

          {/* 3. ESTATÍSTICA DIÁRIA & META DIÁRIA (Centered 2x2 metrics — no divider lines, whitespace only) */}
          <section className="space-y-2 overflow-x-hidden shrink-0">
            <h2
              className={`text-base font-extrabold tracking-tight text-center ${
                isDaylight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Estatística Diária
            </h2>

            <div
              className={`grid grid-cols-2 gap-x-3 gap-y-0.5 rounded-2xl py-1 ${
                isDaylight ? 'bg-slate-50' : 'bg-slate-900/60'
              }`}
            >
              <div className="py-1.5 px-2 text-center">
                <span
                  className={`text-xs font-medium block ${
                    isDaylight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Entregas concluídas
                </span>
                <span
                  className={`text-lg font-extrabold mt-0.5 block ${
                    isDaylight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {realCompletedDeliveries.length} entregas
                </span>
              </div>

              <div className="py-1.5 px-2 text-center">
                <span
                  className={`text-xs font-medium block ${
                    isDaylight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Distância hoje
                </span>
                <span
                  className={`text-lg font-extrabold mt-0.5 block ${
                    isDaylight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {earningsTodayByApp.totalKm.toFixed(1)} km
                </span>
              </div>

              <div className="py-1.5 px-2 text-center">
                <span
                  className={`text-xs font-medium block ${
                    isDaylight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Média Líquida €/km
                </span>
                <span
                  className={`text-lg font-extrabold mt-0.5 block ${
                    isDaylight ? 'text-[#0284C7]' : 'text-[#00E5FF]'
                  }`}
                >
                  {earningsTodayByApp.avgNetPerKm.toFixed(2).replace('.', ',')}{' '}
                  €/km
                </span>
              </div>

              <div className="py-1.5 px-2 text-center">
                <span
                  className={`text-xs font-medium block ${
                    isDaylight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Média por hora
                </span>
                <span
                  className={`text-lg font-extrabold mt-0.5 block ${
                    isDaylight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {earningsTodayByApp.avgHourlyEur.toFixed(2).replace('.', ',')}{' '}
                  €/h
                </span>
              </div>
            </div>

            {/* Meta Diária: centered slim 4px track with glow start dot (symmetric px-14 keeps it clear of the floating Buddy) */}
            <div className="pt-1 pb-1 px-14 overflow-x-hidden">
              <MetaDiariaProgress
                pct={earningsTodayByApp.goalProgressPct}
                currentLabel={formatEurPt(earningsTodayByApp.total)}
                targetLabel={formatEurPt(earningsTodayByApp.goalTargetEur)}
                isDaylight={isDaylight}
              />
            </div>
          </section>
        </>
      )}

      {/* =====================================================================
          DETAILED EARNINGS MODAL (Clean Flat Sheet Layout — Zero Excess Boxes & Zero Vibrant Red)
          ===================================================================== */}
      {isEarningsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3"
          onClick={() => {
            stopBuddySpeech();
            cancelSpeechNow();
            setIsEarningsModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: isDaylight ? '#FFFFFF' : '#0F172A',
              borderColor: isDaylight ? '#E2E8F0' : 'rgba(0, 229, 255, 0.28)',
              color: isDaylight ? '#0F172A' : '#FFFFFF',
            }}
            className="w-[92vw] max-w-[400px] rounded-3xl border p-5 overflow-hidden flex flex-col justify-between gap-3.5 cursor-pointer shadow-2xl"
            onClick={(e) => {
              e.stopPropagation();
              stopBuddySpeech();
              cancelSpeechNow();
            }}
            title="Toque em qualquer área deste quadro para silenciar a voz imediatamente"
          >
            <div className="space-y-3">
              {/* Clean Header (No Contabilidade Diária pill) */}
              <div
                className={`flex items-center justify-between gap-2 pb-2.5 border-b ${
                  isDaylight ? 'border-slate-100' : 'border-slate-800'
                }`}
              >
                <h3
                  className={`text-xl font-black tracking-tight leading-snug ${
                    isDaylight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Resumo de Ganhos
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    stopBuddySpeech();
                    cancelSpeechNow();
                    setIsEarningsModalOpen(false);
                  }}
                  className={`rounded-xl border p-2 cursor-pointer shrink-0 transition ${
                    isDaylight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100'
                      : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                  }`}
                  aria-label="Fechar Resumo de Ganhos"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 1. Lucro Líquido Hoje + Bruto vs. Custos (Flat Row with Hairline Divider & Slate Grey Costs) */}
              <div
                className={`pb-3 border-b flex items-baseline justify-between gap-3 ${
                  isDaylight ? 'border-slate-100' : 'border-slate-800'
                }`}
              >
                <div>
                  <span
                    className={`text-sm font-bold block ${
                      isDaylight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    Lucro Líquido Hoje
                  </span>
                  <span
                    className={`text-2xl font-black leading-tight block mt-0.5 whitespace-nowrap ${
                      isDaylight ? 'text-slate-900' : 'text-[#00E5FF]'
                    }`}
                  >
                    {formatEurPt(earningsTodayByApp.total)}
                  </span>
                </div>
                <div className="text-right text-sm space-y-1">
                  <div
                    className={`font-medium whitespace-nowrap ${
                      isDaylight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    Bruto:{' '}
                    <strong
                      className={`font-bold ${
                        isDaylight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {formatEurPt(earningsTodayByApp.totalGross)}
                    </strong>
                  </div>
                  <div
                    className={`text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap ${
                      isDaylight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    Custos:{' '}
                    <strong className="font-semibold">
                      -{formatEurPt(earningsTodayByApp.fuelCostDeducted)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 2. Ganhos por Plataforma (No outer box, no Valor Líquido pill) */}
              <div
                className={`pb-3 border-b space-y-1 ${
                  isDaylight ? 'border-slate-100' : 'border-slate-800'
                }`}
              >
                <span
                  className={`text-sm font-bold uppercase tracking-wider block ${
                    isDaylight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Ganhos por Plataforma
                </span>
                <div
                  className={`divide-y ${
                    isDaylight ? 'divide-slate-100' : 'divide-slate-800/80'
                  }`}
                >
                  {enabledProfilePlatforms.map((plat) => (
                    <div
                      key={plat}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span
                        className={`text-base font-bold flex items-center gap-2.5 ${
                          isDaylight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        <PlatformBrandDot platform={plat} size={11} />
                        {plat}
                      </span>
                      <span
                        className={`text-lg font-black whitespace-nowrap ${
                          isDaylight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {formatEurPt(
                          plat === 'Glovo'
                            ? earningsTodayByApp.glovo
                            : plat === 'Uber Eats'
                              ? earningsTodayByApp.uber
                              : earningsTodayByApp.bolt
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Open 2x2 Typographic KPI Grid (Hairline Dividers Only — Zero Individual Boxes) */}
              <div
                className={`grid grid-cols-2 divide-x divide-y border-b ${
                  isDaylight
                    ? 'divide-slate-100 border-slate-100'
                    : 'divide-slate-800 border-slate-800'
                }`}
              >
                <div className="py-2 pr-3">
                  <span
                    className={`text-sm font-medium block ${
                      isDaylight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    Entregas hoje
                  </span>
                  <span
                    className={`text-lg font-black mt-0.5 block whitespace-nowrap ${
                      isDaylight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {realCompletedDeliveries.length} entregas
                  </span>
                </div>
                <div className="py-2 pl-3">
                  <span
                    className={`text-sm font-medium block ${
                      isDaylight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    Distância hoje
                  </span>
                  <span
                    className={`text-lg font-black mt-0.5 block whitespace-nowrap ${
                      isDaylight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {earningsTodayByApp.totalKm.toFixed(1)} km
                  </span>
                </div>
                <div className="py-2 pr-3">
                  <span
                    className={`text-sm font-medium block ${
                      isDaylight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    Média Líquida
                  </span>
                  <span
                    className={`text-lg font-black mt-0.5 block whitespace-nowrap ${
                      isDaylight ? 'text-[#0284C7]' : 'text-[#00E5FF]'
                    }`}
                  >
                    {earningsTodayByApp.avgNetPerKm.toFixed(2).replace('.', ',')}{' '}
                    €/km
                  </span>
                </div>
                <div className="py-2 pl-3">
                  <span
                    className={`text-sm font-medium block ${
                      isDaylight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    Média por Hora
                  </span>
                  <span
                    className={`text-lg font-black mt-0.5 block whitespace-nowrap ${
                      isDaylight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {earningsTodayByApp.avgHourlyEur.toFixed(2).replace('.', ',')}{' '}
                    €/h
                  </span>
                </div>
              </div>

              {/* 4. Meta Diária % (centered slim track) + Última Entrega */}
              <div className="pt-0.5 space-y-2 overflow-x-hidden">
                <MetaDiariaProgress
                  pct={earningsTodayByApp.goalProgressPct}
                  currentLabel={formatEurPt(earningsTodayByApp.total)}
                  targetLabel={formatEurPt(earningsTodayByApp.goalTargetEur)}
                  isDaylight={isDaylight}
                />
                {earningsTodayByApp.lastDelivery ? (
                  <div
                    className={`pt-2 flex items-center justify-between gap-2 text-sm ${
                      isDaylight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    <span className="truncate font-medium">
                      Última ({earningsTodayByApp.lastDelivery.platform}):{' '}
                      <strong
                        className={`font-bold ${
                          isDaylight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {earningsTodayByApp.lastDelivery.segment}
                      </strong>
                    </span>
                    <span
                      className={`font-black shrink-0 whitespace-nowrap ${
                        isDaylight ? 'text-[#0284C7]' : 'text-[#00E5FF]'
                      }`}
                    >
                      +{formatEurPt(earningsTodayByApp.lastDelivery.netProfitEur)}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`pt-1 text-sm font-medium ${
                      isDaylight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Última entrega: Nenhuma entrega registada no turno de hoje.
                  </div>
                )}
              </div>
            </div>

            {/* 5. Ergonomic Fechar Resumo Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                stopBuddySpeech();
                cancelSpeechNow();
                setIsEarningsModalOpen(false);
              }}
              className="py-3 text-sm font-black rounded-2xl w-full bg-slate-900 text-[#00E5FF] border border-[#00E5FF]/30 shadow-md cursor-pointer transition active:scale-[0.99]"
            >
              Fechar Resumo
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODE B: WHEN AN ORDER IS ACTIVE (hasActiveOrder)
          Hides Ganhos, Clima, Última Entrega & Estatística Diária.
          Shows ONLY DADOS DA CORRIDA ATUAL (Full Screen Focus).
          ===================================================================== */}
      {hasActiveOrder && (
        <section className="rounded-2xl bg-zinc-900/95 border border-zinc-800 p-3.5 space-y-3 shadow-sm">
          {/* Panel Top Header: Full Title + Translator & Libras + Verdict Badge */}
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00E5FF] animate-ping shrink-0" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-100">
                DADOS DA CORRIDA ATUAL
              </h2>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => openTranslatorModal('TRADUTOR')}
                style={{
                  backgroundColor: '#0B0F17',
                  borderColor: '#00E5FF',
                  color: '#00E5FF',
                }}
                className="rounded-lg border px-2.5 py-1 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition"
              >
                <span>🌍 Tradutor &amp; Libras</span>
              </button>
              <span
                style={
                  auditMetrics.verdictCode === 'ACEITAR'
                    ? {
                        backgroundColor: '#0B0F17',
                        borderColor: '#00E5FF',
                        color: '#00E5FF',
                      }
                    : undefined
                }
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-extrabold border ${
                  auditMetrics.verdictCode === 'ACEITAR'
                    ? ''
                    : 'bg-rose-600 border-rose-500 text-white'
                }`}
              >
                {auditMetrics.verdictCode === 'ACEITAR' ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                <span>{auditMetrics.verdictLabel}</span>
              </span>
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
                  {activeScannedOffer.platform}
                  {activeScannedOffer.orderId
                    ? ` • ${activeScannedOffer.orderId}`
                    : ''}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-400 font-semibold">Recolha:</span>
                <span className="font-bold text-zinc-100 text-right">
                  {activeScannedOffer.originName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-400 font-semibold">Destino:</span>
                <span className="font-extrabold text-emerald-500 text-right">
                  {activeScannedOffer.destinationName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-900">
                <span className="text-zinc-400 font-semibold">
                  Tempo Estimado:
                </span>
                <span className=" font-bold text-zinc-100">
                  ~{auditMetrics.realTotalMinutes} min
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
                <span className="text-sm font-bold text-zinc-100 mt-0.5 block">
                  {auditMetrics.grossEur.toFixed(2)} €
                </span>
              </div>

              <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-2.5">
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                  CUSTO DA ROTA
                </span>
                <span className="text-sm font-bold text-rose-500 mt-0.5 block">
                  -{auditMetrics.realTripCostEur.toFixed(2)} €
                </span>
              </div>

              <div className="rounded-xl bg-zinc-950 border border-emerald-500/40 p-2.5">
                <span className="text-[10px] font-extrabold uppercase text-emerald-500 block">
                  LUCRO LÍQUIDO
                </span>
                <span className="text-sm font-black text-emerald-500 mt-0.5 block">
                  +{auditMetrics.realNetProfitEur.toFixed(2)} €
                </span>
              </div>

              <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-2.5">
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                  PROJEÇÃO €/HORA
                </span>
                <span className="text-sm font-bold text-amber-500 mt-0.5 block">
                  {auditMetrics.projectedHourlyNetEur.toFixed(2)} €/h
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
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-2.5">
                <span className="text-[9px] font-bold uppercase text-zinc-400 block leading-tight">
                  DISTÂNCIA TOTAL
                </span>
                <span className="text-sm font-extrabold text-zinc-100 mt-1 block">
                  {auditMetrics.activeTotalKm.toFixed(1)} km
                </span>
              </div>

              <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-2.5">
                <span className="text-[9px] font-bold uppercase text-zinc-400 block leading-tight">
                  € / KM BRUTO
                </span>
                <span className="text-sm font-bold text-zinc-100 mt-1 block">
                  {auditMetrics.grossEurPerKm.toFixed(2)} €/km
                </span>
              </div>

              <div className="rounded-xl bg-zinc-950 border border-emerald-500/40 p-2.5">
                <span className="text-[9px] font-extrabold uppercase text-emerald-500 block leading-tight">
                  € / KM LÍQUIDO
                </span>
                <span className="text-sm font-black text-emerald-500 mt-1 block">
                  {auditMetrics.effectiveAuditedEurPerKm.toFixed(2)} €/km
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
              {matchedRouteTrap && (
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
                            <span className="w-5 text-center text-xs font-semibold text-zinc-100">
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

          {/* ACTION BUTTONS: ✅ CONCLUIR CORRIDA & ✕ ENCERRAR / RECUSAR */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleCompleteActiveRide}
              className="flex-1 rounded-xl py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>✅ Concluir Corrida</span>
            </button>

            <button
              type="button"
              onClick={handleCloseOrDeclineActiveRide}
              className="flex-1 rounded-xl py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
            >
              <XCircle className="h-4 w-4 shrink-0" />
              <span>✕ Encerrar / Recusar</span>
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
        </section>
      )}
    </div>
  );
};
