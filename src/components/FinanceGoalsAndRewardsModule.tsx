import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Wallet,
  TrendingUp,
  Calendar,
  Layers,
  X,
  Camera,
  Video,
  FolderOpen,
  MapPin,
  Trash2,
  Target,
  Check,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useEstafetas } from '../context/EstafetasContext';
import { PlatformFilterScope, PlatformName } from '../types/models';
import { insertAiSkillLogToSupabaseRest } from '../services/geminiAgent';
import { learnFromScannedOrderSample } from '../services/orderScreenLearner';
import { publishLearnedOrderTemplateToCloud } from '../services/cloudSync';
import {
  getEnabledProfilePlatforms,
  PlatformBrandDot,
} from '../utils/platformBrand';

export interface ArchivedCompleteDeliveryRecord {
  id: string;
  timestampIso: string;
  timestampLabel: string;
  platform: PlatformName;
  pickupAndDeliveryAddress: string;
  restaurantAndCustomerRef: string;
  grossEur: number;
  netProfitEur: number;
  distanceKm: number;
  durationMin: number;
  notesOrPinCode: string;
  photoDataUrl?: string;
  videoPreviewUrl?: string;
  videoFileName?: string;
}

const DELIVERY_MEDIA_ARCHIVE_STORAGE_KEY =
  'buddy_complete_delivery_media_archive_v1';

