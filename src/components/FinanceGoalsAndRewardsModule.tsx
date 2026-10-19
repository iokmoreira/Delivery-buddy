import React, { useState, useMemo } from 'react';
import {
  Plus,
  Wallet,
  Award,
  Check,
  QrCode,
  Lock,
  TrendingUp,
  Calendar,
  Layers,
  RotateCcw,
  X,
} from 'lucide-react';
import { useEstafetas } from '../context/EstafetasContext';
import { PlatformFilterScope, PlatformName } from '../types/models';

export const FinanceGoalsAndRewardsModule: React.FC = () => {
  const {
    glovoWallet,
    updateGlovoWallet,
    closeGlovoDailyAudit,
    personalGoals,
    updatePersonalGoals,
    addManualDeliveryRecord,
    resetRealDeliveriesAndTestData,
    buddyRewards,
    communityReputationPct,
    allMarketplaceRewards,
    claimMarketplaceReward,
    activeDeliveryLifecycle,
    shiftTrips,
    platformLedgers,
    activePlatformScope,
    setActivePlatformScope,
    updatePlatformLedger,
    vehicleProfile,
    aiAgentConfig,
    hasRealActiveDelivery,
    marketTelemetry,
    recordMarketTelemetrySnapshot,
    executeVoiceCommandPt,
    activePlatforms,
  } = useEstafetas();

  const [subTab, setSubTab] = useState<'METAS' | 'CAIXA' | 'VANTAGENS'>('METAS');
  const [voucherNotice, setVoucherNotice] = useState<string | null>(null);
  const [manualDeliveryPlatform, setManualDeliveryPlatform] =
    useState<PlatformName>(() => activePlatforms[0] || 'Uber Eats');
  const [showManualDeliveryModal, setShowManualDeliveryModal] = useState(false);
  const [manualGrossEur, setManualGrossEur] = useState('5.50');
  const [manualDistanceKm, setManualDistanceKm] = useState('2.8');
  const [manualMinutes, setManualMinutes] = useState('15');
  const [manualRestaurant, setManualRestaurant] = useState('');
  const [financeActionFeedback, setFinanceActionFeedback] = useState<string | null>(null);

  const enabledPlatforms = useMemo<PlatformName[]>(
    () =>
      activePlatforms && activePlatforms.length > 0
        ? activePlatforms
        : ['Uber Eats', 'Glovo'],
    [activePlatforms]
  );

  const isSinglePlatformMode = enabledPlatforms.length === 1;

  const visiblePlatformScopes = useMemo<
    { id: PlatformFilterScope; label: string }[]
  >(() => {
    if (isSinglePlatformMode) {
      return [{ id: enabledPlatforms[0], label: enabledPlatforms[0] }];
    }
    return [
      { id: 'GLOBAL_CRUZADO', label: 'Global (Cruzado)' },
      ...enabledPlatforms.map((p) => ({ id: p, label: p })),
    ];
  }, [enabledPlatforms, isSinglePlatformMode]);

  const effectiveScope: PlatformFilterScope = useMemo(() => {
    if (isSinglePlatformMode) {
      return enabledPlatforms[0];
    }
    if (
      activePlatformScope !== 'GLOBAL_CRUZADO' &&
      !enabledPlatforms.includes(activePlatformScope)
    ) {
      return 'GLOBAL_CRUZADO';
    }
    return activePlatformScope;
  }, [activePlatformScope, enabledPlatforms, isSinglePlatformMode]);

  // Helper to compute true net financial metrics for a single platform ledger
  const computePlatformMetrics = (platform: PlatformName) => {
    const ledger = platformLedgers[platform];
    const grossDay = ledger.dailyGrossEur;
    const fleetCutEur = Number(
      ((grossDay * ledger.fleetCommissionPct) / 100).toFixed(2)
    );
    const taxReserveEur = Number(
      ((grossDay * ledger.specificTaxAndSsPct) / 100).toFixed(2)
    );
    const kmCostPerKm =
      (vehicleProfile.fuelOrEnergyPerKm || 0.05) +
      (vehicleProfile.maintenanceAndTiresPerKm || 0.04);
    const vehicleCostEur = Number(
      (ledger.completedKmToday * kmCostPerKm).toFixed(2)
    );

    const netDayEur = Number(
      Math.max(
        0,
        grossDay +
          (ledger.tipsAndBonusesEur || 0) -
          fleetCutEur -
          taxReserveEur -
          vehicleCostEur
      ).toFixed(2)
    );

    const netRatio =
      grossDay > 0 ? Math.max(0.55, netDayEur / grossDay) : 0.78;
    const netWeekEur = Number((ledger.weeklyGrossEur * netRatio).toFixed(2));
    const netMonthEur = Number((ledger.monthlyGrossEur * netRatio).toFixed(2));

    const hours = Math.max(0.5, ledger.hoursWorkedToday);
    const netPerHourEur = Number((netDayEur / hours).toFixed(2));
    const netPerKmEur = Number(
      (netDayEur / Math.max(1, ledger.completedKmToday)).toFixed(2)
    );

    // Glovo cash reconciliation if platform === 'Glovo'
    const cashDiffEur =
      platform === 'Glovo'
        ? Number(
            (
              glovoWallet.initialAppWalletEur +
              grossDay +
              glovoWallet.cashPaidAtRestaurantsEur -
              glovoWallet.cashReceivedHandsEur
            ).toFixed(2)
          )
        : netDayEur;

    return {
      ledger,
      grossDay,
      fleetCutEur,
      taxReserveEur,
      vehicleCostEur,
      netDayEur,
      netWeekEur,
      netMonthEur,
      netPerHourEur,
      netPerKmEur,
      cashDiffEur,
    };
  };

  // Cross-referenced Global & Per-Platform financial computations (only over enabledPlatforms)
  const crossRefMetrics = useMemo(() => {
    const byPlatform: Record<
      PlatformName,
      ReturnType<typeof computePlatformMetrics>
    > = {
      'Uber Eats': computePlatformMetrics('Uber Eats'),
      Glovo: computePlatformMetrics('Glovo'),
      'Bolt Food': computePlatformMetrics('Bolt Food'),
    };

    const list = enabledPlatforms.map((p) => byPlatform[p]);

    const globalGrossDayEur = Number(
      list.reduce((acc, m) => acc + m.grossDay, 0).toFixed(2)
    );
    const globalFleetCutEur = Number(
      list.reduce((acc, m) => acc + m.fleetCutEur, 0).toFixed(2)
    );
    const globalTaxReserveEur = Number(
      list.reduce((acc, m) => acc + m.taxReserveEur, 0).toFixed(2)
    );
    const globalVehicleCostEur = Number(
      list.reduce((acc, m) => acc + m.vehicleCostEur, 0).toFixed(2)
    );
    const globalNetDayEur = Number(
      list.reduce((acc, m) => acc + m.netDayEur, 0).toFixed(2)
    );
    const globalNetWeekEur = Number(
      list.reduce((acc, m) => acc + m.netWeekEur, 0).toFixed(2)
    );
    const globalNetMonthEur = Number(
      list.reduce((acc, m) => acc + m.netMonthEur, 0).toFixed(2)
    );

    const globalDeliveriesToday = list.reduce(
      (acc, m) => acc + m.ledger.completedDeliveriesToday,
      0
    );
    const globalKmToday = Number(
      list.reduce((acc, m) => acc + m.ledger.completedKmToday, 0).toFixed(1)
    );
    const globalActiveHoursToday = Number(
      Math.max(
        1,
        list.reduce((acc, m) => acc + m.ledger.hoursWorkedToday, 0)
      ).toFixed(2)
    );

    const globalNetPerHourEur = Number(
      (globalNetDayEur / globalActiveHoursToday).toFixed(2)
    );
    const globalNetPerKmEur = Number(
      (globalNetDayEur / Math.max(1, globalKmToday)).toFixed(2)
    );

    const globalDailyGoalEur = Number(
      list.reduce((acc, m) => acc + m.ledger.dailyNetGoalEur, 0).toFixed(0)
    );
    const globalWeeklyGoalEur = Number(
      list.reduce((acc, m) => acc + m.ledger.weeklyNetGoalEur, 0).toFixed(0)
    );
    const globalMonthlyGoalEur = Number(
      list.reduce((acc, m) => acc + m.ledger.monthlyNetGoalEur, 0).toFixed(0)
    );

    // Best paying platform by €/h among enabledPlatforms
    const sortedByHourly = [...list].sort(
      (a, b) => b.netPerHourEur - a.netPerHourEur
    );
    const bestHourlyPlatform = sortedByHourly[0] || byPlatform['Uber Eats'];

    return {
      byPlatform,
      globalGrossDayEur,
      globalFleetCutEur,
      globalTaxReserveEur,
      globalVehicleCostEur,
      globalNetDayEur,
      globalNetWeekEur,
      globalNetMonthEur,
      globalDeliveriesToday,
      globalKmToday,
      globalActiveHoursToday,
      globalNetPerHourEur,
      globalNetPerKmEur,
      globalDailyGoalEur,
      globalWeeklyGoalEur,
      globalMonthlyGoalEur,
      bestHourlyPlatform,
    };
  }, [platformLedgers, vehicleProfile, glovoWallet, enabledPlatforms]);

  // Scoped Statistics & Goals view values (Global vs Selected Individual Platform)
  const scopedStats = useMemo(() => {
    if (effectiveScope === 'GLOBAL_CRUZADO') {
      const dailyGoal =
        personalGoals.dailyNetGoalEur || crossRefMetrics.globalDailyGoalEur;
      const weeklyGoal =
        personalGoals.weeklyNetGoalEur || crossRefMetrics.globalWeeklyGoalEur;
      const monthlyGoal =
        personalGoals.monthlyNetGoalEur || crossRefMetrics.globalMonthlyGoalEur;

      const currentDaily = crossRefMetrics.globalNetDayEur;
      const currentWeekly = crossRefMetrics.globalNetWeekEur;
      const currentMonthly = crossRefMetrics.globalNetMonthEur;

      const remainingDailyEur = Math.max(
        0,
        Number((dailyGoal - currentDaily).toFixed(2))
      );
      const remainingOrders = Math.ceil(remainingDailyEur / 4.8);

      return {
        scopeLabel: `Global (${enabledPlatforms.join(' + ')})`,
        currentDaily,
        dailyGoal,
        dailyPct: Math.min(
          100,
          Math.round((currentDaily / Math.max(1, dailyGoal)) * 100)
        ),
        currentWeekly,
        weeklyGoal,
        weeklyPct: Math.min(
          100,
          Math.round((currentWeekly / Math.max(1, weeklyGoal)) * 100)
        ),
        currentMonthly,
        monthlyGoal,
        monthlyPct: Math.min(
          100,
          Math.round((currentMonthly / Math.max(1, monthlyGoal)) * 100)
        ),
        deliveriesToday: crossRefMetrics.globalDeliveriesToday,
        kmToday: crossRefMetrics.globalKmToday,
        netPerKmEur: crossRefMetrics.globalNetPerKmEur,
        netPerHourEur: crossRefMetrics.globalNetPerHourEur,
        remainingDailyEur,
        remainingOrders,
      };
    }

    const platMetrics = crossRefMetrics.byPlatform[effectiveScope];
    const dailyGoal = platMetrics.ledger.dailyNetGoalEur;
    const weeklyGoal = platMetrics.ledger.weeklyNetGoalEur;
    const monthlyGoal = platMetrics.ledger.monthlyNetGoalEur;

    const currentDaily = platMetrics.netDayEur;
    const currentWeekly = platMetrics.netWeekEur;
    const currentMonthly = platMetrics.netMonthEur;

    const remainingDailyEur = Math.max(
      0,
      Number((dailyGoal - currentDaily).toFixed(2))
    );
    const remainingOrders = Math.ceil(remainingDailyEur / 4.8);

    return {
      scopeLabel: isSinglePlatformMode
        ? `${effectiveScope} (Plataforma Única)`
        : `${effectiveScope} (Individual)`,
      currentDaily,
      dailyGoal,
      dailyPct: Math.min(
        100,
        Math.round((currentDaily / Math.max(1, dailyGoal)) * 100)
      ),
      currentWeekly,
      weeklyGoal,
      weeklyPct: Math.min(
        100,
        Math.round((currentWeekly / Math.max(1, weeklyGoal)) * 100)
      ),
      currentMonthly,
      monthlyGoal,
      monthlyPct: Math.min(
        100,
        Math.round((currentMonthly / Math.max(1, monthlyGoal)) * 100)
      ),
      deliveriesToday: platMetrics.ledger.completedDeliveriesToday,
      kmToday: platMetrics.ledger.completedKmToday,
      netPerKmEur: platMetrics.netPerKmEur,
      netPerHourEur: platMetrics.netPerHourEur,
      remainingDailyEur,
      remainingOrders,
    };
  }, [
    effectiveScope,
    crossRefMetrics,
    personalGoals,
    enabledPlatforms,
    isSinglePlatformMode,
  ]);

  const lastCompletedDecision = useMemo(() => {
    const activeTrips = shiftTrips.filter((d) =>
      enabledPlatforms.includes(d.platform)
    );
    if (effectiveScope === 'GLOBAL_CRUZADO') {
      return (
        activeTrips.find((d) => d.verdict === 'ACEITE') ||
        activeTrips[0] ||
        null
      );
    }
    return (
      activeTrips.find(
        (d) => d.verdict === 'ACEITE' && d.platform === effectiveScope
      ) ||
      activeTrips.find((d) => d.platform === effectiveScope) ||
      activeTrips[0] ||
      null
    );
  }, [shiftTrips, effectiveScope, enabledPlatforms]);

  const courierTier =
    buddyRewards.xpPoints >= 1000
      ? 'Lenda da Estrada'
      : buddyRewards.xpPoints >= 600
        ? 'Capitão de Zona'
        : 'Parceiro Verificado';

  const handleClaimVoucher = (rewardId: string) => {
    const res = claimMarketplaceReward(rewardId);
    setVoucherNotice(res.message);
  };

  const handleGoalChange = (
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    value: number
  ) => {
    const cleanVal = Math.max(10, value);
    if (effectiveScope === 'GLOBAL_CRUZADO') {
      if (period === 'DAILY') {
        updatePersonalGoals({ dailyNetGoalEur: cleanVal });
      } else if (period === 'WEEKLY') {
        updatePersonalGoals({ weeklyNetGoalEur: cleanVal });
      } else {
        updatePersonalGoals({ monthlyNetGoalEur: cleanVal });
      }
    } else {
      if (period === 'DAILY') {
        updatePlatformLedger(effectiveScope, { dailyNetGoalEur: cleanVal });
      } else if (period === 'WEEKLY') {
        updatePlatformLedger(effectiveScope, { weeklyNetGoalEur: cleanVal });
      } else {
        updatePlatformLedger(effectiveScope, {
          monthlyNetGoalEur: cleanVal,
        });
      }
    }
  };

  const safeManualPlatform: PlatformName = enabledPlatforms.includes(
    manualDeliveryPlatform
  )
    ? manualDeliveryPlatform
    : enabledPlatforms[0];

  const targetPlatformForManualLog: PlatformName =
    effectiveScope === 'GLOBAL_CRUZADO' ? safeManualPlatform : effectiveScope;

  const isProdWithoutActiveDelivery =
    Boolean(aiAgentConfig.productionModeRealOnly) && !hasRealActiveDelivery;

  return (
    <div className="space-y-2.5">
      {/* Strict 3-Tab Segmented Pill Switcher (Private Section) */}
      <div className="bg-zinc-900 p-1 rounded-lg grid grid-cols-3 gap-1 border border-zinc-800/80">
        <button
          type="button"
          onClick={() => setSubTab('METAS')}
          className={`rounded-md py-1.5 text-xs transition cursor-pointer ${
            subTab === 'METAS'
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          Estatísticas &amp; Metas
        </button>
        <button
          type="button"
          onClick={() => setSubTab('CAIXA')}
          className={`rounded-md py-1.5 text-xs transition cursor-pointer ${
            subTab === 'CAIXA'
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          Finanças &amp; Caixa
        </button>
        <button
          type="button"
          onClick={() => setSubTab('VANTAGENS')}
          className={`rounded-md py-1.5 text-xs transition cursor-pointer ${
            subTab === 'VANTAGENS'
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          Vantagens
        </button>
      </div>

      {/* =====================================================================
          VIEW 1: MINHAS ESTATÍSTICAS & METAS (GLOBAL CRUZADO + POR PLATAFORMA)
          ===================================================================== */}
      {subTab === 'METAS' && (
        <div className="space-y-2.5">
          {/* Platform Switcher in Minhas Estatísticas (Metas) — Hidden when only 1 single platform is active to maximize screen space */}
          {!isSinglePlatformMode && (
            <div className="border border-zinc-800/80 rounded-xl bg-zinc-900/95 p-2 space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <Layers className="h-3 w-3 text-zinc-300" />
                  <span>Filtro de Estatísticas &amp; Metas por Plataforma</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-500 font-semibold">
                  {scopedStats.scopeLabel}
                </span>
              </div>
              <div
                className={`grid gap-1 ${
                  visiblePlatformScopes.length === 3
                    ? 'grid-cols-3'
                    : visiblePlatformScopes.length === 4
                      ? 'grid-cols-4'
                      : 'grid-cols-2'
                }`}
              >
                {visiblePlatformScopes.map((scope) => {
                  const active = effectiveScope === scope.id;
                  return (
                    <button
                      key={scope.id}
                      type="button"
                      onClick={() => setActivePlatformScope(scope.id)}
                      className={`rounded-lg py-1.5 px-2 text-[11px] font-semibold transition cursor-pointer truncate ${
                        active
                          ? 'bg-white text-zinc-950 shadow-xs'
                          : 'bg-zinc-950 text-zinc-400 hover:text-zinc-100 border border-zinc-800/80'
                      }`}
                    >
                      {scope.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CARD 1: Goals & Projections (Daily, Weekly, Monthly) */}
          <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Lock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span className="text-xs font-semibold text-zinc-100 truncate">
                  Metas &amp; Projeções ({scopedStats.scopeLabel})
                </span>
              </div>
              <span className="rounded bg-zinc-950 border border-zinc-800 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-500 shrink-0 whitespace-nowrap">
                +{scopedStats.netPerHourEur.toFixed(2)}{'\u00A0'}€/h •{' '}
                {scopedStats.netPerKmEur.toFixed(2)}{'\u00A0'}€/km
              </span>
            </div>

            {/* Daily Goal */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-100">Meta Diária</span>
                <div className="flex items-center gap-1.5 font-mono text-zinc-300">
                  <span className="whitespace-nowrap">{scopedStats.currentDaily.toFixed(2)}{'\u00A0'}€ /</span>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    step={5}
                    aria-label="Editar Meta Diária"
                    value={scopedStats.dailyGoal}
                    onChange={(e) =>
                      handleGoalChange('DAILY', parseFloat(e.target.value) || 50)
                    }
                    className="w-14 rounded bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 text-right text-xs font-mono text-zinc-100"
                  />
                  <span className="whitespace-nowrap">€ ({scopedStats.dailyPct}%)</span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-zinc-100 rounded-full transition-all"
                  style={{ width: `${scopedStats.dailyPct}%` }}
                />
              </div>
            </div>

            {/* Weekly Goal */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-100">Meta Semanal</span>
                <div className="flex items-center gap-1.5 font-mono text-zinc-300">
                  <span className="whitespace-nowrap">{scopedStats.currentWeekly.toFixed(2)}{'\u00A0'}€ /</span>
                  <input
                    type="number"
                    min={50}
                    max={3000}
                    step={25}
                    aria-label="Editar Meta Semanal"
                    value={scopedStats.weeklyGoal}
                    onChange={(e) =>
                      handleGoalChange(
                        'WEEKLY',
                        parseFloat(e.target.value) || 300
                      )
                    }
                    className="w-16 rounded bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 text-right text-xs font-mono text-zinc-100"
                  />
                  <span className="whitespace-nowrap">€ ({scopedStats.weeklyPct}%)</span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-zinc-100 rounded-full transition-all"
                  style={{ width: `${scopedStats.weeklyPct}%` }}
                />
              </div>
            </div>

            {/* Monthly Goal */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-100">Meta Mensal</span>
                <div className="flex items-center gap-1.5 font-mono text-zinc-300">
                  <span className="whitespace-nowrap">{scopedStats.currentMonthly.toFixed(2)}{'\u00A0'}€ /</span>
                  <input
                    type="number"
                    min={200}
                    max={10000}
                    step={50}
                    aria-label="Editar Meta Mensal"
                    value={scopedStats.monthlyGoal}
                    onChange={(e) =>
                      handleGoalChange(
                        'MONTHLY',
                        parseFloat(e.target.value) || 1200
                      )
                    }
                    className="w-16 rounded bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 text-right text-xs font-mono text-zinc-100"
                  />
                  <span className="whitespace-nowrap">€ ({scopedStats.monthlyPct}%)</span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-zinc-100 rounded-full transition-all"
                  style={{ width: `${scopedStats.monthlyPct}%` }}
                />
              </div>
            </div>

            {/* KPI Summary Row: Entregas Concluídas, KM Rodados, Média Líquida €/km, Quanto Falta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2">
                <span className="text-[10px] text-zinc-400 block">
                  Entregas Concluídas
                </span>
                <span className="text-xs font-mono font-bold text-zinc-100 whitespace-nowrap">
                  {scopedStats.deliveriesToday} entregas
                </span>
              </div>
              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2">
                <span className="text-[10px] text-zinc-400 block">
                  KM Rodados
                </span>
                <span className="text-xs font-mono font-bold text-zinc-100 whitespace-nowrap">
                  {scopedStats.kmToday.toFixed(1)} km
                </span>
              </div>
              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2">
                <span className="text-[10px] text-zinc-400 block">
                  Média Líquida €/km
                </span>
                <span className="text-xs font-mono font-bold text-emerald-500 whitespace-nowrap">
                  {scopedStats.netPerKmEur.toFixed(2)}{'\u00A0'}€/km
                </span>
              </div>
              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2">
                <span className="text-[10px] text-zinc-400 block">
                  Quanto Falta p/ Meta
                </span>
                <span className="text-xs font-mono font-bold text-zinc-100 whitespace-nowrap">
                  {scopedStats.remainingDailyEur > 0
                    ? `${scopedStats.remainingDailyEur.toFixed(2)}\u00A0€ (${scopedStats.remainingOrders} ped.)`
                    : 'Concluída!'}
                </span>
              </div>
            </div>

            {/* Entrega Atual & Última Entrega */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5 space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                  {isProdWithoutActiveDelivery
                    ? 'Entrega Atual'
                    : `Entrega Atual (${activeDeliveryLifecycle.orderId})`}
                </span>
                {isProdWithoutActiveDelivery ? (
                  <>
                    <span className="text-xs font-bold text-zinc-100 block">
                      Nenhuma entrega ativa
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 block truncate whitespace-nowrap">
                      0.00{'\u00A0'}€ líq. • 0.0 km
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-mono font-bold text-zinc-100 block whitespace-nowrap">
                      +{activeDeliveryLifecycle.netProfitEur.toFixed(2)}{'\u00A0'}€ líq. •{' '}
                      {activeDeliveryLifecycle.realKm.toFixed(1)} km
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {activeDeliveryLifecycle.platform} •{' '}
                      {activeDeliveryLifecycle.originName}
                    </span>
                  </>
                )}
              </div>

              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5 space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                  Última Entrega
                </span>
                {!lastCompletedDecision ? (
                  <>
                    <span className="text-xs font-bold text-zinc-100 block">
                      Sem registos hoje
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 block truncate whitespace-nowrap">
                      0.00{'\u00A0'}€ líq. • 0.0 km
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-mono font-bold text-zinc-100 block whitespace-nowrap">
                      +{lastCompletedDecision.netProfitEur.toFixed(2)}{'\u00A0'}€ líq. •{' '}
                      {lastCompletedDecision.realKm.toFixed(1)} km
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {lastCompletedDecision.platform} •{' '}
                      {lastCompletedDecision.segment}
                    </span>
                  </>
                )}
              </div>
            </div>

            {financeActionFeedback && (
              <div className="rounded-lg bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 flex items-center justify-between gap-2">
                <span>{financeActionFeedback}</span>
                <button
                  type="button"
                  onClick={() => setFinanceActionFeedback(null)}
                  className="text-[10px] text-emerald-400 hover:text-white cursor-pointer"
                >
                  OK
                </button>
              </div>
            )}

            {/* Action Row: "+ Registar Entrega Manual" Modal Trigger + "🧹 Zerar Dados de Teste" */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setShowManualDeliveryModal((prev) => !prev)}
                className="flex-1 rounded-lg py-2.5 px-3 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition whitespace-nowrap"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>+ Registar Entrega Manual</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetRealDeliveriesAndTestData();
                  setFinanceActionFeedback(
                    '🧹 Entregas e dados de teste zerados! Pronto para entregas 100% reais.'
                  );
                }}
                title="Zerar entregas de teste e iniciar contabilidade limpa"
                className="rounded-lg py-2.5 px-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>🧹 Zerar Dados de Teste</span>
              </button>
            </div>

            {/* Inline / Modal Form for "+ Registar Entrega Manual" */}
            {showManualDeliveryModal && (
              <div className="rounded-xl bg-zinc-950 border border-emerald-500/50 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-zinc-100">
                    📝 Registar Entrega Real Concluída
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowManualDeliveryModal(false)}
                    className="rounded p-1 text-zinc-400 hover:text-zinc-100 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-0.5">
                      Plataforma
                    </label>
                    <select
                      value={targetPlatformForManualLog}
                      onChange={(e) => {
                        const p = e.target.value as PlatformName;
                        setManualDeliveryPlatform(p);
                        if (effectiveScope !== 'GLOBAL_CRUZADO') {
                          setActivePlatformScope(p);
                        }
                      }}
                      className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100"
                    >
                      {enabledPlatforms.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-0.5">
                      Valor Bruto (€)
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      min="1"
                      value={manualGrossEur}
                      onChange={(e) => setManualGrossEur(e.target.value)}
                      className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-xs font-mono text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-0.5">
                      Distância (KM)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.3"
                      value={manualDistanceKm}
                      onChange={(e) => setManualDistanceKm(e.target.value)}
                      className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-xs font-mono text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-0.5">
                      Tempo (min)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="3"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(e.target.value)}
                      className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-xs font-mono text-zinc-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Restaurante / Zona (ex: Burger King Amarante)"
                    value={manualRestaurant}
                    onChange={(e) => setManualRestaurant(e.target.value)}
                    className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const gross = Math.max(1, parseFloat(manualGrossEur) || 5.0);
                      const km = Math.max(0.3, parseFloat(manualDistanceKm) || 2.5);
                      addManualDeliveryRecord({
                        platform: targetPlatformForManualLog,
                        grossEur: gross,
                        realKm: km,
                        restaurantName: manualRestaurant.trim() || 'Restaurante Amarante',
                      });
                      setShowManualDeliveryModal(false);
                      setFinanceActionFeedback(
                        `✅ Entrega registada em ${targetPlatformForManualLog} (${gross.toFixed(2)}\u00A0€ bruto • ${km.toFixed(1)} km)!`
                      );
                    }}
                    className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs px-3 py-1.5 cursor-pointer whitespace-nowrap"
                  >
                    Guardar Entrega
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* CARD 2: Mercado & Projeções (Amarante) — Global Hourly Telemetry & Projection Engine */}
          <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2 flex-wrap">
              <div className="flex items-center gap-1.5 min-w-0">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="text-xs font-extrabold text-zinc-100 truncate">
                  Mercado &amp; Projeções (Amarante •{' '}
                  {marketTelemetry.currentHourWindowLabel})
                </span>
              </div>
              <button
                type="button"
                onClick={() => recordMarketTelemetrySnapshot('MANUAL_FINANCAS')}
                className="rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 cursor-pointer shrink-0 whitespace-nowrap"
              >
                + Gravar Snapshot ({marketTelemetry.snapshotsRecordedCount})
              </button>
            </div>

            {/* 4 Core Global Hourly Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2 space-y-0.5">
                <span className="text-[10px] text-zinc-400 block">
                  Média Estafetas Online / Hora
                </span>
                <span className="text-xs font-mono font-bold text-zinc-100 block whitespace-nowrap">
                  {marketTelemetry.onlineCouriersNow} agora (Méd:{' '}
                  {marketTelemetry.hourlyAvgOnlineCouriers.toFixed(1)}/h)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 block whitespace-nowrap">
                  {marketTelemetry.freeCouriersNow} livres •{' '}
                  {marketTelemetry.busyCouriersNow} ocupados
                </span>
              </div>

              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2 space-y-0.5">
                <span className="text-[10px] text-zinc-400 block">
                  Média de Pedidos / Hora
                </span>
                <span className="text-xs font-mono font-bold text-zinc-100 block">
                  {marketTelemetry.isProductionCleanBaseline
                    ? 'A aguardar 1ª leitura real'
                    : `${marketTelemetry.avgOrdersPerHourPerCourier.toFixed(1)} ped/h`}
                </span>
                <span className="text-[10px] text-zinc-400 block">
                  {marketTelemetry.isProductionCleanBaseline
                    ? 'Lê 1 print ou regista entrega'
                    : 'Por estafeta ativo'}
                </span>
              </div>

              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2 space-y-0.5">
                <span className="text-[10px] text-zinc-400 block">
                  Média Valor Entrega / Hora
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 block">
                  {marketTelemetry.isProductionCleanBaseline
                    ? 'A aguardar 1ª leitura real'
                    : `${marketTelemetry.avgGrossPerDeliveryEur.toFixed(2)}\u00A0€ (${marketTelemetry.avgNetPerDeliveryEur.toFixed(2)}\u00A0€ líq.)`}
                </span>
                <span className="text-[10px] font-mono text-zinc-300 block">
                  {marketTelemetry.isProductionCleanBaseline
                    ? '0 snapshots acumulados'
                    : `Ritmo: ${marketTelemetry.avgHourlyPaceEur.toFixed(2)}\u00A0€/h`}
                </span>
              </div>

              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2 space-y-0.5">
                <span className="text-[10px] text-zinc-400 block">
                  Quanto Paga por KM (€/km Atual)
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 block">
                  {marketTelemetry.isProductionCleanBaseline
                    ? 'A aguardar 1ª leitura real'
                    : isSinglePlatformMode
                      ? `${enabledPlatforms[0]}: ${marketTelemetry.liveEurPerKmByScope[enabledPlatforms[0]].toFixed(2)}\u00A0€/km`
                      : `Global: ${marketTelemetry.liveEurPerKmByScope.GLOBAL_CRUZADO.toFixed(2)}\u00A0€/km`}
                </span>
                <span className="text-[9px] font-mono text-zinc-400 block truncate">
                  {marketTelemetry.isProductionCleanBaseline
                    ? 'Sem dados fictícios ativos'
                    : enabledPlatforms
                        .map(
                          (p) =>
                            `${p.split(' ')[0]} ${marketTelemetry.liveEurPerKmByScope[p].toFixed(2)}`
                        )
                        .join(' • ')}
                </span>
              </div>
            </div>

            {/* Projeção Próximas 3 Horas & Turno */}
            <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold text-zinc-100">
                  Projeção Próximas 3 Horas &amp; Turno
                </span>
                <span className="text-[10px] font-mono text-indigo-300">
                  {aiAgentConfig.productionModeRealOnly
                    ? 'Modo Produção Real (Sem Dados Fictícios)'
                    : 'Motor de Projeções Amarante'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {marketTelemetry.next3HoursProjections.map((proj) => (
                  <div
                    key={proj.hourLabel}
                    className="rounded-lg bg-zinc-900 border border-zinc-800 p-2 space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono font-bold text-zinc-100">
                        {proj.hourLabel}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1 rounded ${
                          proj.demandLabel === 'Alta Demanda'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : proj.demandLabel === 'Moderada'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {proj.demandLabel}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono font-bold text-emerald-400">
                      {marketTelemetry.isProductionCleanBaseline
                        ? 'A aguardar leitura'
                        : `${proj.projectedEurPerKm.toFixed(2)}\u00A0€/km • ${proj.projectedOrdersPerHour.toFixed(1)} ped/h`}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-400">
                      ~{proj.expectedOnlineCouriers} estafeta{proj.expectedOnlineCouriers === 1 ? '' : 's'} ({proj.saturationPct}% sat.)
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-zinc-300 leading-snug">
                {marketTelemetry.shiftRecommendationText}
              </p>

              <div className="grid grid-cols-3 gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() =>
                    executeVoiceCommandPt(
                      'Buddy, quantos estafetas tem online agora?'
                    )
                  }
                  className="rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 py-1.5 px-2 text-[10px] font-bold text-zinc-200 cursor-pointer transition truncate"
                >
                  🎙️ Quantos online?
                </button>
                <button
                  type="button"
                  onClick={() =>
                    executeVoiceCommandPt(
                      'Buddy, quanto tá pagando por quilómetro?'
                    )
                  }
                  className="rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 py-1.5 px-2 text-[10px] font-bold text-zinc-200 cursor-pointer transition truncate"
                >
                  🎙️ Quanto paga/km?
                </button>
                <button
                  type="button"
                  onClick={() =>
                    executeVoiceCommandPt('Buddy, qual a projeção para hoje?')
                  }
                  className="rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 py-1.5 px-2 text-[10px] font-bold text-zinc-200 cursor-pointer transition truncate"
                >
                  🎙️ Projeção hoje?
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: FINANÇAS SEGMENTADAS POR PLATAFORMA & GLOBAL CRUZADO
          ===================================================================== */}
      {subTab === 'CAIXA' && (
        <div className="space-y-2.5">
          {/* Platform Switcher in Finanças — Hidden when only 1 single platform is active to maximize screen space */}
          {!isSinglePlatformMode && (
            <div className="border border-zinc-800/80 rounded-xl bg-zinc-900/95 p-2 space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <Wallet className="h-3 w-3 text-zinc-300" />
                  <span>Seletor Financeiro por Plataforma</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-500 font-semibold">
                  {effectiveScope === 'GLOBAL_CRUZADO'
                    ? `Visão Cruzada (${enabledPlatforms.length} Plataformas)`
                    : `Conta Individual: ${effectiveScope}`}
                </span>
              </div>
              <div
                className={`grid gap-1 ${
                  visiblePlatformScopes.length === 3
                    ? 'grid-cols-3'
                    : visiblePlatformScopes.length === 4
                      ? 'grid-cols-4'
                      : 'grid-cols-2'
                }`}
              >
                {visiblePlatformScopes.map((scope) => {
                  const active = effectiveScope === scope.id;
                  return (
                    <button
                      key={scope.id}
                      type="button"
                      onClick={() => setActivePlatformScope(scope.id)}
                      className={`rounded-lg py-1.5 px-2 text-[11px] font-semibold transition cursor-pointer truncate ${
                        active
                          ? 'bg-white text-zinc-950 shadow-xs'
                          : 'bg-zinc-950 text-zinc-400 hover:text-zinc-100 border border-zinc-800/80'
                      }`}
                    >
                      {scope.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {effectiveScope === 'GLOBAL_CRUZADO' && !isSinglePlatformMode ? (
            <>
              {/* GLOBAL CARD 1: Total Combined Net Profit (€ Líquido Global) */}
              <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-zinc-100">
                      1. Lucro Real Combinado (€ Líquido Global)
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      Soma cruzada de {enabledPlatforms.join(' + ')} após frotas,
                      impostos e desgaste
                    </p>
                  </div>
                  <span className="rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-sm font-mono font-bold text-emerald-500 shrink-0 whitespace-nowrap">
                    +{crossRefMetrics.globalNetDayEur.toFixed(2)}{'\u00A0'}€
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2">
                    <span className="text-[10px] text-zinc-400 block">
                      Bruto Global Hoje
                    </span>
                    <span className="text-xs font-mono font-semibold text-zinc-100 whitespace-nowrap">
                      {crossRefMetrics.globalGrossDayEur.toFixed(2)}{'\u00A0'}€
                    </span>
                  </div>
                  <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2">
                    <span className="text-[10px] text-zinc-400 block">
                      Comissões Frota
                    </span>
                    <span className="text-xs font-mono font-semibold text-zinc-300 whitespace-nowrap">
                      -{crossRefMetrics.globalFleetCutEur.toFixed(2)}{'\u00A0'}€
                    </span>
                  </div>
                  <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2">
                    <span className="text-[10px] text-zinc-400 block">
                      Reserva Impostos/SS
                    </span>
                    <span className="text-xs font-mono font-semibold text-zinc-300 whitespace-nowrap">
                      -{crossRefMetrics.globalTaxReserveEur.toFixed(2)}{'\u00A0'}€
                    </span>
                  </div>
                  <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2">
                    <span className="text-[10px] text-zinc-400 block">
                      Custo Veículo ({crossRefMetrics.globalKmToday} km)
                    </span>
                    <span className="text-xs font-mono font-semibold text-zinc-300 whitespace-nowrap">
                      -{crossRefMetrics.globalVehicleCostEur.toFixed(2)}{'\u00A0'}€
                    </span>
                  </div>
                </div>
              </section>

              {/* GLOBAL CARD 2: Cross-Platform Efficiency Comparison Card (ONLY for enabledPlatforms) */}
              <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <h3 className="text-xs font-bold text-zinc-100 truncate">
                      2. Comparativo de Eficiência Cruzada (€/h e €/km)
                    </h3>
                  </div>
                  <span className="rounded bg-zinc-950 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-emerald-500 shrink-0 whitespace-nowrap">
                    Melhor: {crossRefMetrics.bestHourlyPlatform.ledger.platform}{' '}
                    ({crossRefMetrics.bestHourlyPlatform.netPerHourEur.toFixed(2)}{'\u00A0'}€/h)
                  </span>
                </div>

                <div
                  className={`grid gap-2 ${
                    enabledPlatforms.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-3'
                  }`}
                >
                  {enabledPlatforms.map((platform) => {
                    const m = crossRefMetrics.byPlatform[platform];
                    const isBest =
                      crossRefMetrics.bestHourlyPlatform.ledger.platform ===
                      platform;
                    return (
                      <div
                        key={platform}
                        onClick={() => setActivePlatformScope(platform)}
                        className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-3 space-y-1 cursor-pointer hover:border-zinc-700 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-zinc-100 truncate">
                            {platform}
                          </span>
                          {isBest && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </div>
                        <div className="text-sm font-mono font-bold text-emerald-500 whitespace-nowrap">
                          {m.netPerHourEur.toFixed(2)}{'\u00A0'}€/h
                        </div>
                        <div className="text-xs font-mono text-zinc-300 whitespace-nowrap">
                          {m.netPerKmEur.toFixed(2)}{'\u00A0'}€/km líq.
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate whitespace-nowrap">
                          Líq: +{m.netDayEur.toFixed(2)}{'\u00A0'}€ • Frota:{' '}
                          {m.ledger.fleetCommissionPct}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* GLOBAL CARD 3: Global Payout Calendar (ONLY for enabledPlatforms) */}
              <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Calendar className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
                    <h3 className="text-xs font-bold text-zinc-100 truncate">
                      3. Calendário de Repasses ({enabledPlatforms.join(' + ')})
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-zinc-200 shrink-0 whitespace-nowrap">
                    Semana: +{crossRefMetrics.globalNetWeekEur.toFixed(2)}{'\u00A0'}€ líq.
                  </span>
                </div>

                <div className="space-y-1.5">
                  {enabledPlatforms.map((platform) => {
                    const m = crossRefMetrics.byPlatform[platform];
                    return (
                      <div
                        key={platform}
                        className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-zinc-100 block truncate">
                            {platform} • {m.ledger.payoutMethodology}
                          </span>
                          <span className="text-[10px] text-zinc-400 block truncate">
                            {m.ledger.nextPayoutDateLabel}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-emerald-500 block whitespace-nowrap">
                            +{m.netWeekEur.toFixed(2)}{'\u00A0'}€
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 block whitespace-nowrap">
                            Hoje: +{m.netDayEur.toFixed(2)}{'\u00A0'}€
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          ) : (
            /* INDIVIDUAL PLATFORM FINANCIAL LEDGER (Uber Eats, Glovo, or Bolt Food) */
            (() => {
              const selectedPlat: PlatformName =
                effectiveScope === 'GLOBAL_CRUZADO'
                  ? enabledPlatforms[0]
                  : effectiveScope;
              const m = crossRefMetrics.byPlatform[selectedPlat];
              const ledger = m.ledger;
              return (
                <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 gap-2">
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-zinc-100">
                        Perfil &amp; Conta Individual: {selectedPlat}
                      </h3>
                      <p className="text-[10px] text-zinc-400">
                        Taxas, comissão de frota e metodologia de repasse
                        específicas desta app
                      </p>
                    </div>
                    <span className="rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-xs font-mono font-bold text-emerald-500 shrink-0 whitespace-nowrap">
                      Líq. Hoje: +{m.netDayEur.toFixed(2)}{'\u00A0'}€
                    </span>
                  </div>

                  {/* Platform Specific Editable Inputs */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">
                        Ganhos Brutos Hoje (€)
                      </label>
                      <input
                        type="number"
                        step="1.00"
                        value={ledger.dailyGrossEur}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updatePlatformLedger(selectedPlat, {
                            dailyGrossEur: val,
                          });
                          if (selectedPlat === 'Glovo') {
                            updateGlovoWallet({ dailyGrossGlovoEur: val });
                          }
                        }}
                        className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs font-mono text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">
                        Impostos / Taxas (%)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        max={50}
                        value={ledger.specificTaxAndSsPct}
                        onChange={(e) =>
                          updatePlatformLedger(selectedPlat, {
                            specificTaxAndSsPct: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs font-mono text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">
                        Comissão Frota (%)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min={0}
                        max={40}
                        value={ledger.fleetCommissionPct}
                        onChange={(e) =>
                          updatePlatformLedger(selectedPlat, {
                            fleetCommissionPct: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs font-mono text-zinc-100"
                      />
                    </div>
                  </div>

                  {/* Payout Methodology & Schedule */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">
                        Metodologia de Repasse
                      </label>
                      <input
                        type="text"
                        value={ledger.payoutMethodology}
                        onChange={(e) =>
                          updatePlatformLedger(selectedPlat, {
                            payoutMethodology: e.target.value,
                          })
                        }
                        className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">
                        Data / Calendário de Pagamento
                      </label>
                      <input
                        type="text"
                        value={ledger.nextPayoutDateLabel}
                        onChange={(e) =>
                          updatePlatformLedger(selectedPlat, {
                            nextPayoutDateLabel: e.target.value,
                          })
                        }
                        className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
                      />
                    </div>
                  </div>

                  {/* Glovo Specific Nightly Cash Reconciler */}
                  {selectedPlat === 'Glovo' && (
                    <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-zinc-200">
                          Reconciliação de Dinheiro na Mão (Glovo)
                        </span>
                        <button
                          type="button"
                          onClick={closeGlovoDailyAudit}
                          className="rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-0.5 text-[10px] font-medium cursor-pointer"
                        >
                          Fechar Dia Glovo
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-zinc-400 mb-0.5">
                            Saldo Inicial (€)
                          </label>
                          <input
                            type="number"
                            step="0.50"
                            value={glovoWallet.initialAppWalletEur}
                            onChange={(e) =>
                              updateGlovoWallet({
                                initialAppWalletEur:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs font-mono text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-400 mb-0.5">
                            Dinheiro Mão (€)
                          </label>
                          <input
                            type="number"
                            step="0.50"
                            value={glovoWallet.cashReceivedHandsEur}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateGlovoWallet({ cashReceivedHandsEur: val });
                            }}
                            className="w-full rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs font-mono text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-400 mb-0.5">
                            Pago Restaur. (€)
                          </label>
                          <input
                            type="number"
                            step="0.50"
                            value={glovoWallet.cashPaidAtRestaurantsEur}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateGlovoWallet({
                                cashPaidAtRestaurantsEur: val,
                              });
                            }}
                            className="w-full rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs font-mono text-zinc-100"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800">
                        <span className="text-zinc-400">
                          Saldo Digital Noturno Glovo:
                        </span>
                        <span className="font-mono font-bold text-zinc-100">
                          {m.cashDiffEur.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Platform Net Breakdown */}
                  <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">
                        Comissão de Frota ({ledger.fleetCommissionPct}%):
                      </span>
                      <span className="font-mono text-zinc-300">
                        -{m.fleetCutEur.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">
                        Reserva Impostos / SS ({ledger.specificTaxAndSsPct}%):
                      </span>
                      <span className="font-mono text-zinc-300">
                        -{m.taxReserveEur.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">
                        Desgaste &amp; Combustível (
                        {ledger.completedKmToday.toFixed(1)} km):
                      </span>
                      <span className="font-mono text-zinc-300">
                        -{m.vehicleCostEur.toFixed(2)} €
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-100">
                        Lucro Líquido Real ({selectedPlat}):
                      </span>
                      <span className="font-mono text-sm text-emerald-500">
                        +{m.netDayEur.toFixed(2)} € ({m.netPerHourEur.toFixed(2)}{' '}
                        €/h)
                      </span>
                    </div>
                  </div>
                </section>
              );
            })()
          )}
        </div>
      )}

      {/* =====================================================================
          VIEW 3: VANTAGENS (MONOCHROME PARTNER VOUCHERS)
          ===================================================================== */}
      {subTab === 'VANTAGENS' && (
        <div className="space-y-2.5">
          {/* Courier Level Badge Header */}
          <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-100 shrink-0">
                <Award className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-zinc-100 block truncate">
                  {courierTier}
                </span>
                <span className="text-[11px] text-zinc-400 block">
                  Reputação: {communityReputationPct}%
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="rounded-lg bg-zinc-100 text-zinc-950 px-2.5 py-1 text-xs font-mono font-semibold">
                {buddyRewards.buddyCoins} Coins
              </span>
            </div>
          </section>

          {voucherNotice && (
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 flex items-center justify-between gap-2">
              <span className="truncate">{voucherNotice}</span>
              <button
                type="button"
                onClick={() => setVoucherNotice(null)}
                className="text-[10px] text-zinc-400 hover:text-white shrink-0 cursor-pointer"
              >
                OK
              </button>
            </div>
          )}

          {/* Clean Monochrome Partner Vouchers List */}
          <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-2">
            <span className="text-xs font-semibold text-zinc-100 block">
              Vales de Parceiros (Combustível, Oficina &amp; Seguros)
            </span>

            <div className="space-y-1.5">
              {allMarketplaceRewards.slice(0, 5).map((item) => {
                const claimed = buddyRewards.claimedRewardIds.includes(item.id);
                const voucherCode = buddyRewards.claimedVoucherCodes[item.id];
                return (
                  <div
                    key={item.id}
                    className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5 flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-zinc-100 block truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-zinc-400 block truncate">
                        {item.partnerBadge} • {item.costBuddyCoins} Coins
                      </span>
                      {claimed && voucherCode && (
                        <span className="text-[10px] font-mono text-zinc-300 flex items-center gap-1 mt-0.5">
                          <QrCode className="h-3 w-3" />
                          <span>Código: {voucherCode}</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClaimVoucher(item.id)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                        claimed
                          ? 'bg-zinc-800 text-zinc-300'
                          : 'bg-white hover:bg-zinc-200 text-zinc-950'
                      }`}
                    >
                      {claimed ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Ativo</span>
                        </>
                      ) : (
                        <span>Resgatar</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
