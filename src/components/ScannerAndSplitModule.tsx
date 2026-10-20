import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Upload,
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
  ChevronDown,
  ChevronUp,
  Mic,
  Clock,
  Navigation,
} from 'lucide-react';
import { CargoChecklistItemId, ScannedOffer } from '../types/models';
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
    setBackpackWeightLimitKg,
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
    addEstablishmentToBlacklist,
    removeEstablishmentFromBlacklist,
    isEstablishmentBlacklisted,
    activeDeliveryLifecycle,
    startActiveDeliveryFromOffer,
    startDeliveryTransitStage,
    completeActiveDeliveryStage,
    executeVoiceCommandPt,
    isListeningSpeechRecognition,
    startSpeechRecognitionPt,
    activeSupportSplitMacro,
    triggerSupportSplitOrderMacro,
    isOfferAccepted,
    setIsOfferAccepted,
    aiAgentConfig,
    activePlatforms,
    hasRealActiveDelivery,
    addLocationRouteNote,
    locationRouteNotes,
    realCompletedDeliveries,
    amaranteLiveWeather,
    openAndFetchAmaranteWeather,
    scannerActiveMainView: activeView,
    setScannerActiveMainView: setActiveView,
    openAndroidAccessibilitySettings,
    triggerAutoDetectedOffer,
  } = useEstafetas();

  const [isAlertExpanded, setIsAlertExpanded] = useState<boolean>(false);
  const [isScenarioPickerOpen, setIsScenarioPickerOpen] =
    useState<boolean>(false);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);
  const [overweightProofCopied, setOverweightProofCopied] =
    useState<boolean>(false);
  // Module 3: Empty Return Dead-Zone Calculator (+40% KM return buffer for Freixo/Lixa/Vila Meã)
  const [includeEmptyReturnDeadZone, setIncludeEmptyReturnDeadZone] =
    useState<boolean>(false);
  const [last50mFeedback, setLast50mFeedback] = useState<string | null>(null);
  const [quickManualOfferOpen, setQuickManualOfferOpen] = useState<boolean>(false);
  const [quickOfferGross, setQuickOfferGross] = useState<string>('5.80');
  const [quickOfferKm, setQuickOfferKm] = useState<string>('3.4');
  const [quickOfferDest, setQuickOfferDest] = useState<string>('Freixo de Cima');

  // Guard: In Production Mode, never show ghost #4101 active delivery on startup if no real delivery was started
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const matchedRouteTrap = useMemo(() => {
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
  }, [activeScannedOffer, routeTrapComplaints]);

  const matchedCriticalRestaurant = useMemo(() => {
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
  }, [activeScannedOffer, criticalRestaurantComplaints]);

  const isOverweight = totalAuditedWeightKg > backpackWeightLimitKg;
  const requiredCouriersCount = Math.max(
    2,
    Math.ceil(totalAuditedWeightKg / Math.max(1, backpackWeightLimitKg))
  );

  const isPeripheralDeadZoneDetected = useMemo(() => {
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
  }, [activeScannedOffer]);

  const effectiveEmptyReturn =
    includeEmptyReturnDeadZone || isPeripheralDeadZoneDetected;

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

    const safeCostPerKm = Math.min(0.35, Math.max(0.05, totalCostPerKm));
    const realTripCostEur = Number(
      (effectiveTotalKmWithReturn * safeCostPerKm).toFixed(2)
    );

    const realNetProfitEur = Number(
      Math.max(0.4, grossEur - realTripCostEur).toFixed(2)
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

    // Strictly positive hourly rate calculation (e.g., 18.50 €/h)
    const projectedHourlyNetEur = Number(
      Math.max(9.5, (realNetProfitEur / realTotalMinutes) * 60).toFixed(2)
    );

    const hasCriticalTrap =
      forcedDetourKm > 0 ||
      Boolean(matchedCriticalRestaurant && extraWaitMins >= 25) ||
      Boolean(activeScannedOffer.isSplitOrderCandidate) ||
      isOverweight;

    const prefVerdict = evaluateOfferAgainstPreferences(
      grossEur,
      effectiveAuditedEurPerKm,
      hasCriticalTrap,
      activeScannedOffer.originName
    );

    let verdictCode: 'ACEITAR' | 'RECUSAR' = 'ACEITAR';
    let verdictLabel = 'ACEITAR';
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
      isOverweight ||
      activeScannedOffer.isSplitOrderCandidate
    ) {
      verdictCode = 'RECUSAR';
      verdictLabel =
        isOverweight || activeScannedOffer.isSplitOrderCandidate
          ? 'EXIGE DIVISÃO / RECUSAR'
          : 'RECUSAR';

      if (prefVerdict.matchedBlacklistEntry) {
        verdictSummary = 'Lista Negra Pessoal';
      } else if (forcedDetourKm > 0) {
        verdictSummary = `Desvio +${forcedDetourKm.toFixed(1)} km não pago`;
      } else if (matchedCriticalRestaurant && extraWaitMins >= 25) {
        verdictSummary = `Espera >${extraWaitMins} min no local`;
      } else if (isOverweight || activeScannedOffer.isSplitOrderCandidate) {
        verdictSummary = `Excesso de peso (${totalAuditedWeightKg.toFixed(1)} kg)`;
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
      isOverweight:
        isOverweight || Boolean(activeScannedOffer.isSplitOrderCandidate),
      totalWeightKg: totalAuditedWeightKg,
    });

    return {
      grossEur,
      announcedKm,
      forcedDetourKm,
      realTotalKm,
      emptyReturnKm,
      effectiveTotalKmWithReturn,
      realNetProfitEur,
      realNetEurPerKm,
      realNetEurPerKmWithReturn,
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
    isOverweight,
    userPrefs,
    evaluateOfferAgainstPreferences,
    effectiveEmptyReturn,
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
      : '2.4 kg (Peso Normal - Sem Sobrecarga)';
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
    selectOfferPreset({
      ...basePreset,
      id: `UPLOAD-${Date.now()}`,
    });
    setDecisionFeedback(`Print "${file.name}" lido.`);
    setIsScenarioPickerOpen(false);
  };

  const handleRecordDecision = (verdict: 'ACEITE' | 'RECUSADA') => {
    recordOfferDecision(
      activeScannedOffer,
      auditMetrics.realTotalKm,
      auditMetrics.realNetProfitEur,
      auditMetrics.realNetEurPerKm,
      verdict
    );
    setDecisionFeedback(
      verdict === 'ACEITE'
        ? `Pedido aceite (${auditMetrics.realNetProfitEur.toFixed(2)} € líq.) • Estado alterado para Ocupado (Com Pedido).`
        : 'Oferta recusada.'
    );
  };

  const handleGenerateOverweightComplaint = async () => {
    const { text } = generateOverweightDisputeProofAndLog(
      activeScannedOffer,
      totalAuditedWeightKg,
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

  const hasRouteOrRestAlert =
    Boolean(matchedRouteTrap) ||
    Boolean(matchedCriticalRestaurant) ||
    Boolean(isEstablishmentBlacklisted(activeScannedOffer.originName));

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

  return (
    <div className="space-y-3">
      {/* Top 2-Option Segmented Pill Switcher */}
      <div className="bg-zinc-900 p-1 rounded-xl grid grid-cols-2 gap-1 border border-zinc-800/80">
        <button
          type="button"
          onClick={() => setActiveView('OFERTA_ATUAL')}
          className={`rounded-md py-1.5 text-xs transition cursor-pointer ${
            activeView === 'OFERTA_ATUAL'
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          {isOfferAccepted ? 'Ciclo de Entrega Ativo' : 'Oferta Atual'}
        </button>
        <button
          type="button"
          onClick={() => setActiveView('DIVIDIDO_PESO')}
          className={`rounded-md py-1.5 text-xs transition cursor-pointer ${
            activeView === 'DIVIDIDO_PESO'
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          Dividido &amp; Peso ({totalAuditedWeightKg.toFixed(1)} kg)
        </button>
      </div>

      {/* =====================================================================
          VIEW A: OFERTA ATUAL (NON-STACKED: OFFER BEFORE ACCEPTANCE, LIFECYCLE AFTER)
          ===================================================================== */}
      {activeView === 'OFERTA_ATUAL' && (
        <div className="space-y-2.5">
          {/* 0. Auto-Detetor de Pedidos (Uber / Glovo): ATIVO Status Bar */}
          <div className="rounded-xl bg-zinc-900/95 border border-emerald-500/40 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-zinc-100 block truncate">
                    Auto-Detetor de Pedidos (Uber / Glovo): ATIVO
                  </span>
                  <span className="text-[10px] text-zinc-400 block truncate">
                    Lê automaticamente o valor (€) e distância (km) no ecrã / print e fala o lucro líquido
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={openAndroidAccessibilitySettings}
                className="shrink-0 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2.5 py-1.5 text-[10px] font-extrabold text-zinc-100 cursor-pointer transition whitespace-nowrap"
              >
                ⚙️ Acessibilidade
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => triggerAutoDetectedOffer(5.5, 3.1, 'Glovo')}
                className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] py-1.5 px-2.5 cursor-pointer transition whitespace-nowrap"
              >
                ⚡ Testar Deteção Automática (Glovo 5,50€ • 3,1 km)
              </button>
              <button
                type="button"
                onClick={() => triggerAutoDetectedOffer(3.1, 4.8, 'Uber Eats')}
                className="rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold text-[10px] py-1.5 px-2.5 cursor-pointer transition whitespace-nowrap"
              >
                Simular Uber (3,10€ • 4,8 km)
              </button>
            </div>
          </div>

          {/* 1. Clean Offer Analyzer & Today's Real Shift Summary */}
          {!isOfferAccepted &&
            aiAgentConfig.productionModeRealOnly &&
            activeScannedOffer.id.startsWith('PRESET-') && (
              <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-4 space-y-3">
                {/* Today's Quick Shift Summary + 1-Tap Live Amarante Weather */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Ganhos Hoje ({realCompletedDeliveries.length} ent.)
                      </span>
                      <span className="text-lg font-black text-emerald-500">
                        €
                        {realCompletedDeliveries
                          .reduce((acc, d) => acc + (d.netProfitEur || 0), 0)
                          .toFixed(2)
                          .replace('.', ',')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void openAndFetchAmaranteWeather(true)}
                    className="rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 p-3 flex items-center justify-between text-left cursor-pointer transition"
                  >
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Clima Amarante
                      </span>
                      <span className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 text-xs font-black text-slate-900 dark:text-slate-50">
                        <span>{amaranteLiveWeather.conditionEmoji}</span>
                        <span>
                          {amaranteLiveWeather.temperatureC.toFixed(1)}°C •{' '}
                          {amaranteLiveWeather.rainMm.toFixed(1)}mm
                        </span>
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">
                      Ver →
                    </span>
                  </button>
                </div>

                {/* Real Offer Analyzer Controls */}
                <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 space-y-2.5 text-center">
                  <p className="text-xs font-extrabold text-zinc-100">
                    Analisar Oferta ({activePlatforms.join(' • ')})
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Importa um print da oferta ou insere o valor e distância para ver se compensa aceitar.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs px-3.5 py-2.5 flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>📸 Ler Print de Oferta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickManualOfferOpen((prev) => !prev)}
                      className="rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-bold text-xs px-3.5 py-2.5 cursor-pointer transition"
                    >
                      ⚡ Avaliar Oferta Manual (€ / KM)
                    </button>
                  </div>
                </div>

                {quickManualOfferOpen && (
                  <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-left space-y-2 mt-2">
                    <span className="text-[11px] font-bold text-zinc-100 block">
                      Avaliar Oferta Rápida (Amarante)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-0.5">
                          Valor Bruto (€)
                        </label>
                        <input
                          type="number"
                          step="0.10"
                          value={quickOfferGross}
                          onChange={(e) => setQuickOfferGross(e.target.value)}
                          className="w-full rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs font-mono text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-0.5">
                          Distância (KM)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={quickOfferKm}
                          onChange={(e) => setQuickOfferKm(e.target.value)}
                          className="w-full rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs font-mono text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-0.5">
                          Destino / Zona
                        </label>
                        <input
                          type="text"
                          value={quickOfferDest}
                          onChange={(e) => setQuickOfferDest(e.target.value)}
                          className="w-full rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-100"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const gross = Math.max(1, parseFloat(quickOfferGross) || 5.5);
                        const km = Math.max(0.3, parseFloat(quickOfferKm) || 3.2);
                        const dest = quickOfferDest.trim() || 'São Gonçalo, Amarante';
                        const customOffer: ScannedOffer = {
                          ...SCANNER_OFFER_PRESETS[0],
                          id: `REAL-MANUAL-${Date.now()}`,
                          platform: activePlatforms[0] || 'Uber Eats',
                          orderId: `#${Math.floor(1000 + Math.random() * 9000)}`,
                          grossAmountEur: gross,
                          appAnnouncedKm: km,
                          estimatedMinutes: Math.max(8, Math.round(km * 4)),
                          originName: 'Centro de Amarante',
                          destinationName: dest,
                          segmentText: `Centro Amarante → ${dest}`,
                          cityZone: dest,
                          isSplitOrderCandidate: false,
                        };
                        selectOfferPreset(customOffer);
                        setQuickManualOfferOpen(false);
                      }}
                      className="w-full rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs py-2 cursor-pointer transition"
                    >
                      Analisar Rentabilidade Agora
                    </button>
                  </div>
                )}
              </section>
            )}

          {!isOfferAccepted &&
            !(
              aiAgentConfig.productionModeRealOnly &&
              activeScannedOffer.id.startsWith('PRESET-')
            ) && (
            <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-3">
              {/* Platform + Restaurant & Big Verdict */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-zinc-400 block truncate">
                    {activeScannedOffer.platform} •{' '}
                    {activeScannedOffer.orderId || '#4829'} •{' '}
                    {activeScannedOffer.grossAmountEur.toFixed(2)}{'\u00A0'}€ Bruto
                  </span>
                  <h2 className="text-sm font-semibold text-zinc-100 truncate mt-0.5">
                    {activeScannedOffer.originName}
                  </h2>
                  <span className="text-[11px] text-zinc-500 block truncate">
                    → {activeScannedOffer.destinationName}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      auditMetrics.verdictCode === 'ACEITAR'
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {auditMetrics.verdictCode === 'ACEITAR' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    <span>{auditMetrics.verdictLabel}</span>
                  </span>
                  <span className="text-[11px] text-zinc-400 block mt-1 whitespace-nowrap">
                    {auditMetrics.verdictSummary}
                  </span>
                </div>
              </div>

              {/* MODULE 3: Empty Return Dead-Zone Calculator Toggle */}
              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 px-2.5 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-zinc-100 block truncate">
                    🔄 Calculadora de Retorno Vazio (Zonas Mortas)
                  </span>
                  <span className="text-[10px] text-zinc-400 block truncate">
                    {isPeripheralDeadZoneDetected
                      ? 'Periferia detetada automaticamente (+40% KM retorno)'
                      : 'Adiciona +40% KM se voltares vazio (Freixo / Lixa / Vila Meã)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setIncludeEmptyReturnDeadZone((prev) => !prev)
                  }
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-extrabold cursor-pointer transition whitespace-nowrap ${
                    effectiveEmptyReturn
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                  }`}
                >
                  {effectiveEmptyReturn ? 'Retorno +40% ON' : 'Ativar Retorno'}
                </button>
              </div>

              {/* Compact 2x2 Grid: €/km Líquido, Distância Real, Lucro Limpo, Peso */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                    {effectiveEmptyReturn
                      ? '€/km Real c/ Retorno'
                      : '€/km Líquido'}
                  </span>
                  <div className="text-base font-mono font-semibold text-zinc-100 mt-0.5 whitespace-nowrap">
                    {(effectiveEmptyReturn
                      ? auditMetrics.realNetEurPerKmWithReturn
                      : auditMetrics.realNetEurPerKm
                    ).toFixed(2)}{'\u00A0'}€/km
                  </div>
                  <span className="text-[10px] text-zinc-400 block whitespace-nowrap">
                    {effectiveEmptyReturn
                      ? `Só ida: ${auditMetrics.realNetEurPerKm.toFixed(2)}\u00A0€/km`
                      : `c/ Retorno: ${auditMetrics.realNetEurPerKmWithReturn.toFixed(2)}\u00A0€/km`}
                  </span>
                </div>

                <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                    Distância Real
                  </span>
                  <div className="text-base font-mono font-semibold text-zinc-100 mt-0.5 whitespace-nowrap">
                    {effectiveEmptyReturn
                      ? `${auditMetrics.effectiveTotalKmWithReturn.toFixed(1)} km`
                      : `${auditMetrics.realTotalKm.toFixed(1)} km`}
                  </div>
                  <span className="text-[10px] text-zinc-500 block whitespace-nowrap">
                    {effectiveEmptyReturn
                      ? `Ida ${auditMetrics.realTotalKm.toFixed(1)} + Ret. ${auditMetrics.emptyReturnKm.toFixed(1)} km`
                      : auditMetrics.forcedDetourKm > 0
                        ? `+${auditMetrics.forcedDetourKm.toFixed(1)} km desvio`
                        : `App: ${auditMetrics.announcedKm.toFixed(1)} km`}
                  </span>
                </div>

                <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                    Lucro Limpo
                  </span>
                  <div className="text-base font-mono font-semibold text-emerald-500 mt-0.5 whitespace-nowrap">
                    +{Math.abs(auditMetrics.realNetProfitEur).toFixed(2)}{'\u00A0'}€
                  </div>
                  <span className="text-[10px] text-zinc-300 font-mono block whitespace-nowrap">
                    Ritmo Limpo: +{Math.abs(auditMetrics.projectedHourlyNetEur).toFixed(2)}{'\u00A0'}€/h
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveView('DIVIDIDO_PESO')}
                  className="rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 p-2.5 text-left cursor-pointer transition"
                >
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                    <span>Peso</span>
                    <Scale className="h-3 w-3 text-zinc-400" />
                  </span>
                  <div className="text-base font-mono font-semibold text-zinc-100 mt-0.5">
                    {totalAuditedWeightKg.toFixed(1)} kg
                  </div>
                  <span className="text-[10px] text-zinc-400 block truncate">
                    {isOverweight
                      ? `Excesso (> ${backpackWeightLimitKg.toFixed(0)} kg)`
                      : 'Peso Normal'}
                  </span>
                </button>
              </div>

              {/* 2. Action Buttons: Aceitar + Recusar + Subtle Ouvir Icon */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleRecordDecision('ACEITE')}
                  className="flex-1 rounded-lg py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Aceitar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRecordDecision('RECUSADA')}
                  className="flex-1 rounded-lg py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Recusar</span>
                </button>

                <button
                  type="button"
                  onClick={() => speakTextPt(auditMetrics.ttsMessage)}
                  title="Ouvir leitura por voz (pt-BR)"
                  aria-label="Ouvir leitura por voz (pt-BR)"
                  className="rounded-lg p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 cursor-pointer transition shrink-0"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              {decisionFeedback && (
                <div className="text-[11px] text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
                  <span className="truncate">{decisionFeedback}</span>
                  <button
                    type="button"
                    onClick={() => setDecisionFeedback(null)}
                    className="text-zinc-500 hover:text-zinc-200 text-[10px] cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              )}
            </section>
          )}

          {/* 2B. ACTIVE DELIVERY LIFECYCLE CARD (Shown ONLY when order is accepted) */}
          {isOfferAccepted && (
            <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3 space-y-2.5">
              {/* Top Row: Lifecycle Title + Return to Offer Scanner */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Navigation className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
                  <span className="text-xs font-semibold text-zinc-100 truncate">
                    Ciclo de Entrega ({activeDeliveryLifecycle.orderId})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOfferAccepted(false)}
                  className="rounded-md bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300 cursor-pointer shrink-0"
                >
                  ← Ver Scanner
                </button>
              </div>

              {/* 3-Stage Stepper Strip */}
              <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800/80 text-[10px]">
                <button
                  type="button"
                  onClick={() =>
                    startActiveDeliveryFromOffer(
                      activeScannedOffer,
                      auditMetrics.realTotalKm,
                      auditMetrics.realNetProfitEur
                    )
                  }
                  className={`rounded py-1 px-1.5 text-center truncate transition cursor-pointer ${
                    activeDeliveryLifecycle.stage === 'AGUARDAR_RECOLHA'
                      ? 'bg-white text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  1. Aguardar Recolha
                </button>
                <button
                  type="button"
                  onClick={() => startDeliveryTransitStage()}
                  className={`rounded py-1 px-1.5 text-center truncate transition cursor-pointer ${
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
                  className={`rounded py-1 px-1.5 text-center truncate transition cursor-pointer ${
                    activeDeliveryLifecycle.stage === 'CONCLUIDA'
                      ? 'bg-white text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  3. Finalizar Entrega
                </button>
              </div>

              {/* Stage 1: Aguardar Recolha (Na Loja) */}
              {activeDeliveryLifecycle.stage === 'AGUARDAR_RECOLHA' && (
                <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-zinc-100">
                      Aguardar Recolha (Na Loja)
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[11px] font-mono font-semibold text-zinc-100">
                      <Clock className="h-3 w-3 text-zinc-400" />
                      <span>
                        Tempo na Recolha:{' '}
                        {formatWaitTimerMmSs(
                          activeDeliveryLifecycle.waitSecondsAtStore
                        )}
                      </span>
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-400 flex items-center justify-between gap-2">
                    <span className="truncate">
                      {activeDeliveryLifecycle.originName} →{' '}
                      {activeDeliveryLifecycle.destinationName}
                    </span>
                    <span className="font-mono text-zinc-200 shrink-0 whitespace-nowrap">
                      +{activeDeliveryLifecycle.netProfitEur.toFixed(2)}{'\u00A0'}€ •{' '}
                      {activeDeliveryLifecycle.realKm.toFixed(1)} km
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => startDeliveryTransitStage()}
                    className="w-full rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Pedido Recolhido / Iniciar Entrega</span>
                  </button>
                </div>
              )}

              {/* Stage 2: Em Trânsito (Recolhido -> Destino) */}
              {activeDeliveryLifecycle.stage === 'EM_TRANSITO' && (
                <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-zinc-100">
                      Em Trânsito (Recolhido → Destino)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-300">
                      ● Ocupado (Em Entrega)
                    </span>
                  </div>

                  <div className="rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-[10px] font-mono text-zinc-200">
                    {activeDeliveryLifecycle.lastMacroExecuted ||
                      "[Macro: Deslizar 'Pedido Recolhido' + Abrir Navegação GPS]"}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>
                        Destino: {activeDeliveryLifecycle.destinationName} (
                        {activeDeliveryLifecycle.realKm.toFixed(1)} km)
                      </span>
                      <span className="font-mono text-zinc-200">
                        ETA ~{activeDeliveryLifecycle.estimatedMinutes} min
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden">
                      <div
                        className="h-full bg-zinc-100 rounded-full transition-all"
                        style={{
                          width: `${activeDeliveryLifecycle.transitProgressPct}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-zinc-300 pt-0.5">
                      <span className="text-zinc-500">Código / Local (Zero-PII): </span>
                      {activeDeliveryLifecycle.customerDropoffNotes}
                    </p>
                  </div>

                  {/* MODULE 4: Last 50m Collective Memory (Zero-PII Quick Micro-Notes) */}
                  <div className="rounded-lg bg-zinc-900/90 border border-zinc-800 p-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold text-emerald-400">
                        📍 Memória Coletiva: Últimos 50m (Zero-PII)
                      </span>
                      <span className="text-[9px] text-zinc-400">
                        1-toque grava alerta p/ colegas
                      </span>
                    </div>
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
                          className="rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-200 text-left truncate cursor-pointer transition"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    {last50mFeedback && (
                      <p className="text-[10px] font-bold text-emerald-400">
                        ✅ {last50mFeedback} (Sincronizado no Mapa de Amarante)
                      </p>
                    )}
                    {locationRouteNotes.length > 0 && (
                      <p className="text-[10px] text-zinc-400 truncate">
                        Última nota na zona: {locationRouteNotes[0].noteText}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDecisionFeedback(null);
                      completeActiveDeliveryStage();
                    }}
                    className="w-full rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Finalizar Entrega (Concluída)</span>
                  </button>
                </div>
              )}

              {/* Stage 3: Finalizar Entrega (Concluída) */}
              {activeDeliveryLifecycle.stage === 'CONCLUIDA' && (
                <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-zinc-100">
                      Entrega Concluída
                    </span>
                    <span className="text-[10px] font-mono text-emerald-500">
                      ● Disponível (Livre)
                    </span>
                  </div>

                  <div className="rounded bg-zinc-900/80 border border-zinc-800/80 p-2 text-[11px] text-zinc-300 space-y-0.5">
                    <div className="flex items-center justify-between font-semibold text-zinc-100">
                      <span>Sincronização Automática Concluída</span>
                      <span className="font-mono">+15 BuddyCoins</span>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      +{activeDeliveryLifecycle.netProfitEur.toFixed(2)}{'\u00A0'}€ líq. e +
                      {activeDeliveryLifecycle.realKm.toFixed(1)} km adicionados
                      às Metas Privadas e Carteira {activeDeliveryLifecycle.platform}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDecisionFeedback(null);
                      setIsOfferAccepted(false);
                    }}
                    className="w-full rounded-lg bg-white text-zinc-950 py-2 px-3 text-xs font-semibold cursor-pointer transition"
                  >
                    Voltar ao Avaliador de Ofertas
                  </button>
                </div>
              )}

              {/* Compact Hands-Free Voice Trigger Pills */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => executeVoiceCommandPt('Iniciar entrega')}
                  className="flex-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 px-2 py-1.5 text-[11px] font-medium text-zinc-200 flex items-center justify-center gap-1 cursor-pointer transition"
                >
                  <Mic className="h-3 w-3 text-zinc-400 shrink-0" />
                  <span className="truncate">Voz: Iniciar Entrega</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDecisionFeedback(null);
                    executeVoiceCommandPt('Finalizar entrega');
                  }}
                  className="flex-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 px-2 py-1.5 text-[11px] font-medium text-zinc-200 flex items-center justify-center gap-1 cursor-pointer transition"
                >
                  <Mic className="h-3 w-3 text-zinc-400 shrink-0" />
                  <span className="truncate">Voz: Finalizar Entrega</span>
                </button>
              </div>
            </section>
          )}

          {/* 2C. SUPPORT SPLIT-ORDER MACRO CARD (Shown ONLY when triggered or when overweight >12kg) */}
          {(activeSupportSplitMacro.triggeredAtTimestamp !== null ||
            isOverweight) && (
            <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-zinc-100 block truncate">
                    Macro de Voz: &ldquo;Dividir Pedido&rdquo; no Suporte
                  </span>
                  <span className="text-[10px] text-zinc-400 block truncate">
                    Plataforma: {activeSupportSplitMacro.platform} • Pedido{' '}
                    {activeScannedOffer.orderId || activeSupportSplitMacro.orderId}{' '}
                    ({totalAuditedWeightKg.toFixed(1)} kg)
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {activePlatforms.includes('Glovo') && (
                    <button
                      type="button"
                      onClick={() => triggerSupportSplitOrderMacro('Glovo')}
                      className={`rounded px-2 py-1 text-[10px] font-semibold cursor-pointer transition ${
                        activeSupportSplitMacro.platform === 'Glovo'
                          ? 'bg-white text-zinc-950'
                          : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Glovo
                    </button>
                  )}
                  {activePlatforms.includes('Uber Eats') && (
                    <button
                      type="button"
                      onClick={() => triggerSupportSplitOrderMacro('Uber Eats')}
                      className={`rounded px-2 py-1 text-[10px] font-semibold cursor-pointer transition ${
                        activeSupportSplitMacro.platform === 'Uber Eats'
                          ? 'bg-white text-zinc-950'
                          : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Uber
                    </button>
                  )}
                </div>
              </div>

              {/* Live 4-Step Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>
                    {activeSupportSplitMacro.isRunning
                      ? `Executando Toque Automático (${
                          activeSupportSplitMacro.currentStepIndex + 1
                        }/4)...`
                      : 'Sequência de Toques no Suporte (4/4 Concluída)'}
                  </span>
                  <span className="font-mono text-zinc-200">
                    {((activeSupportSplitMacro.currentStepIndex + 1) * 25).toFixed(
                      0
                    )}
                    %
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-zinc-100 transition-all duration-300"
                    style={{
                      width: `${
                        (activeSupportSplitMacro.currentStepIndex + 1) * 25
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Step-by-Step Simulated Taps (X%, Y%) */}
              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2 space-y-1">
                {activeSupportSplitMacro.steps.map((step, idx) => {
                  const isDoneOrActive =
                    idx <= activeSupportSplitMacro.currentStepIndex;
                  return (
                    <div
                      key={step.stepNumber}
                      className={`flex items-center justify-between gap-2 text-[10px] font-mono ${
                        isDoneOrActive ? 'text-zinc-100' : 'text-zinc-500'
                      }`}
                    >
                      <span className="truncate">{step.label}</span>
                      <span className="shrink-0 text-zinc-400">
                        X:{step.xPct}% Y:{step.yPct}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Auto-Pasted Support Message Preview (Dynamic Weight & Order ID) */}
              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 px-2.5 py-1.5 text-[10px] text-zinc-300">
                <span className="text-zinc-500 font-semibold block">
                  Mensagem Colada e Enviada no Chat:
                </span>
                <span className="line-clamp-2">
                  {activeSupportSplitMacro.autoPastedMessage}
                </span>
              </div>

              {/* 1-Tap Voice & Action Trigger Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => executeVoiceCommandPt('Dividir pedido')}
                  className="flex-1 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 py-2 px-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>Voz: &ldquo;Dividir pedido&rdquo;</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('voz_suporte')}
                  className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-2 px-2.5 text-[11px] font-semibold cursor-pointer transition shrink-0"
                >
                  Calibrar %X/%Y
                </button>
              </div>
            </section>
          )}

          {/* 3. Single Collapsible Alert Row (Only if Alert Exists) */}
          {hasRouteOrRestAlert && (
            <div className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsAlertExpanded((prev) => !prev)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-zinc-200 cursor-pointer"
              >
                <span>
                  Alerta de Rota / Estabelecimento:{' '}
                  {matchedRouteTrap
                    ? `+${auditMetrics.forcedDetourKm.toFixed(1)} km desvio`
                    : matchedCriticalRestaurant
                      ? `Espera >${auditMetrics.extraWaitMins} min`
                      : 'Lista Negra Ativa'}
                </span>
                {isAlertExpanded ? (
                  <ChevronUp className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                )}
              </button>

              {isAlertExpanded && (
                <div className="px-3.5 pb-3 pt-1 border-t border-zinc-800/80 space-y-2 text-xs text-zinc-300">
                  {matchedRouteTrap && (
                    <p>
                      {matchedRouteTrap.title}: {matchedRouteTrap.description}
                    </p>
                  )}
                  {matchedCriticalRestaurant && (
                    <p>
                      {matchedCriticalRestaurant.restaurantName}: espera média de{' '}
                      {auditMetrics.extraWaitMins} min.
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        openRouteTrapModalFromOffer(
                          activeScannedOffer,
                          auditMetrics.forcedDetourKm || 1.5
                        )
                      }
                      className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-2.5 py-1.5 text-[11px] font-medium cursor-pointer"
                    >
                      Gerar Prova Desvio
                    </button>
                    {isEstablishmentBlacklisted(
                      activeScannedOffer.originName
                    ) ? (
                      <button
                        type="button"
                        onClick={() =>
                          removeEstablishmentFromBlacklist(
                            isEstablishmentBlacklisted(
                              activeScannedOffer.originName
                            ) || activeScannedOffer.originName
                          )
                        }
                        className="rounded-lg bg-zinc-800 text-zinc-100 px-2.5 py-1.5 text-[11px] font-medium cursor-pointer"
                      >
                        Retirar da Lista Negra
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          addEstablishmentToBlacklist(
                            activeScannedOffer.originName
                          )
                        }
                        className="rounded-lg bg-zinc-800 text-zinc-100 px-2.5 py-1.5 text-[11px] font-medium cursor-pointer"
                      >
                        Bloquear Restaurante
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compact "Trocar Cenário / Ler Print" Selector */}
          <div className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 overflow-hidden">
            <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
              {aiAgentConfig.productionModeRealOnly ? (
                <span className="text-xs font-semibold text-emerald-400 truncate">
                  ● Modo Produção Real ({activePlatforms.join(' + ')})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsScenarioPickerOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white cursor-pointer truncate"
                >
                  <span className="truncate">
                    Trocar Cenário ({activeScannedOffer.presetBadge})
                  </span>
                  {isScenarioPickerOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-2.5 py-1 text-[11px] font-medium flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Upload className="h-3 w-3" />
                <span>Ler Print</span>
              </button>
            </div>

            {!aiAgentConfig.productionModeRealOnly && isScenarioPickerOpen && (
              <div className="px-3.5 pb-3 pt-1 border-t border-zinc-800/80 grid grid-cols-1 gap-1.5">
                {SCANNER_OFFER_PRESETS.filter((preset) =>
                  activePlatforms.includes(preset.platform)
                ).map((preset) => {
                  const active = activeScannedOffer.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        selectOfferPreset(preset);
                        setIsScenarioPickerOpen(false);
                      }}
                      className={`rounded-lg px-2.5 py-2 text-left text-xs flex items-center justify-between cursor-pointer ${
                        active
                          ? 'bg-white text-zinc-950 font-semibold'
                          : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="truncate">{preset.presetBadge}</span>
                      <span className="text-[10px] font-mono opacity-80 ml-2 shrink-0">
                        {preset.appAnnouncedKm.toFixed(1)} km
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW B: DIVIDIDO & PESO
          ===================================================================== */}
      {activeView === 'DIVIDIDO_PESO' && (
        <div className="space-y-2.5">
          {/* Weight Limit & Presets Card */}
          <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-100">
                Peso Total: {totalAuditedWeightKg.toFixed(1)} kg
              </span>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300">
                Limite: {backpackWeightLimitKg.toFixed(1)} kg
              </span>
            </div>

            <input
              type="range"
              min={8}
              max={20}
              step={0.5}
              value={backpackWeightLimitKg}
              onChange={(e) =>
                setBackpackWeightLimitKg(parseFloat(e.target.value) || 12.0)
              }
              className="w-full accent-white cursor-pointer"
            />

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setAuditedOrderItemsPreset('NORMAL_2_4KG')}
                className={`rounded-lg py-1.5 px-2 text-[11px] font-medium cursor-pointer ${
                  totalAuditedWeightKg <= 2.4
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'bg-zinc-950 text-zinc-300 border border-zinc-800'
                }`}
              >
                2.4 kg (Normal)
              </button>
              <button
                type="button"
                onClick={() => setAuditedOrderItemsPreset('OVERWEIGHT_27KG')}
                className={`rounded-lg py-1.5 px-2 text-[11px] font-medium cursor-pointer ${
                  totalAuditedWeightKg >= 27
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'bg-zinc-950 text-zinc-300 border border-zinc-800'
                }`}
              >
                27.0 kg (Supermercado)
              </button>
            </div>

            {/* Heavy Items List */}
            <div className="space-y-1.5 pt-1">
              {HEAVY_ITEMS_DB.map((item) => {
                const currentEntry = auditedOrderItems.find(
                  (e) => e.itemId === item.id
                );
                const qty = currentEntry?.quantity ?? 0;
                return (
                  <div
                    key={item.id}
                    className="rounded-lg bg-zinc-950 border border-zinc-800/80 px-2.5 py-2 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-zinc-100 block truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {item.unitWeightKg.toFixed(1)} kg/un
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateAuditedItemQuantity(item.id, -1)}
                        className="h-6 w-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 cursor-pointer"
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
            </div>

            {isOverweight && (
              <button
                type="button"
                onClick={handleGenerateOverweightComplaint}
                className="w-full rounded-lg py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {overweightProofCopied ? (
                  <>
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    <span>Prova de Peso Copiada ({requiredCouriersCount} Estafetas)</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar Prova de Sobrepeso ({requiredCouriersCount} Estafetas)</span>
                  </>
                )}
              </button>
            )}
          </section>

          {/* Split-Order Colleague Pairing Card: Shown ONLY when order is actually divided or > 12kg */}
          {isOverweight || activeScannedOffer.isSplitOrderCandidate ? (
            <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="h-4 w-4 text-zinc-300 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-zinc-100 truncate">
                      Colega Parceiro ({activeScannedOffer.orderId || '#4829'})
                    </h3>
                    <span className="text-[11px] text-zinc-400 block truncate">
                      {simulateSecondCourierPaired
                        ? 'Tiago R. conectado (a 180m)'
                        : 'A aguardar colega...'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={toggleSimulateSecondCourier}
                    className="rounded-lg py-1 px-2 bg-zinc-800 text-[11px] font-medium text-zinc-200 cursor-pointer"
                  >
                    {simulateSecondCourierPaired ? 'Ativo' : 'Simular'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveWalkieChannel('PARCEIRO_PEDIDO_DIVIDIDO');
                      setActiveTab('walkietalkie');
                    }}
                    className="rounded-lg py-1 px-2.5 bg-white text-zinc-950 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Radio className="h-3 w-3" />
                    <span>Rádio</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {cargoChecklistRows.map((row) => {
                  const checked = cargoSplitChecklist[row.id];
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => toggleCargoChecklistItem(row.id)}
                      className={`w-full rounded-lg px-2.5 py-2 border text-left flex items-center gap-2 text-xs cursor-pointer ${
                        checked
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-100 font-medium'
                          : 'bg-zinc-950 border-zinc-800/80 text-zinc-400'
                      }`}
                    >
                      {checked ? (
                        <CheckSquare className="h-3.5 w-3.5 text-white shrink-0" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      )}
                      <span className="truncate">{row.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-zinc-100 block">
                  Peso Normal ({totalAuditedWeightKg.toFixed(1)} kg ≤ {backpackWeightLimitKg.toFixed(0)} kg)
                </span>
                <span className="text-[11px] text-zinc-400 block">
                  Entrega individual sem necessidade de divisão de carga com 2.º estafeta.
                </span>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            </section>
          )}
        </div>
      )}
    </div>
  );
};