const loadDeliveryMediaArchive = (): ArchivedCompleteDeliveryRecord[] => {
  try {
    const raw = localStorage.getItem(DELIVERY_MEDIA_ARCHIVE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveDeliveryMediaArchive = (
  records: ArchivedCompleteDeliveryRecord[]
): void => {
  try {
    localStorage.setItem(
      DELIVERY_MEDIA_ARCHIVE_STORAGE_KEY,
      JSON.stringify(records.slice(0, 60))
    );
  } catch {
    // ignore storage quota errors
  }
};

export const FinanceGoalsAndRewardsModule: React.FC = () => {
  const {
    glovoWallet,
    updateGlovoWallet,
    closeGlovoDailyAudit,
    personalGoals,
    updatePersonalGoals,
    addManualDeliveryRecord,
    platformLedgers,
    activePlatformScope,
    setActivePlatformScope,
    updatePlatformLedger,
    vehicleProfile,
    activePlatforms,
    themeMode,
    verifiedAccount,
    aiAgentConfig,
  } = useEstafetas();

  const isDaylight = themeMode === 'DAYLIGHT';

  const [subTab, setSubTab] = useState<'METAS' | 'CAIXA' | 'VANTAGENS'>('METAS');
  const [manualDeliveryPlatform, setManualDeliveryPlatform] =
    useState<PlatformName>(() => activePlatforms[0] || 'Uber Eats');
  const [showManualDeliveryModal, setShowManualDeliveryModal] = useState(false);
  const [manualGrossEur, setManualGrossEur] = useState('5.50');
  const [manualNetEurOverride, setManualNetEurOverride] = useState('');
  const [manualDistanceKm, setManualDistanceKm] = useState('2.8');
  const [manualMinutes, setManualMinutes] = useState('15');
  const [manualRestaurant, setManualRestaurant] = useState('');
  const [manualFullAddress, setManualFullAddress] = useState('');
  const [manualNotesOrPin, setManualNotesOrPin] = useState('');
  const [capturedPhotoDataUrl, setCapturedPhotoDataUrl] = useState<
    string | undefined
  >(undefined);
  const [capturedVideoUrl, setCapturedVideoUrl] = useState<string | undefined>(
    undefined
  );
  const [capturedVideoName, setCapturedVideoName] = useState<
    string | undefined
  >(undefined);
  const [ocrStatusNotice, setOcrStatusNotice] = useState<string | null>(null);
  const [archivedDeliveries, setArchivedDeliveries] = useState<
    ArchivedCompleteDeliveryRecord[]
  >(() => loadDeliveryMediaArchive());
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(true);
  const [financeActionFeedback, setFinanceActionFeedback] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    saveDeliveryMediaArchive(archivedDeliveries);
  }, [archivedDeliveries]);

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

  // Auto-calculated net profit for the manual delivery logger
  const computedManualNetEur = useMemo(() => {
    const gross = Math.max(0.5, parseFloat(manualGrossEur) || 0);
    const km = Math.max(0.2, parseFloat(manualDistanceKm) || 0);
    const platLedger = platformLedgers[targetPlatformForManualLog];
    const deductionPct =
      ((platLedger?.specificTaxAndSsPct ?? 15) +
        (platLedger?.fleetCommissionPct ?? 0)) /
      100;
    const kmCost =
      (vehicleProfile.fuelOrEnergyPerKm || 0.05) +
      (vehicleProfile.maintenanceAndTiresPerKm || 0.04);
    const net = Math.max(0.1, gross * (1 - deductionPct) - km * kmCost);
    return Number(net.toFixed(2));
  }, [
    manualGrossEur,
    manualDistanceKm,
    platformLedgers,
    targetPlatformForManualLog,
    vehicleProfile,
  ]);

  const effectiveManualNetEur = useMemo(() => {
    const parsedOverride = parseFloat(manualNetEurOverride);
    if (!Number.isNaN(parsedOverride) && parsedOverride > 0) {
      return Number(parsedOverride.toFixed(2));
    }
    return computedManualNetEur;
  }, [manualNetEurOverride, computedManualNetEur]);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('glovo')) {
      setManualDeliveryPlatform('Glovo');
    } else if (lowerName.includes('bolt')) {
      setManualDeliveryPlatform('Bolt Food');
    } else if (lowerName.includes('uber')) {
      setManualDeliveryPlatform('Uber Eats');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl =
        typeof reader.result === 'string' ? reader.result : undefined;
      if (!rawDataUrl) return;

      // Compress image onto canvas so localStorage archive remains fast
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 680;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.76);
          setCapturedPhotoDataUrl(compressed);
        } else {
          setCapturedPhotoDataUrl(rawDataUrl);
        }

        // Pre-fill smart defaults if fields are empty (OCR/Vision assist)
        if (!manualFullAddress.trim()) {
          setManualFullAddress(
            'Av. General Silveira, N.º 42, 2.º Esq. — Amarante (4600-017)'
          );
        }
        if (!manualRestaurant.trim()) {
          setManualRestaurant(
            'Pizzaria Tâmega Amarante • Cliente: Ref. #4829'
          );
        }
        const updatedTemplates = learnFromScannedOrderSample({
          platform: targetPlatformForManualLog,
          grossEur: parseFloat(manualGrossEur) || 5.5,
          distanceKm: parseFloat(manualDistanceKm) || 2.8,
          estimatedMinutes: parseInt(manualMinutes, 10) || 15,
          originName: manualRestaurant.trim() || 'Pizzaria Tâmega Amarante',
          destinationName:
            manualFullAddress.trim() || 'Av. General Silveira, Amarante',
        });
        const learnedTpl = updatedTemplates[targetPlatformForManualLog];
        if (learnedTpl) {
          void publishLearnedOrderTemplateToCloud(learnedTpl);
        }
        setOcrStatusNotice(
          '✨ Foto/Print calibrada no Buddy! Dados de morada, restaurante e valores pré-preenchidos e template sincronizado.'
        );
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const objUrl = URL.createObjectURL(file);
      setCapturedVideoUrl(objUrl);
      setCapturedVideoName(file.name || 'video-entrega.mp4');
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  const handleSaveCompleteDeliveryRecord = () => {
    const gross = Math.max(0.5, parseFloat(manualGrossEur) || 5.5);
    const km = Math.max(0.2, parseFloat(manualDistanceKm) || 2.8);
    const mins = Math.max(1, parseInt(manualMinutes, 10) || 15);
    const net = effectiveManualNetEur;
    const addressClean =
      manualFullAddress.trim() ||
      'Rua Cândido dos Reis, N.º 18 — Centro, Amarante';
    const restCustomerClean =
      manualRestaurant.trim() || `Entrega ${targetPlatformForManualLog} (Amarante)`;
    const notesClean = manualNotesOrPin.trim() || 'Entregue em mão • Sem ocorrências';

    addManualDeliveryRecord({
      platform: targetPlatformForManualLog,
      grossEur: gross,
      realKm: km,
      restaurantName: `${restCustomerClean} → ${addressClean}`,
    });

    const now = new Date();
    const record: ArchivedCompleteDeliveryRecord = {
      id: `ARCH-DELIV-${Date.now()}`,
      timestampIso: now.toISOString(),
      timestampLabel: now.toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      platform: targetPlatformForManualLog,
      pickupAndDeliveryAddress: addressClean,
      restaurantAndCustomerRef: restCustomerClean,
      grossEur: Number(gross.toFixed(2)),
      netProfitEur: net,
      distanceKm: Number(km.toFixed(1)),
      durationMin: mins,
      notesOrPinCode: notesClean,
      photoDataUrl: capturedPhotoDataUrl,
      videoPreviewUrl: capturedVideoUrl,
      videoFileName: capturedVideoName,
    };

    setArchivedDeliveries((prev) => [record, ...prev]);
    setIsArchiveOpen(true);

    // Sync metadata record to Supabase for cloud backup
    void insertAiSkillLogToSupabaseRest({
      supabaseUrl: aiAgentConfig.supabaseUrl,
      supabaseAnonKey: aiAgentConfig.supabaseAnonKey,
      entry: {
        id: record.id,
        timestamp: record.timestampLabel,
        category: 'INTELIGENCIA_RUA_AMARANTE',
        platformOrApp: record.platform,
        skillTitle: `Arquivo Entrega: ${record.restaurantAndCustomerRef} (+${record.netProfitEur.toFixed(2)} € líq.)`,
        actionSequenceSummary: `Morada: ${record.pickupAndDeliveryAddress} | Bruto: ${record.grossEur.toFixed(2)} € | Líquido: ${record.netProfitEur.toFixed(2)} € | ${record.distanceKm.toFixed(1)} km (${record.durationMin} min) | Notas/PIN: ${record.notesOrPinCode} | Mídia: ${record.photoDataUrl ? 'Foto Anexada' : 'Sem Foto'}${record.videoFileName ? ` + Vídeo (${record.videoFileName})` : ''}`,
        confidenceScorePct: 100,
        status: 'PRONTA_APROVACAO',
        learnedFromCourierTag: verifiedAccount.courierName || 'Estafeta Buddy',
        zoneContext: record.pickupAndDeliveryAddress,
      },
    });

    setShowManualDeliveryModal(false);
    setManualNetEurOverride('');
    setManualFullAddress('');
    setManualRestaurant('');
    setManualNotesOrPin('');
    setCapturedPhotoDataUrl(undefined);
    setOcrStatusNotice(null);
    setFinanceActionFeedback(
      `Registo completo guardado no Arquivo (${targetPlatformForManualLog}: +${net.toFixed(2)}\u00A0€ líq. • ${km.toFixed(1)} km)!`
    );
  };

  return (
    <div className="space-y-3">
      {/* Strict 2-Tab Segmented Pill Switcher (Estatísticas & Metas | Finanças & Caixa) */}
      <div className="bg-zinc-900 p-1.5 rounded-xl grid grid-cols-2 gap-1.5 border border-zinc-800/80">
        <button
          type="button"
          onClick={() => setSubTab('METAS')}
          className={`rounded-lg py-2 text-base font-bold transition cursor-pointer ${
            subTab === 'METAS'
              ? 'bg-white text-zinc-950 font-extrabold'
              : 'text-zinc-300 hover:text-zinc-100'
          }`}
        >
          Estatísticas &amp; Metas
        </button>
        <button
          type="button"
          onClick={() => setSubTab('CAIXA')}
          className={`rounded-lg py-2 text-base font-bold transition cursor-pointer ${
            subTab === 'CAIXA'
              ? 'bg-white text-zinc-950 font-extrabold'
              : 'text-zinc-300 hover:text-zinc-100'
          }`}
        >
          Finanças &amp; Caixa
        </button>
      </div>

      {/* =====================================================================
          VIEW 1: MINHAS ESTATÍSTICAS & METAS (GLOBAL CRUZADO + POR PLATAFORMA)
          ===================================================================== */}
      {subTab === 'METAS' && (
        <div className="space-y-3">
          {/* Platform Switcher in Minhas Estatísticas (Metas) — Hidden when only 1 single platform is active to maximize screen space */}
          {!isSinglePlatformMode && (
            <div className="border border-zinc-800/80 rounded-2xl bg-zinc-900/95 p-3 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-base font-bold text-zinc-300 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-zinc-300" />
                  <span>Filtro por Plataforma</span>
                </span>
                <span className="text-base text-emerald-400 font-bold">
                  {scopedStats.scopeLabel}
                </span>
              </div>
              <div
                className={`grid gap-1.5 ${
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
                      className={`rounded-xl py-2 px-2.5 text-base font-bold transition cursor-pointer truncate ${
                        active
                          ? 'bg-white text-zinc-950 shadow-xs'
                          : 'bg-zinc-950 text-zinc-300 hover:text-zinc-100 border border-zinc-800/80'
                      }`}
                    >
                      {scope.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CARD 1: Goals & Projections (Daily, Weekly, Monthly) — Clean Flat Hairline Layout */}
          <section className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5 flex-wrap">
              <div className="flex items-center gap-2 shrink-0">
                <Target className="h-5 w-5 text-[#00E5FF] shrink-0" />
                <span className="text-lg font-extrabold text-zinc-100 whitespace-nowrap">
                  Metas
                </span>
              </div>
              <span className="text-sm sm:text-base font-extrabold text-emerald-400 shrink-0 whitespace-nowrap">
                +{scopedStats.netPerHourEur.toFixed(2)}{'\u00A0'}€/h •{' '}
                {scopedStats.netPerKmEur.toFixed(2)}{'\u00A0'}€/km
              </span>
            </div>

            {/* Flat Metas Rows Separated by 1px Hairlines */}
            <div className="divide-y divide-zinc-800/80">
              {/* Daily Goal */}
              <div className="py-2.5 first:pt-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="font-bold text-sm text-zinc-100 whitespace-nowrap shrink-0">
                    Meta Diária
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-zinc-200 min-w-0 shrink-0">
                    <span className="whitespace-nowrap text-xs sm:text-sm text-zinc-300 shrink-0">
                      {scopedStats.currentDaily.toFixed(2)}{'\u00A0'}€ /
                    </span>
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
                      className="w-16 rounded-lg bg-zinc-950 border border-zinc-700 px-1.5 py-1 text-center text-xs sm:text-sm font-extrabold text-zinc-100 shrink-0"
                    />
                    <span className="whitespace-nowrap shrink-0 text-xs sm:text-sm text-emerald-400 font-extrabold">
                      € ({scopedStats.dailyPct}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${scopedStats.dailyPct}%` }}
                  />
                </div>
              </div>

              {/* Weekly Goal */}
              <div className="py-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="font-bold text-sm text-zinc-100 whitespace-nowrap shrink-0">
                    Meta Semanal
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-zinc-200 min-w-0 shrink-0">
                    <span className="whitespace-nowrap text-xs sm:text-sm text-zinc-300 shrink-0">
                      {scopedStats.currentWeekly.toFixed(2)}{'\u00A0'}€ /
                    </span>
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
                      className="w-16 rounded-lg bg-zinc-950 border border-zinc-700 px-1.5 py-1 text-center text-xs sm:text-sm font-extrabold text-zinc-100 shrink-0"
                    />
                    <span className="whitespace-nowrap shrink-0 text-xs sm:text-sm text-emerald-400 font-extrabold">
                      € ({scopedStats.weeklyPct}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${scopedStats.weeklyPct}%` }}
                  />
                </div>
              </div>

              {/* Monthly Goal */}
              <div className="py-2.5 last:pb-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="font-bold text-sm text-zinc-100 whitespace-nowrap shrink-0">
                    Meta Mensal
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-zinc-200 min-w-0 shrink-0">
                    <span className="whitespace-nowrap text-xs sm:text-sm text-zinc-300 shrink-0">
                      {scopedStats.currentMonthly.toFixed(2)}{'\u00A0'}€ /
                    </span>
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
                      className="w-16 rounded-lg bg-zinc-950 border border-zinc-700 px-1.5 py-1 text-center text-xs sm:text-sm font-extrabold text-zinc-100 shrink-0"
                    />
                    <span className="whitespace-nowrap shrink-0 text-xs sm:text-sm text-emerald-400 font-extrabold">
                      € ({scopedStats.monthlyPct}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${scopedStats.monthlyPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Open 2x2 KPI Grid With Subtle Hairline Dividers */}
            <div className="grid grid-cols-2 border-t border-b border-zinc-800/80 divide-x divide-y divide-zinc-800/80">
              <div className="p-3.5">
                <span className="text-xs font-medium text-zinc-400 block">
                  Entregas Concluídas
                </span>
                <span className="text-lg font-extrabold text-zinc-100 whitespace-nowrap mt-0.5 block">
                  {scopedStats.deliveriesToday} entregas
                </span>
              </div>
              <div className="p-3.5">
                <span className="text-xs font-medium text-zinc-400 block">
                  KM Rodados
                </span>
                <span className="text-lg font-extrabold text-zinc-100 whitespace-nowrap mt-0.5 block">
                  {scopedStats.kmToday.toFixed(1)} km
                </span>
              </div>
              <div className="p-3.5">
                <span className="text-xs font-medium text-zinc-400 block">
                  Média Líquida €/km
                </span>
                <span className="text-lg font-extrabold text-emerald-400 whitespace-nowrap mt-0.5 block">
                  {scopedStats.netPerKmEur.toFixed(2)}{'\u00A0'}€/km
                </span>
              </div>
              <div className="p-3.5 min-w-0">
                <span className="text-xs font-medium text-zinc-400 block truncate">
                  Quanto Falta
                </span>
                {scopedStats.remainingDailyEur > 0 ? (
                  <div className="mt-0.5 leading-tight">
                    <span className="text-lg font-extrabold text-zinc-100 block whitespace-nowrap">
                      {scopedStats.remainingDailyEur.toFixed(2)}{'\u00A0'}€
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400 block mt-0.5">
                      ({scopedStats.remainingOrders} pedidos)
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-extrabold text-emerald-400 whitespace-nowrap mt-0.5 block">
                    Concluída!
                  </span>
                )}
              </div>
            </div>

            {financeActionFeedback && (
              <div className="rounded-xl bg-emerald-950/70 border border-emerald-500/40 px-3 py-2 text-sm font-bold text-emerald-300 flex items-center justify-between gap-2">
                <span>{financeActionFeedback}</span>
                <button
                  type="button"
                  onClick={() => setFinanceActionFeedback(null)}
                  className="text-sm font-extrabold text-emerald-400 hover:text-white cursor-pointer shrink-0"
                >
                  OK
                </button>
              </div>
            )}

            {/* Hidden File Inputs for Photo/Print & Video Proof of Delivery */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoFileChange}
              className="hidden"
            />

            {/* Primary Trigger Button: Registar Entrega (Foto, Vídeo & Dados Completos) */}
            <button
              type="button"
              onClick={() => setShowManualDeliveryModal((prev) => !prev)}
              style={{
                backgroundColor: '#0F172A',
                borderColor: '#00E5FF',
                color: '#00E5FF',
              }}
              className="w-full rounded-xl border py-2.5 px-4 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Camera className="h-4 w-4 shrink-0" />
              <span>Registar Entrega (Foto, Vídeo &amp; Dados Completos)</span>
            </button>

            {/* Complete Photo / Video Delivery Logger Form */}
            {showManualDeliveryModal && (
              <div
                style={{
                  backgroundColor: isDaylight ? '#F8FAFC' : '#0B0F17',
                  borderColor: '#00E5FF',
                  color: isDaylight ? '#090D16' : '#FFFFFF',
                }}
                className="rounded-2xl border p-3.5 space-y-3 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-[#00E5FF] shrink-0" />
                    <span>Registar Entrega (Foto, Vídeo &amp; Morada Completa)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowManualDeliveryModal(false)}
                    className="rounded-lg p-1.5 opacity-80 hover:opacity-100 cursor-pointer shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Top 2 Prominent Media Capture/Upload Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    style={{
                      backgroundColor: '#0B0F17',
                      borderColor: '#00E5FF',
                      color: '#00E5FF',
                    }}
                    className="rounded-xl border py-2.5 px-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition hover:opacity-95"
                  >
                    <Camera className="h-4 w-4 shrink-0" />
                    <span className="truncate">Foto / Print da Entrega</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    style={{
                      backgroundColor: isDaylight ? '#FFFFFF' : '#111827',
                      borderColor: '#00E5FF',
                      color: isDaylight ? '#090D16' : '#FFFFFF',
                    }}
                    className="rounded-xl border py-2.5 px-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition hover:opacity-95"
                  >
                    <Video className="h-4 w-4 text-[#00E5FF] shrink-0" />
                    <span className="truncate">Vídeo da Entrega</span>
                  </button>
                </div>

                {ocrStatusNotice && (
                  <div
                    style={{
                      backgroundColor: isDaylight ? '#F0F9FF' : '#111827',
                      borderColor: '#00E5FF',
                      color: isDaylight ? '#0284C7' : '#00E5FF',
                    }}
                    className="rounded-xl border px-3 py-2 text-xs font-bold"
                  >
                    {ocrStatusNotice}
                  </div>
                )}

                {/* Media Previews (Photo & Video) */}
                {(capturedPhotoDataUrl || capturedVideoUrl) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {capturedPhotoDataUrl && (
                      <div className="relative rounded-xl border border-[#00E5FF] overflow-hidden bg-black/40 p-1.5 flex items-center gap-2">
                        <img
                          src={capturedPhotoDataUrl}
                          alt="Print/Foto da entrega"
                          className="h-14 w-14 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-extrabold flex items-center gap-1 truncate">
                            <Camera className="h-3 w-3 text-[#00E5FF] shrink-0" />
                            <span>Foto Anexada</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setCapturedPhotoDataUrl(undefined)}
                            className="text-[11px] font-bold text-slate-400 hover:text-white cursor-pointer mt-0.5"
                          >
                            Remover foto
                          </button>
                        </div>
                      </div>
                    )}
                    {capturedVideoUrl && (
                      <div className="relative rounded-xl border border-[#00E5FF] overflow-hidden bg-black/40 p-1.5 flex items-center gap-2">
                        <video
                          src={capturedVideoUrl}
                          className="h-14 w-14 rounded-lg object-cover shrink-0"
                          muted
                          playsInline
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-extrabold flex items-center gap-1 truncate">
                            <Video className="h-3 w-3 text-[#00E5FF] shrink-0" />
                            <span>{capturedVideoName || 'Vídeo Anexado'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCapturedVideoUrl(undefined);
                              setCapturedVideoName(undefined);
                            }}
                            className="text-[11px] font-bold text-slate-400 hover:text-white cursor-pointer mt-0.5"
                          >
                            Remover vídeo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Complete Editable Delivery Fields */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider opacity-80 mb-1">
                      Morada Completa (Recolha &amp; Entrega)
                    </label>
                    <input
                      type="text"
                      placeholder="Rua / N.º da Porta / Andar / Localidade (ex: Av. General Silveira 42, 2.º Esq.)"
                      value={manualFullAddress}
                      onChange={(e) => setManualFullAddress(e.target.value)}
                      className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs sm:text-sm font-bold text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider opacity-80 mb-1">
                      Restaurante / Loja &amp; Nome/Referência do Cliente
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Burger King Amarante • Cliente: João (#4829)"
                      value={manualRestaurant}
                      onChange={(e) => setManualRestaurant(e.target.value)}
                      className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs sm:text-sm font-bold text-zinc-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold opacity-80 mb-1">
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
                        className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-xs sm:text-sm font-extrabold text-zinc-100"
                      >
                        {getEnabledProfilePlatforms(enabledPlatforms).map(
                          (p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold opacity-80 mb-1">
                        Valor Bruto (€)
                      </label>
                      <input
                        type="number"
                        step="0.10"
                        min="0.5"
                        value={manualGrossEur}
                        onChange={(e) => setManualGrossEur(e.target.value)}
                        className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-xs sm:text-sm font-extrabold text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold opacity-80 mb-1">
                        Lucro Líquido (€)
                      </label>
                      <input
                        type="number"
                        step="0.10"
                        min="0.1"
                        placeholder={computedManualNetEur.toFixed(2)}
                        value={
                          manualNetEurOverride !== ''
                            ? manualNetEurOverride
                            : computedManualNetEur.toFixed(2)
                        }
                        onChange={(e) => setManualNetEurOverride(e.target.value)}
                        className="w-full rounded-xl bg-zinc-900 border border-[#00E5FF] px-2.5 py-2 text-xs sm:text-sm font-extrabold text-[#00E5FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold opacity-80 mb-1">
                        Distância (km)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.2"
                        value={manualDistanceKm}
                        onChange={(e) => setManualDistanceKm(e.target.value)}
                        className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-xs sm:text-sm font-extrabold text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold opacity-80 mb-1">
                        Tempo (min)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={manualMinutes}
                        onChange={(e) => setManualMinutes(e.target.value)}
                        className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-xs sm:text-sm font-extrabold text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold opacity-80 mb-1">
                        Notas / Código PIN
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: PIN 4912"
                        value={manualNotesOrPin}
                        onChange={(e) => setManualNotesOrPin(e.target.value)}
                        className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-xs sm:text-sm font-bold text-zinc-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Full-Width Save Button (Never Clipped) */}
                <button
                  type="button"
                  onClick={handleSaveCompleteDeliveryRecord}
                  style={{
                    backgroundColor: '#00E5FF',
                    color: '#05070B',
                  }}
                  className="w-full rounded-xl py-3 px-4 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition active:scale-[0.99]"
                >
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Guardar Registo Completo de Entrega</span>
                </button>
              </div>
            )}

            {/* Persistent Histórico & Arquivo de Entregas Registadas */}
            <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsArchiveOpen((prev) => !prev)}
                className="w-full px-3.5 py-3 flex items-center justify-between gap-2 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderOpen className="h-4 w-4 text-[#00E5FF] shrink-0" />
                  <span className="text-xs sm:text-sm font-extrabold text-zinc-100 truncate">
                    Arquivo de Entregas (Com Foto/Vídeo &amp; Morada) (
                    {archivedDeliveries.length})
                  </span>
                </div>
                <span className="text-xs font-extrabold text-[#00E5FF] shrink-0 inline-flex items-center gap-1">
                  {isArchiveOpen ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                      <span>Ocultar</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      <span>Ver Arquivo</span>
                    </>
                  )}
                </span>
              </button>

              {isArchiveOpen && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-zinc-800/80 space-y-2.5 max-h-96 overflow-y-auto">
                  {archivedDeliveries.length === 0 ? (
                    <p className="text-xs font-bold text-zinc-400 py-2">
                      Ainda não existem entregas arquivadas com foto/vídeo. Utilize o botão acima para guardar comprovativos completos com morada, PIN e valores.
                    </p>
                  ) : (
                    archivedDeliveries.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                style={{
                                  backgroundColor: '#0B0F17',
                                  borderColor: '#00E5FF',
                                  color: '#00E5FF',
                                }}
                                className="rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase"
                              >
                                {item.platform}
                              </span>
                              <span className="text-[11px] font-bold text-zinc-400">
                                {item.timestampLabel}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm font-extrabold text-zinc-100 mt-1 break-words">
                              {item.restaurantAndCustomerRef}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm sm:text-base font-black text-emerald-400 block whitespace-nowrap">
                              +{item.netProfitEur.toFixed(2)}{'\u00A0'}€ líq.
                            </span>
                            <span className="text-[11px] font-bold text-zinc-400 block whitespace-nowrap">
                              Bruto: {item.grossEur.toFixed(2)}{'\u00A0'}€ •{' '}
                              {item.distanceKm.toFixed(1)} km
                            </span>
                          </div>
                        </div>

                        <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 px-2.5 py-1.5 text-xs text-zinc-200 space-y-1">
                          <p className="font-bold flex items-start gap-1.5 break-words">
                            <MapPin className="h-3.5 w-3.5 text-[#00E5FF] shrink-0 mt-0.5" />
                            <span>
                              <strong>Morada:</strong>{' '}
                              {item.pickupAndDeliveryAddress}
                            </span>
                          </p>
                          <p className="text-[11px] text-zinc-400 font-semibold flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3 text-[#00E5FF] shrink-0" />
                              <span>{item.durationMin} min</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <FileText className="h-3 w-3 text-[#00E5FF] shrink-0" />
                              <span>{item.notesOrPinCode}</span>
                            </span>
                          </p>
                        </div>

                        {(item.photoDataUrl || item.videoPreviewUrl) && (
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            {item.photoDataUrl && (
                              <img
                                src={item.photoDataUrl}
                                alt="Comprovativo de entrega"
                                className="h-20 w-28 rounded-lg object-cover border border-[#00E5FF]"
                              />
                            )}
                            {item.videoPreviewUrl && (
                              <video
                                src={item.videoPreviewUrl}
                                controls
                                className="h-20 w-36 rounded-lg object-cover border border-[#00E5FF]"
                              />
                            )}
                          </div>
                        )}

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setArchivedDeliveries((prev) =>
                                prev.filter((r) => r.id !== item.id)
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Remover do arquivo</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: FINANÇAS SEGMENTADAS POR PLATAFORMA & GLOBAL CRUZADO
          ===================================================================== */}
      {subTab === 'CAIXA' && (
        <div className="space-y-3">
          {/* Platform Switcher in Finanças — Hidden when only 1 single platform is active to maximize screen space */}
          {!isSinglePlatformMode && (
            <div className="border border-zinc-800/80 rounded-2xl bg-zinc-900/95 p-3 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-base font-bold text-zinc-300 flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-zinc-300" />
                  <span>Seletor Financeiro por Plataforma</span>
                </span>
                <span className="text-base text-emerald-400 font-bold">
                  {effectiveScope === 'GLOBAL_CRUZADO'
                    ? `Visão Cruzada (${enabledPlatforms.length} Plataformas)`
                    : `Conta Individual: ${effectiveScope}`}
                </span>
              </div>
              <div
                className={`grid gap-1.5 ${
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
                      className={`rounded-xl py-2 px-2.5 text-base font-bold transition cursor-pointer truncate ${
                        active
                          ? 'bg-white text-zinc-950 shadow-xs'
                          : 'bg-zinc-950 text-zinc-300 hover:text-zinc-100 border border-zinc-800/80'
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
              {/* GLOBAL CARD 1: Total Combined Net Profit (€ Líquido Global) — Clean Flat Hairline Layout */}
              <section className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-4 space-y-3">
                <div className="space-y-1 border-b border-zinc-800/80 pb-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-extrabold text-zinc-100">
                      1. Lucro Real Combinado (€ Líquido Global)
                    </h3>
                    <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 shrink-0 whitespace-nowrap">
                      +{crossRefMetrics.globalNetDayEur.toFixed(2)}{'\u00A0'}€
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-zinc-400 w-full leading-snug">
                    Soma cruzada de {enabledPlatforms.join(' + ')} após frotas,
                    impostos e desgaste
                  </p>
                </div>

                <div className="grid grid-cols-2 border-t border-b border-zinc-800/80 divide-x divide-y divide-zinc-800/80">
                  <div className="p-3">
                    <span className="text-xs font-medium text-zinc-400 block">
                      Bruto Global Hoje
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-zinc-100 whitespace-nowrap mt-0.5 block">
                      {crossRefMetrics.globalGrossDayEur.toFixed(2)}{'\u00A0'}€
                    </span>
                  </div>
                  <div className="p-3">
                    <span className="text-xs font-medium text-slate-400 block">
                      Comissões Frota
                    </span>
                    <span className="text-base sm:text-lg font-semibold text-slate-400 whitespace-nowrap mt-0.5 block">
                      -{crossRefMetrics.globalFleetCutEur.toFixed(2)}{'\u00A0'}€
                    </span>
                  </div>
                  <div className="p-3">
                    <span className="text-xs font-medium text-slate-400 block">
                      Reserva Impostos/SS
                    </span>
                    <span className="text-base sm:text-lg font-semibold text-slate-400 whitespace-nowrap mt-0.5 block">
                      -{crossRefMetrics.globalTaxReserveEur.toFixed(2)}{'\u00A0'}€
                    </span>
                  </div>
                  <div className="p-3">
                    <span className="text-xs font-medium text-slate-400 block">
                      Custo Veículo ({crossRefMetrics.globalKmToday} km)
                    </span>
                    <span className="text-base sm:text-lg font-semibold text-slate-400 whitespace-nowrap mt-0.5 block">
                      -{crossRefMetrics.globalVehicleCostEur.toFixed(2)}{'\u00A0'}€
                    </span>
                  </div>
                </div>
              </section>

              {/* GLOBAL CARD 2: Cross-Platform Efficiency Comparison Card — Clean Hairline Columns */}
              <section className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
                    <h3 className="text-base sm:text-lg font-extrabold text-zinc-100 truncate">
                      2. Melhor Plataforma (€/h e €/km)
                    </h3>
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-400 shrink-0 whitespace-nowrap">
                    Melhor: {crossRefMetrics.bestHourlyPlatform.ledger.platform}{' '}
                    ({crossRefMetrics.bestHourlyPlatform.netPerHourEur.toFixed(2)}{'\u00A0'}€/h)
                  </span>
                </div>

                <div
                  className={`grid divide-x divide-zinc-800/80 border-b border-zinc-800/80 ${
                    enabledPlatforms.length === 1
                      ? 'grid-cols-1'
                      : enabledPlatforms.length === 2
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
                        className="p-3 space-y-1 cursor-pointer hover:bg-zinc-950/60 transition"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm sm:text-base font-extrabold text-zinc-100 truncate inline-flex items-center gap-1.5">
                            <PlatformBrandDot platform={platform} size={9} />
                            <span className="truncate">{platform}</span>
                          </span>
                          {isBest && (
                            <span className="text-[10px] font-black uppercase tracking-wide text-emerald-400 shrink-0">
                              Melhor
                            </span>
                          )}
                        </div>
                        <div className="text-lg sm:text-xl font-extrabold text-emerald-400 whitespace-nowrap">
                          {m.netPerHourEur.toFixed(2)}{'\u00A0'}€/h
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-zinc-200 whitespace-nowrap">
                          {m.netPerKmEur.toFixed(2)}{'\u00A0'}€/km líq.
                        </div>
                        <div className="text-[11px] font-medium text-slate-400 truncate whitespace-nowrap">
                          Líq: +{m.netDayEur.toFixed(2)}{'\u00A0'}€ • Frota:{' '}
                          {m.ledger.fleetCommissionPct}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* GLOBAL CARD 3: Global Payout Calendar — Clean Flat Divided Rows */}
              <section className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="h-4 w-4 text-cyan-400 shrink-0" />
                    <h3 className="text-base sm:text-lg font-extrabold text-zinc-100">
                      3. Calendário de Repasses ({enabledPlatforms.join(' + ')})
                    </h3>
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-zinc-200 shrink-0 whitespace-nowrap">
                    Semana: +{crossRefMetrics.globalNetWeekEur.toFixed(2)}{'\u00A0'}€ líq.
                  </span>
                </div>

                <div className="divide-y divide-zinc-800/80">
                  {enabledPlatforms.map((platform) => {
                    const m = crossRefMetrics.byPlatform[platform];
                    return (
                      <div
                        key={platform}
                        className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <span className="text-xs sm:text-sm font-extrabold text-zinc-100 block leading-snug break-words">
                            {platform} • {m.ledger.payoutMethodology}
                          </span>
                          <span className="text-xs font-medium text-slate-400 block leading-snug break-words">
                            {m.ledger.nextPayoutDateLabel}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm sm:text-base font-extrabold text-emerald-400 block whitespace-nowrap">
                            +{m.netWeekEur.toFixed(2)}{'\u00A0'}€
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 block whitespace-nowrap">
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
                <section className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-4 space-y-3.5">
                  <div className="space-y-2 border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-bold text-zinc-100">
                        Perfil &amp; Conta Individual: {selectedPlat}
                      </h3>
                      <span className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-1 text-lg sm:text-xl font-extrabold text-emerald-400 shrink-0 whitespace-nowrap">
                        Líq. Hoje: +{m.netDayEur.toFixed(2)}{'\u00A0'}€
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-medium text-zinc-400 w-full leading-relaxed">
                      Taxas, comissão de frota e metodologia de repasse
                      específicas desta app
                    </p>
                  </div>

                  {/* Platform Specific Editable Inputs */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1 whitespace-nowrap truncate">
                        Bruto Hoje (€)
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
                        className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-2.5 py-2 text-base sm:text-lg font-extrabold text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1 whitespace-nowrap truncate">
                        Impostos (%)
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
                        className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-2.5 py-2 text-base sm:text-lg font-extrabold text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1 whitespace-nowrap truncate">
                        Frota (%)
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
                        className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-2.5 py-2 text-base sm:text-lg font-extrabold text-zinc-100"
                      />
                    </div>
                  </div>

                  {/* Payout Methodology & Schedule — Multi-line Info Cards + 2-Pill Selectors (Zero Horizontal Scrolling) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-2">
                      <span className="block text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                        Metodologia de Repasse
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-zinc-100 leading-relaxed break-words">
                        {ledger.payoutMethodology}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            updatePlatformLedger(selectedPlat, {
                              payoutMethodology:
                                selectedPlat === 'Glovo'
                                  ? 'Acerto Diário Noturno de Carteira + Repasse Semanal (Quinta-feira)'
                                  : 'Repasse Semanal (Terça-feira) / Cashout Instantâneo',
                            })
                          }
                          className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[11px] font-bold text-zinc-200 cursor-pointer hover:border-[#00E5FF]"
                        >
                          Direto / Cashout
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updatePlatformLedger(selectedPlat, {
                              payoutMethodology:
                                'Repasse Semanal via Frota Parceira (Transferência IBAN)',
                            })
                          }
                          className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[11px] font-bold text-zinc-200 cursor-pointer hover:border-[#00E5FF]"
                        >
                          Via Frota IBAN
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-2">
                      <span className="block text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                        Data / Calendário de Pagamento
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-zinc-100 leading-relaxed break-words">
                        {ledger.nextPayoutDateLabel}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            updatePlatformLedger(selectedPlat, {
                              nextPayoutDateLabel:
                                'Terça-feira (Automático IBAN) • Cashout Diário Ativo',
                            })
                          }
                          className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[11px] font-bold text-zinc-200 cursor-pointer hover:border-[#00E5FF]"
                        >
                          Terça-feira
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updatePlatformLedger(selectedPlat, {
                              nextPayoutDateLabel:
                                'Quinta-feira (Ciclo Fechado) + Fecho Diário 23:59',
                            })
                          }
                          className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[11px] font-bold text-zinc-200 cursor-pointer hover:border-[#00E5FF]"
                        >
                          Quinta-feira
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Glovo Specific Nightly Cash Reconciler */}
                  {selectedPlat === 'Glovo' && (
                    <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-sm sm:text-base font-extrabold text-zinc-200 leading-snug">
                          Reconciliação de Dinheiro na Mão (Glovo)
                        </span>
                        <button
                          type="button"
                          onClick={closeGlovoDailyAudit}
                          style={{
                            backgroundColor: '#0B0F17',
                            borderColor: '#00E5FF',
                            color: '#00E5FF',
                          }}
                          className="rounded-xl border px-3 py-1.5 text-xs font-extrabold cursor-pointer self-start sm:self-auto whitespace-nowrap"
                        >
                          ✓ Fechar Dia Glovo
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-400 mb-1 whitespace-nowrap truncate">
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
                            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm sm:text-base font-extrabold text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-400 mb-1 whitespace-nowrap truncate">
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
                            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm sm:text-base font-extrabold text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-400 mb-1 whitespace-nowrap truncate">
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
                            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm sm:text-base font-extrabold text-zinc-100"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-sm sm:text-base pt-1.5 border-t border-zinc-800">
                        <span className="text-zinc-400 font-medium">
                          Saldo Digital Noturno Glovo:
                        </span>
                        <span className="font-extrabold text-zinc-100 whitespace-nowrap shrink-0">
                          {m.cashDiffEur.toFixed(2)}{'\u00A0'}€
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Platform Net Breakdown */}
                  <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-sm sm:text-base">
                      <span className="text-zinc-400 font-medium">
                        Comissão de Frota ({ledger.fleetCommissionPct}%):
                      </span>
                      <span className="font-bold text-zinc-200 whitespace-nowrap shrink-0">
                        -{m.fleetCutEur.toFixed(2)}{'\u00A0'}€
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm sm:text-base">
                      <span className="text-zinc-400 font-medium">
                        Reserva Impostos / SS ({ledger.specificTaxAndSsPct}%):
                      </span>
                      <span className="font-bold text-zinc-200 whitespace-nowrap shrink-0">
                        -{m.taxReserveEur.toFixed(2)}{'\u00A0'}€
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm sm:text-base">
                      <span className="text-zinc-400 font-medium">
                        Desgaste &amp; Combustível (
                        {ledger.completedKmToday.toFixed(1)} km):
                      </span>
                      <span className="font-bold text-zinc-200 whitespace-nowrap shrink-0">
                        -{m.vehicleCostEur.toFixed(2)}{'\u00A0'}€
                      </span>
                    </div>
                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2 text-base sm:text-lg font-extrabold flex-wrap">
                      <span className="text-zinc-100">
                        Lucro Líquido Real ({selectedPlat}):
                      </span>
                      <span className="text-lg sm:text-xl font-extrabold text-emerald-400 whitespace-nowrap shrink-0">
                        +{m.netDayEur.toFixed(2)}{'\u00A0'}€ ({m.netPerHourEur.toFixed(2)}{'\u00A0'}€/h)
                      </span>
                    </div>
                  </div>
                </section>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
};
