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
} from 'lucide-react';
import { CargoChecklistItemId } from '../types/models';
import { HEAVY_ITEMS_DB, SCANNER_OFFER_PRESETS } from '../data/seedData';
import { useEstafetas } from '../context/EstafetasContext';
import {
  buildSurgicalOfferStreetTts,
  stopBuddySpeech,
} from '../services/voiceEngine';

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
  } = useEstafetas();

  const isDaylight = themeMode === 'DAYLIGHT';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [overweightProofCopied, setOverweightProofCopied] =
    useState<boolean>(false);
  const [includeEmptyReturnDeadZone, setIncludeEmptyReturnDeadZone] =
    useState<boolean>(false);
  const [showWeightEditor, setShowWeightEditor] = useState<boolean>(false);
  const [isEarningsModalOpen, setIsEarningsModalOpen] =
    useState<boolean>(false);

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
    <div className="space-y-3">
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
          <div className="grid grid-cols-2 gap-3">
            {/* LEFT COMPACT CARD (GANHOS): Hero Number + Deliveries Badge — Click opens Detailed Earnings Modal */}
            <button
              type="button"
              onClick={() => {
                setIsEarningsModalOpen(true);
                speakTextPt(
                  `Hoje: ${earningsTodayByApp.total.toFixed(2).replace('.', ',')} euros líquidos em ${realCompletedDeliveries.length} entregas.`
                );
              }}
              title="Toque para abrir Resumo de Ganhos & Estatísticas de Hoje"
              className={`rounded-3xl border px-4 py-3.5 flex items-center justify-between gap-2 cursor-pointer transition shadow-sm ${
                isDaylight
                  ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900'
                  : 'bg-slate-800/95 hover:bg-slate-800 border-slate-700 text-slate-100'
              }`}
            >
              <span className="text-2xl font-extrabold text-emerald-500 tracking-tight leading-none">
                {formatEurPt(earningsTodayByApp.total)}
              </span>
              <span
                className={`text-sm font-bold px-2.5 py-1 rounded-xl shrink-0 ${
                  isDaylight
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {realCompletedDeliveries.length} ent.
              </span>
            </button>

            {/* RIGHT COMPACT CARD (CLIMA): Weather icon + Hero Temperature + City — Click opens Weather Modal */}
            <button
              type="button"
              onClick={() => void openAndFetchAmaranteWeather(true)}
              title="Toque para abrir Clima Atual em Amarante e ouvir previsão"
              className={`rounded-3xl border px-4 py-3 flex items-center justify-between gap-2.5 cursor-pointer transition shadow-sm ${
                isDaylight
                  ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900'
                  : 'bg-slate-800/95 hover:bg-slate-800 border-slate-700 text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-3xl leading-none select-none shrink-0">
                  {amaranteLiveWeather.conditionEmoji}
                </span>
                <div className="flex flex-col items-start text-left leading-tight">
                  <span
                    style={{ color: isDaylight ? '#0f172a' : '#f8fafc' }}
                    className="text-xl font-extrabold tracking-tight leading-none whitespace-nowrap"
                  >
                    {amaranteLiveWeather.temperatureC.toFixed(1)} °C
                  </span>
                  <span
                    style={{ color: isDaylight ? '#334155' : '#cbd5e1' }}
                    className="text-sm font-bold whitespace-nowrap mt-0.5"
                  >
                    Amarante
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* TOP SECTION: Última Entrega (Glovo Rider Rounded Style) */}
          <section className="rounded-3xl bg-zinc-900/95 border border-zinc-800 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#00E5FF] shrink-0" />
                <h2 className="text-xl font-bold text-zinc-100">
                  Última Entrega
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
                  className="rounded-xl border px-3 py-1.5 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap shadow-[0_2px_10px_rgba(0,229,255,0.18)]"
                >
                  <span>🌍 Tradutor &amp; Libras</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    backgroundColor: isDaylight ? '#FFFFFF' : '#111827',
                    borderColor: isDaylight
                      ? '#CBD5E1'
                      : 'rgba(0, 229, 255, 0.35)',
                    color: isDaylight ? '#090D16' : '#FFFFFF',
                  }}
                  className="rounded-xl border px-3 py-1.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap"
                >
                  <Camera className="h-4 w-4 text-[#00E5FF] shrink-0" />
                  <span>📷 Ler Pedido</span>
                </button>
              </div>
            </div>

            {earningsTodayByApp.lastDelivery ? (
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-base font-bold text-emerald-300">
                    {earningsTodayByApp.lastDelivery.platform}
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-400">
                    +{formatEurPt(earningsTodayByApp.lastDelivery.netProfitEur)}
                  </span>
                </div>
                <div className="text-lg font-bold text-zinc-100 truncate">
                  {earningsTodayByApp.lastDelivery.segment}
                </div>
                <div className="flex items-center justify-between text-base text-zinc-400 pt-1.5 border-t border-zinc-900">
                  <span>
                    Distância:{' '}
                    <strong className="text-zinc-100 font-bold">
                      {earningsTodayByApp.lastDelivery.realKm.toFixed(1)} km
                    </strong>
                  </span>
                  <span>
                    Líquido:{' '}
                    <strong className="text-emerald-400 font-bold">
                      {earningsTodayByApp.lastDelivery.netEurPerKm.toFixed(2)} €/km
                    </strong>
                  </span>
                  <span>~18 min</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800/80 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-zinc-100">
                    Nenhuma entrega registada hoje
                  </p>
                  <p className="text-base font-medium text-zinc-400 mt-1 leading-relaxed">
                    Assim que aceitar ou ler um pedido, entrará automaticamente em modo de entrega.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* BOTTOM SECTION: Estatística Diária (Glovo Rider Rounded Style) */}
          <section className="rounded-3xl bg-zinc-900/95 border border-zinc-800 p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <h2 className="text-xl font-bold text-zinc-100">
                Estatística Diária
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800/80 p-3.5">
                <span className="text-base font-medium text-zinc-400 block">
                  Entregas concluídas
                </span>
                <span className="text-xl font-extrabold text-zinc-100 mt-1 block">
                  {realCompletedDeliveries.length} entregas
                </span>
              </div>

              <div className="rounded-2xl bg-zinc-950 border border-zinc-800/80 p-3.5">
                <span className="text-base font-medium text-zinc-400 block">
                  Distância hoje
                </span>
                <span className="text-xl font-extrabold text-zinc-100 mt-1 block">
                  {earningsTodayByApp.totalKm.toFixed(1)} km
                </span>
              </div>

              <div className="rounded-2xl bg-zinc-950 border border-emerald-500/30 p-3.5">
                <span className="text-base font-bold text-emerald-400 block">
                  Média líquida €/km
                </span>
                <span className="text-xl font-extrabold text-emerald-400 mt-1 block">
                  {earningsTodayByApp.avgNetPerKm.toFixed(2).replace('.', ',')} €/km
                </span>
              </div>

              <div className="rounded-2xl bg-zinc-950 border border-zinc-800/80 p-3.5">
                <span className="text-base font-medium text-zinc-400 block">
                  Média por hora
                </span>
                <span className="text-xl font-extrabold text-amber-400 mt-1 block">
                  {earningsTodayByApp.avgHourlyEur.toFixed(2).replace('.', ',')} €/h
                </span>
              </div>
            </div>

            {/* Progresso da Meta Diária */}
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-base">
                <span className="font-bold text-zinc-200">
                  Meta Diária
                </span>
                <span className="font-extrabold text-emerald-400">
                  {formatEurPt(earningsTodayByApp.total)} /{' '}
                  {formatEurPt(earningsTodayByApp.goalTargetEur)} (
                  {earningsTodayByApp.goalProgressPct}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  style={{ width: `${earningsTodayByApp.goalProgressPct}%` }}
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                />
              </div>
            </div>
          </section>
        </>
      )}

      {/* =====================================================================
          DETAILED EARNINGS MODAL (Full-Height 88vh–92vh + Theme-Aware High Contrast)
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
              backgroundColor: isDaylight ? '#FFFFFF' : '#05070B',
              borderColor: '#00E5FF',
              color: isDaylight ? '#090D16' : '#FFFFFF',
              boxShadow: isDaylight
                ? '0 20px 50px rgba(15, 23, 42, 0.22)'
                : '0 20px 50px rgba(0, 229, 255, 0.22)',
            }}
            className="w-full max-w-md min-h-[84vh] max-h-[92vh] overflow-y-auto rounded-3xl border-2 p-5 flex flex-col justify-between gap-4 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              stopBuddySpeech();
              cancelSpeechNow();
            }}
            title="Toque em qualquer área deste quadro para silenciar a voz imediatamente"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    style={{
                      backgroundColor: isDaylight ? '#F0F9FF' : '#0B0F17',
                      borderColor: '#00E5FF',
                      color: isDaylight ? '#0284C7' : '#00E5FF',
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-extrabold"
                  >
                    💰 Contabilidade Diária
                  </span>
                  <h3
                    style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                    className="text-2xl font-black mt-1.5 leading-snug"
                  >
                    Resumo de Ganhos
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    stopBuddySpeech();
                    cancelSpeechNow();
                    setIsEarningsModalOpen(false);
                  }}
                  style={{
                    backgroundColor: isDaylight ? '#F8FAFC' : '#0B0F17',
                    borderColor: isDaylight
                      ? '#CBD5E1'
                      : 'rgba(0, 229, 255, 0.4)',
                    color: isDaylight ? '#090D16' : '#FFFFFF',
                  }}
                  className="rounded-2xl border px-3.5 py-2 text-lg font-extrabold cursor-pointer shrink-0 transition hover:border-[#00E5FF]"
                >
                  ✕
                </button>
              </div>

              {/* 1. Lucro Líquido Total + Bruto vs. Combustível/Desgaste */}
              <div
                style={{
                  backgroundColor: isDaylight ? '#F8FAFC' : '#0B0F17',
                  borderColor: '#00E5FF',
                  color: isDaylight ? '#090D16' : '#FFFFFF',
                }}
                className="rounded-3xl border-2 p-4 flex items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <span
                    style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                    className="text-base font-extrabold block"
                  >
                    Lucro Líquido Hoje
                  </span>
                  <span
                    style={{ color: isDaylight ? '#090D16' : '#00E5FF' }}
                    className="text-3xl font-black leading-tight block mt-1 whitespace-nowrap"
                  >
                    {formatEurPt(earningsTodayByApp.total)}
                  </span>
                </div>
                <div className="text-right text-base space-y-1">
                  <div
                    style={{ color: isDaylight ? '#334155' : '#CBD5E1' }}
                    className="font-bold whitespace-nowrap"
                  >
                    Bruto:{' '}
                    <strong
                      style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                      className="font-black"
                    >
                      {formatEurPt(earningsTodayByApp.totalGross)}
                    </strong>
                  </div>
                  <div
                    style={{ color: isDaylight ? '#DC2626' : '#FB7185' }}
                    className="font-bold whitespace-nowrap"
                  >
                    Custos:{' '}
                    <strong className="font-black">
                      -{formatEurPt(earningsTodayByApp.fuelCostDeducted)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 2. Ganhos por Plataforma */}
              <div
                style={{
                  backgroundColor: isDaylight ? '#F8FAFC' : '#0B0F17',
                  borderColor: isDaylight
                    ? '#CBD5E1'
                    : 'rgba(0, 229, 255, 0.35)',
                  color: isDaylight ? '#090D16' : '#FFFFFF',
                }}
                className="rounded-3xl border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                    className="text-lg font-black"
                  >
                    Ganhos por Plataforma
                  </span>
                  <span
                    style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                    className="text-sm font-extrabold"
                  >
                    Valor Líquido
                  </span>
                </div>
                <div
                  style={{
                    borderColor: isDaylight
                      ? '#E2E8F0'
                      : 'rgba(0, 229, 255, 0.18)',
                  }}
                  className="flex items-center justify-between py-2 border-b"
                >
                  <span
                    style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                    className="text-lg font-extrabold flex items-center gap-2.5"
                  >
                    <span className="h-3 w-3 rounded-full bg-[#00E5FF]" />
                    Uber Eats
                  </span>
                  <span
                    style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                    className="text-xl font-black whitespace-nowrap"
                  >
                    {formatEurPt(earningsTodayByApp.uber)}
                  </span>
                </div>
                <div
                  style={{
                    borderColor: isDaylight
                      ? '#E2E8F0'
                      : 'rgba(0, 229, 255, 0.18)',
                  }}
                  className="flex items-center justify-between py-2 border-b"
                >
                  <span
                    style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                    className="text-lg font-extrabold flex items-center gap-2.5"
                  >
                    <span className="h-3 w-3 rounded-full bg-[#00B8D4]" />
                    Glovo
                  </span>
                  <span
                    style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                    className="text-xl font-black whitespace-nowrap"
                  >
                    {formatEurPt(earningsTodayByApp.glovo)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span
                    style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                    className="text-lg font-extrabold flex items-center gap-2.5"
                  >
                    <span className="h-3 w-3 rounded-full bg-[#38BDF8]" />
                    Bolt Food
                  </span>
                  <span
                    style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                    className="text-xl font-black whitespace-nowrap"
                  >
                    {formatEurPt(earningsTodayByApp.bolt)}
                  </span>
                </div>
              </div>

              {/* 3. 4-Card KPI Grid: Entregas, KM Rodados, Média €/km, Ritmo €/h */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  style={{
                    backgroundColor: isDaylight ? '#F8FAFC' : '#0B0F17',
                    borderColor: isDaylight
                      ? '#CBD5E1'
                      : 'rgba(0, 229, 255, 0.35)',
                    color: isDaylight ? '#090D16' : '#FFFFFF',
                  }}
                  className="rounded-2xl border p-3.5"
                >
                  <span
                    style={{ color: isDaylight ? '#475569' : '#CBD5E1' }}
                    className="text-sm font-bold block"
                  >
                    Entregas hoje
                  </span>
                  <span
                    style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                    className="text-xl font-black mt-1 block whitespace-nowrap"
                  >
                    {realCompletedDeliveries.length} entregas
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: isDaylight ? '#F8FAFC' : '#0B0F17',
                    borderColor: isDaylight
                      ? '#CBD5E1'
                      : 'rgba(0, 229, 255, 0.35)',
                    color: isDaylight ? '#090D16' : '#FFFFFF',
                  }}
                  className="rounded-2xl border p-3.5"
                >
                  <span
                    style={{ color: isDaylight ? '#475569' : '#CBD5E1' }}
                    className="text-sm font-bold block"
                  >
                    Distância hoje
                  </span>
                  <span
                    style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                    className="text-xl font-black mt-1 block whitespace-nowrap"
                  >
                    {earningsTodayByApp.totalKm.toFixed(1)} km
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: isDaylight ? '#F0F9FF' : '#0B0F17',
                    borderColor: '#00E5FF',
                    color: isDaylight ? '#090D16' : '#FFFFFF',
                  }}
                  className="rounded-2xl border p-3.5"
                >
                  <span
                    style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                    className="text-sm font-extrabold block"
                  >
                    Média Líquida
                  </span>
                  <span
                    style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                    className="text-xl font-black mt-1 block whitespace-nowrap"
                  >
                    {earningsTodayByApp.avgNetPerKm.toFixed(2).replace('.', ',')}{' '}
                    €/km
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: isDaylight ? '#F8FAFC' : '#0B0F17',
                    borderColor: isDaylight
                      ? '#CBD5E1'
                      : 'rgba(0, 229, 255, 0.35)',
                    color: isDaylight ? '#090D16' : '#FFFFFF',
                  }}
                  className="rounded-2xl border p-3.5"
                >
                  <span
                    style={{ color: isDaylight ? '#475569' : '#CBD5E1' }}
                    className="text-sm font-bold block"
                  >
                    Média por Hora
                  </span>
                  <span
                    style={{ color: isDaylight ? '#090D16' : '#00E5FF' }}
                    className="text-xl font-black mt-1 block whitespace-nowrap"
                  >
                    {earningsTodayByApp.avgHourlyEur.toFixed(2).replace('.', ',')}{' '}
                    €/h
                  </span>
                </div>
              </div>

              {/* 4. Meta Diária % + Última Entrega */}
              <div
                style={{
                  backgroundColor: isDaylight ? '#F8FAFC' : '#0B0F17',
                  borderColor: isDaylight
                    ? '#CBD5E1'
                    : 'rgba(0, 229, 255, 0.35)',
                  color: isDaylight ? '#090D16' : '#FFFFFF',
                }}
                className="rounded-3xl border p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between text-base gap-2">
                  <span
                    style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                    className="font-black"
                  >
                    🎯 Meta Diária ({earningsTodayByApp.goalProgressPct}%)
                  </span>
                  <span
                    style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                    className="font-black whitespace-nowrap"
                  >
                    {formatEurPt(earningsTodayByApp.total)} /{' '}
                    {formatEurPt(earningsTodayByApp.goalTargetEur)}
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: isDaylight ? '#E2E8F0' : '#1E293B',
                  }}
                  className="w-full h-3 rounded-full overflow-hidden"
                >
                  <div
                    style={{
                      width: `${earningsTodayByApp.goalProgressPct}%`,
                      backgroundColor: '#00E5FF',
                    }}
                    className="h-full rounded-full transition-all duration-300"
                  />
                </div>
                {earningsTodayByApp.lastDelivery ? (
                  <div
                    style={{
                      borderColor: isDaylight
                        ? '#E2E8F0'
                        : 'rgba(0, 229, 255, 0.2)',
                    }}
                    className="pt-2 border-t flex items-center justify-between gap-2 text-base"
                  >
                    <span
                      style={{ color: isDaylight ? '#334155' : '#CBD5E1' }}
                      className="truncate font-bold"
                    >
                      Última ({earningsTodayByApp.lastDelivery.platform}):{' '}
                      <strong
                        style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                        className="font-black"
                      >
                        {earningsTodayByApp.lastDelivery.segment}
                      </strong>
                    </span>
                    <span
                      style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                      className="font-black shrink-0 whitespace-nowrap"
                    >
                      +{formatEurPt(earningsTodayByApp.lastDelivery.netProfitEur)}
                    </span>
                  </div>
                ) : (
                  <div
                    style={{ color: isDaylight ? '#475569' : '#94A3B8' }}
                    className="pt-1.5 text-sm font-bold"
                  >
                    Última entrega: Nenhuma entrega registada no turno de hoje.
                  </div>
                )}
              </div>
            </div>

            {/* 5. Larger, Ergonomic Fechar Resumo Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                stopBuddySpeech();
                cancelSpeechNow();
                setIsEarningsModalOpen(false);
              }}
              style={{
                backgroundColor: '#00E5FF',
                color: '#05070B',
              }}
              className="py-4 text-lg font-black rounded-2xl w-full shadow-lg cursor-pointer transition active:scale-[0.99]"
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
