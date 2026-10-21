import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  Mic,
  Volume2,
  CheckCircle2,
  FlaskConical,
  RotateCcw,
  LogOut,
  Shield,
  Sun,
  Moon,
  ArrowLeft,
  Sliders,
  FileCheck2,
  Handshake,
  AlertTriangle,
  Compass,
  Smartphone,
  MapPin,
  UserCheck,
  RefreshCw,
  Camera,
  Trash2,
  Download,
  Search,
  Lock,
  Unlock,
  Printer,
  Wallet,
  Edit3,
  EyeOff,
  PauseCircle,
  Radio,
  MessageSquare,
  Bell,
  Mail,
  Save,
  Target,
  Car,
  CloudRain,
  BatteryCharging,
  FolderOpen,
  Ghost,
  Sparkles,
} from 'lucide-react';
import {
  CONTEXTUAL_HELP_BY_TAB,
  SCANNER_OFFER_PRESETS,
  WELCOME_TOUR_SLIDES,
} from '../data/seedData';
import {
  AmaranteBaseZoneOption,
  CourierRegistrationVehicle,
  PlatformName,
  ScannedOffer,
  ScreenAspectRatioTag,
} from '../types/models';
import {
  COMMON_COURIER_DEVICE_PRESETS,
  getOrCreatePersistentCourierUuid,
} from '../services/geminiAgent';
import { useEstafetas } from '../context/EstafetasContext';
import { FinanceGoalsAndRewardsModule } from './FinanceGoalsAndRewardsModule';
import { AlertVoiceMessagesCustomizationPanel } from './VoiceCopilotAndSupportMacrosModule';
import { EvidentiaryArchiveVaultSection } from './ComplaintsAndRouteTrapsModule';
import {
  DirectApkShareModal,
  MapRadiusSettingsSection,
  OperationalHubSelectorModal,
  RoadHazardsSettingsSection,
  ZoneAgreementsSettingsSection,
} from './ShiftRadarModule';
import {
  BUBBLE_RESTING_PRESET_OPTIONS,
  BuddyMascotImagesSet,
  DEFAULT_BUILTIN_MASCOT_IMAGES,
  isLegacyAndroidWebViewWithoutFileChooser,
  parseMascotClipboardOrJsonText,
  publishMascotImagesToCloudBridge,
  serializeMascotImagesForClipboard,
  sliceThreePoseMascotSheetFile,
  sliceThreePoseMascotSheetFromDataUrl,
} from '../utils/buddyMascotEngine';
import {
  loadSavedAccounts,
  RealTimeSupportPanel,
  saveAccountLocally,
} from './AuthAndVerificationGate';
import {
  getCourierContactAndOptInPreferences,
  isCourierAdminByName,
  publishLearnedOrderTemplateToCloud,
  saveCourierContactAndOptInPreferences,
} from '../services/cloudSync';
import {
  BUDDY_AVATARS,
  getBuddyAvatarForState,
  useBuddySkin,
} from '../utils/buddyAvatars';
import {
  learnFromScannedOrderSample,
  loadLearnedPlatformTemplates,
} from '../services/orderScreenLearner';

const VEHICLE_OPTIONS: CourierRegistrationVehicle[] = [
  'Mota 125cc',
  'Scooter Elétrica',
  'Carro',
  'Bicicleta Elétrica',
];

const AMARANTE_ZONE_OPTIONS: AmaranteBaseZoneOption[] = [
  'Amarante Centro / São Gonçalo',
  'Freixo de Cima / Baixo',
  'Vila Meã',
  'Lixa / Felgueiras',
  'Marco de Canaveses',
];

const ALL_PLATFORM_OPTIONS: PlatformName[] = [
  'Uber Eats',
  'Glovo',
  'Bolt Food',
];

/**
 * 1. ZERO-AI PROFILE PHOTO UPLOADER & AUTO-COMPRESSOR (0 API Cost)
 * Lightweight HTML5 Canvas Circle Cropper & Compressor (120x120px WebP/JPEG)
 * with Zoom/Pan sliders so the courier can center their face from a gallery photo
 * or an Uber/Glovo profile screenshot without spending any AI tokens.
 */
export const ZeroAiProfilePhotoUploader: React.FC<{
  avatarUrl?: string;
  courierName: string;
  onAvatarCompressedChange: (compressedDataUrl: string | undefined) => void;
  compact?: boolean;
}> = ({ avatarUrl, courierName, onAvatarCompressedChange, compact = false }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1.35);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [compressedPreviewUrl, setCompressedPreviewUrl] = useState<
    string | undefined
  >(avatarUrl);
  const [compressedSizeKb, setCompressedSizeKb] = useState<string>('');

  useEffect(() => {
    if (!isCropping) {
      setCompressedPreviewUrl(avatarUrl);
    }
  }, [avatarUrl, isCropping]);

  const initials =
    (courierName || 'CM')
      .trim()
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('')
      .slice(0, 2) || 'CM';

  const renderCropTo120Canvas = useCallback(
    (img: HTMLImageElement, z: number, px: number, py: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 120;
      canvas.width = size;
      canvas.height = size;
      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Background fill
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, size, size);

      // Cover scaling + zoom + pan
      const baseScale = Math.max(size / img.width, size / img.height);
      const scale = baseScale * z;
      const drawW = img.width * scale;
      const drawH = img.height * scale;

      const maxPanX = Math.max(20, (drawW - size) / 2 + 30);
      const maxPanY = Math.max(20, (drawH - size) / 2 + 30);
      const offsetX = (size - drawW) / 2 + (px / 100) * maxPanX;
      const offsetY = (size - drawH) / 2 + (py / 100) * maxPanY;

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      ctx.restore();

      // Subtle circular border ring
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();

      let dataUrl = canvas.toDataURL('image/webp', 0.8);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      }
      const approxBytes = Math.round((dataUrl.length * 3) / 4);
      setCompressedSizeKb(`${(approxBytes / 1024).toFixed(1)} KB`);
      setCompressedPreviewUrl(dataUrl);
      onAvatarCompressedChange(dataUrl);
    },
    [onAvatarCompressedChange]
  );

  useEffect(() => {
    if (isCropping && loadedImageRef.current) {
      renderCropTo120Canvas(loadedImageRef.current, zoom, panX, panY);
    }
  }, [isCropping, zoom, panX, panY, renderCropTo120Canvas]);

  const loadAvatarFromDataUrl = useCallback(
    (dataUrl: string) => {
      if (!dataUrl || !dataUrl.startsWith('data:image/')) return;
      const img = new Image();
      img.onload = () => {
        loadedImageRef.current = img;
        setZoom(1.35);
        setPanX(0);
        setPanY(0);
        setIsCropping(true);
        renderCropTo120Canvas(img, 1.35, 0, 0);
      };
      img.src = dataUrl;
    },
    [renderCropTo120Canvas]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      loadAvatarFromDataUrl(result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePasteAvatar = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                loadAvatarFromDataUrl(reader.result);
              }
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }
    }
    const text = e.clipboardData?.getData('text/plain') || '';
    if (text.trim().startsWith('data:image/')) {
      e.preventDefault();
      loadAvatarFromDataUrl(text.trim());
    }
  };

  return (
    <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 space-y-2.5 overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative h-12 w-12 rounded-full overflow-hidden bg-zinc-900 border-2 border-[#00E5FF] flex items-center justify-center shrink-0 shadow-md">
            {compressedPreviewUrl ? (
              <img
                src={compressedPreviewUrl}
                alt={courierName}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <span className="text-sm font-black text-[#00E5FF]">
                {initials}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-extrabold text-zinc-100 truncate">
              Foto de Perfil
            </span>
            <span className="block text-[10px] text-zinc-400 truncate">
              {compressedPreviewUrl
                ? `Foto pronta ${compressedSizeKb ? `(${compressedSizeKb})` : ''}`
                : 'Aparece no teu ícone no Mapa'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-[#00E5FF]/50 text-white px-3 py-2 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm whitespace-nowrap"
          >
            <Camera className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" />
            <span>📷 Escolher Foto</span>
          </button>

          {compressedPreviewUrl && (
            <button
              type="button"
              onClick={() => {
                setIsCropping(false);
                loadedImageRef.current = null;
                setCompressedPreviewUrl(undefined);
                setCompressedSizeKb('');
                onAvatarCompressedChange(undefined);
              }}
              title="Remover foto"
              className="rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-rose-400 p-2 cursor-pointer transition shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Hidden/Visible 120x120 HTML5 Canvas Circle Cropper & Sliders */}
      <canvas ref={canvasRef} width={120} height={120} className="hidden" />

      {isCropping && (
        <div className="rounded-lg bg-zinc-900/90 border border-emerald-500/30 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold text-emerald-300">
              ✂️ Ajustar Foto no Círculo
            </span>
            <button
              type="button"
              onClick={() => setIsCropping(false)}
              className="rounded bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-extrabold cursor-pointer"
            >
              ✓ Concluir
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-zinc-400 mb-0.5">
                Zoom ({zoom.toFixed(1)}x)
              </label>
              <input
                type="range"
                min={1}
                max={4}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-zinc-400 mb-0.5">
                Horizontal ({panX > 0 ? `+${panX}` : panX})
              </label>
              <input
                type="range"
                min={-100}
                max={100}
                step={2}
                value={panX}
                onChange={(e) => setPanX(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-zinc-400 mb-0.5">
                Vertical ({panY > 0 ? `+${panY}` : panY})
              </label>
              <input
                type="range"
                min={-100}
                max={100}
                step={2}
                value={panY}
                onChange={(e) => setPanY(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
          {!compact && (
            <p className="text-[9px] text-zinc-400">
              Dica: Podes escolher uma foto normal ou um print do teu perfil Uber Eats / Glovo e usar o Zoom para centrar apenas a cara.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 2. ACTIVE PLATFORMS SELECTOR (Uber Eats, Glovo, Bolt Food) & DYNAMIC UI DECLUTTERING
 */
export const ActivePlatformsSelectorGroup: React.FC<{
  selectedPlatforms: PlatformName[];
  onTogglePlatform: (platform: PlatformName) => void;
  titleOverride?: string;
}> = ({ selectedPlatforms, onTogglePlatform, titleOverride }) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-zinc-200">
          {titleOverride || 'Em que aplicações fazes entregas?'}
        </span>
        <span className="text-[10px] font-semibold text-[#00B8D4]">
          {selectedPlatforms.length} selecionada(s)
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ALL_PLATFORM_OPTIONS.map((platform) => {
          const isChecked = selectedPlatforms.includes(platform);
          const isLastRemaining = isChecked && selectedPlatforms.length === 1;
          return (
            <button
              key={platform}
              type="button"
              onClick={() => onTogglePlatform(platform)}
              title={
                isLastRemaining
                  ? 'Mantém pelo menos 1 aplicação selecionada'
                  : `Selecionar ${platform}`
              }
              style={
                isChecked
                  ? {
                      backgroundColor: '#0B0F17',
                      borderColor: '#00E5FF',
                      color: '#00E5FF',
                      boxShadow: '0 2px 10px rgba(0, 229, 255, 0.22)',
                    }
                  : undefined
              }
              className={`rounded-xl py-2.5 px-2 text-xs font-extrabold flex items-center justify-center gap-1.5 border transition cursor-pointer whitespace-nowrap ${
                isChecked
                  ? 'border-[#00E5FF]'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <span>{isChecked ? '✓' : '+'}</span>
              <span>{platform}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const InteractiveManualAndHelpDrawer: React.FC = () => {
  const {
    activeTab,
    isWelcomeTourOpen,
    closeWelcomeTour,
    isContextualHelpOpen,
    setIsContextualHelpOpen,
    openWelcomeTour,
    speakTextPt,
    realCourierProfile,
    isCourierRegistrationModalOpen,
    setIsCourierRegistrationModalOpen,
    saveAndRegisterRealCourierProfile,
    switchOrCreateNewCourierProfileOnDevice,
    cleanupGhostDuplicatePinsNow,
    deviceScreenProfile,
    activePlatforms,
    toggleActivePlatform,
    isOfficialManualModalOpen,
    setIsOfficialManualModalOpen,
  } = useEstafetas();

  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [regName, setRegName] = useState<string>(
    realCourierProfile?.isRegistered ? realCourierProfile.name : ''
  );
  const [regVehicle, setRegVehicle] = useState<CourierRegistrationVehicle>(
    realCourierProfile?.vehicle || 'Mota 125cc'
  );
  const [regZone, setRegZone] = useState<AmaranteBaseZoneOption>(
    realCourierProfile?.zone || 'Amarante Centro / São Gonçalo'
  );
  const [regAvatarUrl, setRegAvatarUrl] = useState<string | undefined>(
    realCourierProfile?.isRegistered ? realCourierProfile.avatar_url : undefined
  );
  const [regPlatforms, setRegPlatforms] =
    useState<PlatformName[]>(activePlatforms);
  const [isSavingReg, setIsSavingReg] = useState<boolean>(false);
  const wasRegistrationModalOpenRef = useRef<boolean>(false);

  // Initialize local draft state ONLY once when isCourierRegistrationModalOpen changes from false -> true
  // Never re-run on background GPS/courier/voice updates so typing in "1. Nome / Apelido no Mapa" never wipes characters
  useEffect(() => {
    if (isCourierRegistrationModalOpen && !wasRegistrationModalOpenRef.current) {
      wasRegistrationModalOpenRef.current = true;
      if (realCourierProfile && realCourierProfile.isRegistered) {
        setRegName(realCourierProfile.name || '');
        setRegVehicle(realCourierProfile.vehicle);
        setRegZone(realCourierProfile.zone);
        setRegAvatarUrl(realCourierProfile.avatar_url);
      } else {
        setRegName('');
        setRegVehicle('Mota 125cc');
        setRegZone('Amarante Centro / São Gonçalo');
        setRegAvatarUrl(undefined);
      }
      setRegPlatforms(
        activePlatforms.length > 0 ? activePlatforms : ['Uber Eats', 'Glovo']
      );
    } else if (!isCourierRegistrationModalOpen) {
      wasRegistrationModalOpenRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCourierRegistrationModalOpen]);

  const handleToggleRegPlatform = (platform: PlatformName) => {
    setRegPlatforms((prev) => {
      const exists = prev.includes(platform);
      if (exists && prev.length <= 1) return prev;
      const next = exists
        ? prev.filter((p) => p !== platform)
        : ALL_PLATFORM_OPTIONS.filter((p) => prev.includes(p) || p === platform);
      return next;
    });
  };

  const handleResetToFreshDeviceProfile = () => {
    setRegName('');
    setRegAvatarUrl(undefined);
    setRegVehicle('Mota 125cc');
    setRegZone('Amarante Centro / São Gonçalo');
    setRegPlatforms(['Uber Eats', 'Glovo']);
    switchOrCreateNewCourierProfileOnDevice();
  };

  const currentSlide =
    WELCOME_TOUR_SLIDES[slideIndex] || WELCOME_TOUR_SLIDES[0];
  const currentHelp =
    CONTEXTUAL_HELP_BY_TAB[activeTab] || CONTEXTUAL_HELP_BY_TAB.scanner;

  const detectedOsBadge = /iPhone|iPad|iPod/i.test(
    deviceScreenProfile.detectedUserAgent || ''
  )
    ? 'iOS'
    : 'Android';

  const handleSaveCourierRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = regName.trim();
    if (!cleanName) return;
    setIsSavingReg(true);
    try {
      await saveAndRegisterRealCourierProfile({
        name: cleanName,
        vehicle: regVehicle,
        zone: regZone,
        avatar_url: regAvatarUrl,
        active_platforms: regPlatforms,
      });
    } finally {
      setIsSavingReg(false);
    }
  };

  return (
    <>
      {isCourierRegistrationModalOpen && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveCourierRegistration}
            className="rounded-2xl bg-zinc-900 border border-emerald-500/40 max-w-[420px] w-full p-5 shadow-2xl space-y-4 text-zinc-100 my-auto"
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-white">
                  Editar Perfil de Estafeta
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Atualiza o teu nome, foto, plataformas e veículo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCourierRegistrationModalOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-950 text-zinc-400 hover:text-zinc-100 cursor-pointer shrink-0"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Como queres ser chamado? + Foto Opcional */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-extrabold text-zinc-200 mb-1.5">
                    Como queres ser chamado?
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Caio"
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm font-bold text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <ZeroAiProfilePhotoUploader
                  avatarUrl={regAvatarUrl}
                  courierName={regName || 'Estafeta'}
                  onAvatarCompressedChange={(dataUrl) => setRegAvatarUrl(dataUrl)}
                  compact
                />
              </div>

              {/* 2. Em que aplicações fazes entregas? */}
              <ActivePlatformsSelectorGroup
                selectedPlatforms={regPlatforms}
                onTogglePlatform={handleToggleRegPlatform}
                titleOverride="Em que aplicações fazes entregas?"
              />

              {/* 3. Qual é o teu veículo principal? */}
              <div>
                <label className="block text-xs font-extrabold text-zinc-200 mb-1.5">
                  Qual é o teu veículo principal?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_OPTIONS.map((v) => {
                    const active = regVehicle === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRegVehicle(v)}
                        className={`rounded-xl py-2.5 px-3 text-xs font-extrabold text-left border transition cursor-pointer ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                            : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                        }`}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingReg || !regName.trim()}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 py-3 px-4 text-sm font-black flex items-center justify-center gap-2 shadow-lg cursor-pointer transition"
            >
              <span>
                {isSavingReg ? 'A guardar...' : 'Guardar Alterações'}
              </span>
            </button>
          </form>
        </div>
      )}
      {isContextualHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 max-w-[390px] w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h2 className="text-sm font-semibold text-zinc-100">
                {currentHelp.pageTitle}
              </h2>
              <button
                type="button"
                onClick={() => setIsContextualHelpOpen(false)}
                className="p-1 rounded-lg bg-zinc-950 text-zinc-400 hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-zinc-300">
              <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-2.5">
                <span className="font-semibold text-zinc-100 block mb-0.5">
                  O que faz:
                </span>
                <p>{currentHelp.whatItDoes}</p>
              </div>
              <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-2.5">
                <span className="font-semibold text-zinc-100 block mb-0.5">
                  Como usar:
                </span>
                <p>{currentHelp.howToUseQuickly}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsContextualHelpOpen(false);
                  setSlideIndex(0);
                  openWelcomeTour();
                }}
                className="rounded-lg py-1.5 px-3 bg-zinc-800 text-zinc-200 text-xs font-medium cursor-pointer"
              >
                Guia 4 Passos
              </button>
              <button
                type="button"
                onClick={() => setIsContextualHelpOpen(false)}
                className="rounded-lg py-1.5 px-4 bg-white text-zinc-950 text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {isWelcomeTourOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 max-w-[400px] w-full p-4 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-zinc-200" />
                <h2 className="text-sm font-semibold text-zinc-100">
                  Guia Rápido ({slideIndex + 1}/4)
                </h2>
              </div>
              <button
                type="button"
                onClick={closeWelcomeTour}
                className="p-1 rounded-lg bg-zinc-950 text-zinc-400 hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {WELCOME_TOUR_SLIDES.map((s, idx) => (
                <button
                  key={s.stepNumber}
                  type="button"
                  onClick={() => setSlideIndex(idx)}
                  className={`rounded-md py-1 text-[11px] transition cursor-pointer ${
                    slideIndex === idx
                      ? 'bg-white text-zinc-950 font-semibold'
                      : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  Passo {s.stepNumber}
                </button>
              ))}
            </div>

            <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                  {currentSlide.badge}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    speakTextPt(
                      `${currentSlide.title}. ${currentSlide.bullets.join(' ')}`
                    )
                  }
                  className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-200 flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="h-3 w-3" />
                  <span>Ouvir</span>
                </button>
              </div>

              <h3 className="text-xs font-semibold text-zinc-100">
                {currentSlide.title}
              </h3>

              <ul className="space-y-1.5">
                {currentSlide.bullets.map((bullet, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-zinc-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded bg-zinc-900 border border-zinc-800 p-2 flex items-center gap-1.5 text-[11px] text-zinc-300">
                <Mic className="h-3 w-3 text-zinc-400 shrink-0" />
                <span>{currentSlide.voiceExample}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                disabled={slideIndex === 0}
                onClick={() => setSlideIndex((prev) => Math.max(0, prev - 1))}
                className="rounded-lg py-1.5 px-3 bg-zinc-800 disabled:opacity-40 text-xs font-medium text-zinc-200 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Anterior</span>
              </button>

              {slideIndex < WELCOME_TOUR_SLIDES.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setSlideIndex((prev) =>
                      Math.min(WELCOME_TOUR_SLIDES.length - 1, prev + 1)
                    )
                  }
                  className="rounded-lg py-1.5 px-4 bg-white text-zinc-950 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Próximo</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closeWelcomeTour}
                  className="rounded-lg py-1.5 px-4 bg-white text-zinc-950 text-xs font-semibold cursor-pointer"
                >
                  Concluir
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Official Interactive Manual & Commands Modal (4 Searchable Tabs + .MD / PDF Export) */}
      {isOfficialManualModalOpen && (
        <OfficialManualAndCommandsModal
          onClose={() => setIsOfficialManualModalOpen(false)}
          onSpeakPt={speakTextPt}
        />
      )}
    </>
  );
};

type OfficialManualTabId =
  | 'MANUAL_ESTAFETA'
  | 'MANUAL_EXECUTIVO'
  | 'DOSSIE_LEGAL_RGPD';

interface ManualSectionItem {
  id: string;
  tab: OfficialManualTabId;
  badge: string;
  title: string;
  summary: string;
  bullets: string[];
}

const OFFICIAL_MANUAL_SECTIONS: ManualSectionItem[] = [
  {
    id: 'estafeta-scanner-bolinha',
    tab: 'MANUAL_ESTAFETA',
    badge: '1. INÍCIO, BOLINHA FLUTUANTE & SCANNER OCR',
    title: 'Scanner de Lucro Real, Bolinha Flutuante 3D e Divisão de Peso',
    summary:
      'Audita em milissegundos se uma oferta da Uber Eats, Glovo ou Bolt Food dá lucro líquido real após combustível, desgaste, impostos e retorno.',
    bullets: [
      'Bolinha Flutuante 3D (Poses Online, Pausa e Entrega a Jato): Sobrepõe-se às apps de entrega sem bloquear o ecrã; lê automaticamente o valor e a distância assim que toca um pedido.',
      'Semáforo instantâneo: ACEITAR, AVALIAR ou RECUSAR segundo a sua meta líquida €/km e €/hora.',
      'Auditoria de Desvio de KM (±45%) e Peso (>10kg / >20kg): Deteta desvios de rota e garrafões pesados, gerando mensagem pronta para exigir Divisão de Pedido com 2.º estafeta no Suporte.',
    ],
  },
  {
    id: 'estafeta-financas-caixa',
    tab: 'MANUAL_ESTAFETA',
    badge: '2. FINANÇAS, METAS & CAIXA',
    title: 'Gestão Financeira Automática, Projeções e Dinheiro na Mão vs Banco',
    summary:
      'Acompanhe a evolução do lucro líquido diário, semanal e mensal ao cêntimo e reconcilie pagamentos em numerário.',
    bullets: [
      'Metas e Projeções Diárias, Semanais e Mensais com cálculo automático de quanto falta e quantos pedidos restam.',
      'Fórmula de Fecho de Caixa: Ganho Bruto Total − Dinheiro Já Recebido na Mão (Cash) − Taxas de App = Valor Exato a Receber por Transferência Bancária.',
      'Registo Rápido em 1 Clique (+ Entrega Manual, + Gorjeta Digital ou + Recebi Dinheiro na Mão) com exportação CSV.',
    ],
  },
  {
    id: 'estafeta-tradutor-libras',
    tab: 'MANUAL_ESTAFETA',
    badge: '3. TRADUTOR SIMULTÂNEO & LIBRAS (MÃOS DO BUDDY)',
    title: 'Tradução Voz/Texto em 8 Idiomas + Linguagem Gestual 3D com Teclado PIN',
    summary:
      'Comunique instantaneamente na porta com clientes estrangeiros ou clientes surdos sem sair da aplicação.',
    bullets: [
      'Tradutor Simultâneo (8 Idiomas: Inglês, Francês, Espanhol, Alemão, Italiano, Ucraniano, Hindi e Mandarim): Microfone duplo Estafeta ↔ Cliente, botão Virar Cartão 180° e 5 frases rápidas de entrega.',
      'Libras — Mãos do Buddy: Duas mãos robóticas 3D do Buddy que executam os sinais de entrega (Olá, Encomenda, Código PIN, Confirmar, Aguardar 1 Minuto, Obrigado) e soletram qualquer palavra ou número (A–Z e 0–9) por texto ou voz.',
      'Área do Cliente Surdo: Botões de resposta rápida ("👍 Obrigado!", "⏳ Só 1 minuto", "🚪 Pode deixar na porta") e teclado numérico de 4 dígitos para o cliente digitar o Código PIN da entrega.',
    ],
  },
  {
    id: 'estafeta-mapa-buddys-sos',
    tab: 'MANUAL_ESTAFETA',
    badge: '4. MAPA, REDE BUDDYS, WALKIE-TALKIE & SOS',
    title: 'Radar Regional, Chat, Walkie-Talkie Mãos-Livres, Queda 45s e Alerta SOS',
    summary:
      'Banco de dados completo da sua região com clima em tempo real, perigos na via, rotas proibidas e proteção ativa no trânsito.',
    bullets: [
      'Mapa Operacional (Raio 35 km): Mostra colegas online em tempo real, zonas quentes, alertas de perigo na via e acordos de piso mínimo.',
      'Comunicação Buddys: Chat da Zona, Walkie-Talkie de voz em tempo real, Blog Informativo e agendamento de pontos de encontro.',
      'Segurança de Rua: Modo Chuva & Luvas (bloqueio contra gotas de água), Deteção Passiva de Impacto/Queda (countdown 45s) e Botão SOS imediato com coordenadas GPS.',
    ],
  },
  {
    id: 'executivo-telemetria-ia',
    tab: 'MANUAL_EXECUTIVO',
    badge: '1. TELEMETRIA REAL & MOTOR IA HÍBRIDO',
    title: 'Gestão Executiva (CEO / Admin), Calibração de Skills e Telemetria 100% Real',
    summary:
      'Consola exclusiva do fundador para monitorizar utilizadores reais autenticados, aprovar skills de ecrã e gerir custos de API.',
    bullets: [
      'Telemetria 100% Real (Zero Dados Fictícios): O Painel de Administrador exibe exclusivamente contas reais autenticadas no dispositivo e na base de dados Supabase.',
      'Aprovação Global de Skills (%X, %Y): Quando um estafeta ensina um botão num modelo de telemóvel (ex.: proporção 20:9), o Admin publica a skill para toda a frota a 0 custo de API.',
      'Alertas Globais para a Frota: Envio instantâneo de comunicados sonoros e visuais para todos os Buddys ativos.',
    ],
  },
  {
    id: 'executivo-b2b-ota-vault',
    tab: 'MANUAL_EXECUTIVO',
    badge: '2. PROJEÇÕES B2B, OTA & COFRE PRIVADO',
    title: 'Simulador de Escala SaaS/B2B, Atualizações OTA e Arquitetura Anti-Cópia',
    summary:
      'Arquitetura de segurança industrial que separa o código-fonte privado do pacote público compilado.',
    bullets: [
      'Projeções Financeiras & Patrocínios B2B: Simulação de receitas recorrentes, parcerias com oficinas, seguradoras e stands locais.',
      'Atualizações Instantâneas OTA (Over-The-Air): O APK nativo Android verifica e aplica automaticamente a versão mais recente publicada sem exigir reinstalação manual.',
      'Blindagem Anti-Engenharia Reversa: Compilação sem sourcemaps (`sourcemap: false`), bloqueio de inspeção e validação de domínio/pacote oficial (`com.pbg.deliverybuddy`).',
    ],
  },
  {
    id: 'dossie-legal-1-rgpd',
    tab: 'DOSSIE_LEGAL_RGPD',
    badge: '1. SEGURANÇA DE DADOS & CONFORMIDADE RGPD',
    title: 'Regulamento (UE) 2016/679 (RGPD) e Lei n.º 58/2019 (Portugal)',
    summary:
      'Garantia absoluta de privacidade, isolamento criptográfico e soberania total do estafeta sobre os seus dados pessoais, localização e contabilidade.',
    bullets: [
      'Encriptação e Armazenamento Isolado: Todas as comunicações utilizam encriptação TLS/SSL de ponta a ponta e armazenamento isolado por perfil autenticado.',
      'Proibição Estrita de Partilha com Plataformas ou Terceiros: Os dados pessoais, coordenadas GPS, histórico de ganhos e métricas financeiras são 100% privados do utilizador e NUNCA são partilhados, vendidos ou transmitidos à Uber Eats, Glovo, Bolt Food, Autoridade Tributária ou quaisquer terceiros.',
      'Direitos do Titular dos Dados (Acesso, Portabilidade e Esquecimento): Em cumprimento dos artigos 15.º a 20.º do RGPD, o estafeta pode exportar toda a sua contabilidade em formato aberto (.CSV / .MD) ou eliminar/repor integralmente os seus dados a 1 toque em Ajustes.',
      'Minimização de Dados e Processamento Local (Zero-AI no Dispositivo): O recorte de foto de perfil e o cálculo financeiro de corridas ocorrem localmente no processador do telemóvel, garantindo máxima privacidade.',
    ],
  },
  {
    id: 'dossie-legal-2-propriedade-intelectual',
    tab: 'DOSSIE_LEGAL_RGPD',
    badge: '2. PROPRIEDADE INTELECTUAL & DIREITOS DE AUTOR',
    title: 'Decreto-Lei n.º 252/94 (Programas de Computador), CDADC e Registo INPI',
    summary:
      'Proteção jurídica integral do código-fonte, arquitetura visual, algoritmos financeiros, voz interativa e mascote 3D Delivery Buddy.',
    bullets: [
      'Titularidade Exclusiva (Decreto-Lei n.º 252/94 e Código do Direito de Autor — CDADC): O código-fonte, estrutura de base de dados, algoritmos de cálculo de lucro líquido por km/hora, interface gráfica (Preto/Branco + Azul Neon #00E5FF), mãos robóticas 3D de Libras e a mascote 3D Delivery Buddy constituem obra original protegida por direitos de autor em Portugal e na União Europeia.',
      'Proteção de Marca e Identidade Visual (INPI / EUIPO): A denominação "Delivery Buddy", o logótipo do robô 3D com mochila propulsora (Jetpack DB) e a assinatura vocal estão reservados ao titular do projeto.',
      'Proibição de Engenharia Reversa e Clonagem: É expressamente proibida a descompilação, extração de assets, cópia parcial ou total da interface ou redistribuição não autorizada do pacote APK, sob pena de responsabilidade civil e criminal.',
    ],
  },
  {
    id: 'dossie-legal-3-trabalho-digno-act',
    tab: 'DOSSIE_LEGAL_RGPD',
    badge: '3. ENQUADRAMENTO LEGAL DO ESTAFETA EM PORTUGAL',
    title: 'Lei n.º 13/2023 (Agenda do Trabalho Digno — Art.º 12.º-A do Código do Trabalho) & ACT',
    summary:
      'Direitos legais dos trabalhadores em plataformas digitais em Portugal, transparência algorítmica, limites de carga e meios de prova.',
    bullets: [
      'Transparência Algorítmica e Direito à Informação (Lei n.º 13/2023): O estafeta tem o direito de conhecer os parâmetros que determinam o valor pago por entrega, a distância real de deslocação e os tempos de espera.',
      'Limites de Segurança, Saúde no Trabalho e Excesso de Peso: O transporte de cargas excessivas (>10 kg / >20 kg em sacos ou garrafões múltiplos) em veículos de duas rodas coloca em risco a integridade física do condutor, assistindo ao estafeta o direito de solicitar divisão de pedido ou recusar condições inseguras.',
      'Valor Probatório do Arquivo de Provas Delivery Buddy: O registo cronológico de discrepâncias de quilometragem (±45%) e tempos de espera abusivos serve como dossiê documental de apoio em reclamações junto do suporte das plataformas ou da Autoridade para as Condições do Trabalho (ACT).',
    ],
  },
  {
    id: 'dossie-legal-4-fisco-at-seguranca-social',
    tab: 'DOSSIE_LEGAL_RGPD',
    badge: '4. OBRIGAÇÕES FISCAIS, AT & SEGURANÇA SOCIAL',
    title: 'Guia Burocrático: Finanças (Recibos Verdes / CIRS), IVA (Art.º 53.º) e Seguros Obrigatórios',
    summary:
      'Resumo prático das obrigações fiscais e contributivas aplicáveis aos estafetas independentes em Portugal.',
    bullets: [
      'Abertura de Atividade na Autoridade Tributária (AT): Enquadramento como Trabalhador Independente (Regime Simplificado de IRS — Categoria B) com CAE/código de atividade adequado a serviços de entregas urbanas e emissão de Faturas-Recibo no Portal das Finanças.',
      'Regime de IVA (Isenção Art.º 53.º CIVA vs. Regime Normal): Estafetas abaixo do limiar legal anual de faturação podem beneficiar de isenção de IVA ao abrigo do Art.º 53.º do CIVA (sem prejuízo das regras específicas de autoliquidação em serviços intracomunitários); acima do limiar ou por opção, aplica-se a entrega trimestral da Declaração Periódica de IVA.',
      'Segurança Social dos Trabalhadores Independentes: Após o período inicial de isenção (primeiros 12 meses de início de atividade), a taxa contributiva geral (21,4%) incide sobre o rendimento relevante (70% do valor total de prestação de serviços do trimestre anterior), declarada trimestralmente em janeiro, abril, julho e outubro.',
      'Seguros Obrigatórios por Lei: 1) Seguro de Acidentes de Trabalho para Trabalhadores Independentes (obrigatório pelo Decreto-Lei n.º 159/99); 2) Seguro de Responsabilidade Civil Automóvel / Motociclo válido para a circulação na via pública.',
    ],
  },
  {
    id: 'dossie-legal-5-termos-independencia',
    tab: 'DOSSIE_LEGAL_RGPD',
    badge: '5. TERMOS DE UTILIZAÇÃO & INDEPENDÊNCIA TECNOLÓGICA',
    title: 'Natureza de Copiloto Pessoal, Acessibilidade Android e Isenção de Interferência',
    summary:
      'Declaração formal de independência tecnológica face às plataformas de entrega.',
    bullets: [
      'Assistente Pessoal e Calculadora Independente: O Delivery Buddy funciona exclusivamente como ferramenta auxiliar de contabilidade, leitura de acessibilidade, tradução linguística/Libras e segurança rodoviária ao serviço do estafeta.',
      'Zero Modificação ou Injeção nas Plataformas: A aplicação não altera, não manipula nem interfere no código, servidores ou APIs privadas da Uber Eats, Glovo ou Bolt Food, utilizando apenas leitura ótica/acessibilidade autorizada pelo próprio utilizador no seu dispositivo Android.',
      'Segurança Rodoviária Prioritária: O utilizador compromete-se a respeitar integralmente o Código da Estrada, utilizando os comandos de voz mãos-livres ("Buddy...") e o suporte físico no guiador durante a condução.',
    ],
  },
];

const VOICE_COMMANDS_REFERENCE_TABLE: Array<{
  phrase: string;
  context: string;
  action: string;
  cost: string;
}> = [
  {
    phrase: '"Buddy aceitar" / "Aceitar corrida"',
    context: 'Início (Scanner)',
    action: 'Aceita a oferta auditada e inicia navegação GPS para recolha',
    cost: '0 Tokens (Local)',
  },
  {
    phrase: '"Buddy recusar" / "Rejeitar oferta"',
    context: 'Início (Scanner)',
    action: 'Recusa a oferta abaixo do piso mínimo e regista estatística',
    cost: '0 Tokens (Local)',
  },
  {
    phrase: '"Buddy traduzir" / "Buddy abrir Libras"',
    context: 'Tradutor & Libras',
    action: 'Abre o Tradutor Simultâneo (8 idiomas) ou o ecrã Libras — Mãos do Buddy',
    cost: '0 Tokens (Local)',
  },
  {
    phrase: '"Buddy dividir pedido" / "Excesso de peso"',
    context: 'Início / Suporte',
    action: 'Abre o fluxo de suporte e copia o texto exigindo 2.º estafeta (>10kg)',
    cost: '0 Tokens (Local)',
  },
  {
    phrase: '"Buddy suporte atraso" / "Restaurante atrasado"',
    context: 'Voz & Suporte',
    action: 'Gera e copia a mensagem formal de tempo de espera no restaurante',
    cost: '0 Tokens (Local)',
  },
  {
    phrase: '"Buddy cliente ausente"',
    context: 'Voz & Suporte',
    action: 'Inicia protocolo de cliente indisponível e prepara prova para suporte',
    cost: '0 Tokens (Local)',
  },
  {
    phrase: '"Buddy ensinar comando"',
    context: 'Qualquer Aba',
    action: 'Abre o calibrador visual %X/%Y para gravar um novo toque no seu modelo de telemóvel',
    cost: '0 Tokens (Skill)',
  },
  {
    phrase: '"Buddy quanto falta para a meta"',
    context: 'Finanças',
    action: 'Lê em voz alta (pt-BR) o lucro líquido atual e quanto falta para a meta diária',
    cost: '0 Tokens (TTS)',
  },
  {
    phrase: '"Buddy registar gorjeta"',
    context: 'Finanças',
    action: 'Abre o registo rápido de gorjeta ou dinheiro recebido na mão',
    cost: '0 Tokens (Local)',
  },
  {
    phrase: '"Buddy abrir mapa" / "Quantos estafetas online"',
    context: 'Mapa (Amarante)',
    action: 'Muda para o Mapa e anuncia quantos estafetas estão online na zona',
    cost: '0 Tokens (Local)',
  },
  {
    phrase: '"Buddy alerta trânsito" / "Perigo na via"',
    context: 'Mapa / Buddys',
    action: 'Publica um alerta comunitário de perigo na via ou operação stop em Amarante',
    cost: '0 Tokens (Local)',
  },
  {
    phrase: '"Buddy SOS" / "Emergência"',
    context: 'Global (Mãos-Livres)',
    action: 'Dispara alerta SOS imediato com coordenadas GPS para os Buddys da zona',
    cost: '0 Tokens (Prioridade)',
  },
];

const COMPLETE_MARKDOWN_MANUAL_EXPORT = `# MANUAL OFICIAL & DOSSIÊ LEGAL, BUROCRÁTICO E RGPD — DELIVERY BUDDY (PORTUGAL / UE)
**Versão de Produção:** 2026.10 • **Idioma:** Português (pt-PT / Voz pt-BR)
**Arquitetura:** Copiloto Financeiro, Auditor de Rotas/Peso, Tradutor Simultâneo & Libras 3D, Rede de Estafetas em Tempo Real e Consola Executiva.

---

## TAB 1 — MANUAL DO ESTAFETA (GUIA COMPLETO DE FUNCIONALIDADES E VOZ)

### 1. Bolinha Flutuante 3D, Scanner OCR e Divisão de Peso (\`Início\`)
- **Bolinha Flutuante 3D (Poses Online, Pausa e Entrega a Jato):** Sobrepõe-se às aplicações Uber Eats, Glovo e Bolt Food; lê automaticamente a oferta e calcula o Lucro Líquido Real descontando combustível, desgaste por km e impostos.
- **Auditoria de Desvio de Rota (±45%) e Peso (>10 kg / >20 kg):** Deteta desvios abusivos de quilometragem e encomendas pesadas, arquivando prova legal e gerando texto pronto para exigir **2.º estafeta (Divisão de Pedido)**.

### 2. Gestão Financeira Automática, Metas e Caixa (\`Finanças\`)
- **Metas Diária, Semanal e Mensal:** Acompanhamento ao cêntimo do lucro por quilómetro (\`€/km\`) e por hora (\`€/h\`).
- **Reconciliação de Dinheiro na Mão (Cash vs Banco):**
  - \`Fórmula:\` **Ganho Bruto Total − Dinheiro Recebido na Mão − Taxas = Valor Líquido a Receber por Transferência Bancária**.

### 3. Tradutor Simultâneo (8 Idiomas) & Libras — Mãos do Buddy (\`🌍 Tradutor & Libras\`)
- **Tradutor Simultâneo Voz/Texto:** Inglês, Francês, Espanhol, Alemão, Italiano, Ucraniano, Hindi e Mandarim com duplo microfone, botão **🔄 Virar Cartão (180°)** e 5 frases rápidas de entrega.
- **🤟 Libras — Mãos do Buddy:** Duas mãos robóticas 3D do Buddy que sinalizam gestos de entrega e soletram palavras/números (\`A–Z\` e \`0–9\`), além de barra de resposta rápida para o cliente surdo e teclado de 4 dígitos para o Código PIN.

### 4. Mapa Regional (Raio 35 km), Rede Buddys, Walkie-Talkie e SOS (\`Mapa\` & \`Buddys\`)
- **Radar Regional:** Clima em tempo real, acordos de piso mínimo, alertas de perigos na via e registo de rotas proibidas.
- **Segurança de Rua:** Modo Chuva & Luvas, Deteção Automática de Queda (45s) e Botão SOS com coordenadas GPS.

---

## TAB 2 — MANUAL EXECUTIVO (CEO / ADMIN)

1. **Telemetria 100% Real (Zero Dados Fictícios):** Contabiliza exclusivamente contas reais autenticadas no dispositivo e no Supabase.
2. **Aprovação Global de Skills IA (%X, %Y):** Publicação de coordenadas por proporção de ecrã (\`20:9\`, \`19.5:9\`, \`16:9\`) para toda a frota a **0 custo de API**.
3. **Alertas de Frota, Projeções B2B, OTA & Cofre Privado:** Emissão de alertas para todos os estafetas, simulador de receitas SaaS/B2B, atualizações Over-The-Air e proteção anti-engenharia reversa (\`sourcemap: false\`).

---

## TAB 3 — DOSSIÊ LEGAL, BUROCRÁTICO & RGPD (PORTUGAL / UNIÃO EUROPEIA)

### 1. Segurança de Dados & Conformidade RGPD (Regulamento UE 2016/679 e Lei n.º 58/2019)
- **Encriptação e Isolamento:** Transmissão encriptada via TLS/SSL e armazenamento isolado por conta.
- **Proibição Estrita de Partilha:** Os dados pessoais, a localização GPS e toda a contabilidade do estafeta são **100% privados** e **nunca são partilhados** com plataformas de entrega (Uber Eats, Glovo, Bolt Food) ou terceiros.
- **Direitos do Utilizador:** Acesso, exportação/portabilidade (\`.CSV\` / \`.MD\`) e eliminação total de dados a 1 toque.

### 2. Propriedade Intelectual & Direitos de Autor (Decreto-Lei n.º 252/94 e CDADC)
- **Titularidade Exclusiva:** Código-fonte, algoritmos financeiros, voz interativa, mãos 3D de Libras e mascote 3D Delivery Buddy protegidos pelo Decreto-Lei n.º 252/94 e pelo Código do Direito de Autor e dos Direitos Conexos (CDADC), com reserva de marca junto do INPI.
- **Proibição de Engenharia Reversa:** Proteção técnica e legal contra descompilação, clonagem ou redistribuição não autorizada.

### 3. Enquadramento Legal do Estafeta em Portugal (Lei n.º 13/2023 — Trabalho Digno & ACT)
- **Direitos em Plataformas Digitais:** Transparência algorítmica sobre tarifas e rotas (Art.º 12.º-A do Código do Trabalho), proteção de segurança e saúde no trabalho (limites de carga/peso) e arquivo probatório para atuação junto da ACT.

### 4. Obrigações Fiscais, AT & Segurança Social (Guia Burocrático)
- **Finanças (AT):** Abertura de atividade como Trabalhador Independente (Recibos Verdes / Regime Simplificado CIRS), isenção de IVA ao abrigo do **Art.º 53.º do CIVA** (quando aplicável) ou regime normal trimestral.
- **Segurança Social & Seguros Obrigatórios:** Enquadramento no regime dos Trabalhadores Independentes (declaração trimestral) e obrigatoriedade legal de **Seguro de Acidentes de Trabalho** (DL n.º 159/99) e **Seguro de Responsabilidade Civil**.

### 5. Termos de Utilização & Independência Tecnológica
- **Independência Total:** O Delivery Buddy opera exclusivamente como assistente pessoal de cálculo, acessibilidade e segurança do utilizador, sem qualquer injeção ou modificação nos sistemas internos das plataformas de entrega.
`;

const OfficialManualAndCommandsModal: React.FC<{
  onClose: () => void;
  onSpeakPt: (text: string) => void;
}> = ({ onClose, onSpeakPt }) => {
  const { themeMode } = useEstafetas();
  const isDaylight = themeMode === 'DAYLIGHT';

  const [activeManualTab, setActiveManualTab] =
    useState<OfficialManualTabId>('MANUAL_ESTAFETA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredSections = OFFICIAL_MANUAL_SECTIONS.filter((sec) => {
    if (!normalizedQuery && sec.tab !== activeManualTab) return false;
    if (!normalizedQuery) return true;
    const haystack =
      `${sec.badge} ${sec.title} ${sec.summary} ${sec.bullets.join(' ')}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const filteredVoiceCommands = VOICE_COMMANDS_REFERENCE_TABLE.filter((cmd) => {
    if (!normalizedQuery) return true;
    const haystack =
      `${cmd.phrase} ${cmd.context} ${cmd.action} ${cmd.cost}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const handleDownloadManualFile = (ext: 'md' | 'txt') => {
    const mime =
      ext === 'md'
        ? 'text/markdown;charset=utf-8;'
        : 'text/plain;charset=utf-8;';
    const filename =
      ext === 'md'
        ? 'MANUAL_E_DOSSIE_LEGAL_DELIVERY_BUDDY.md'
        : 'MANUAL_E_DOSSIE_LEGAL_DELIVERY_BUDDY.txt';
    const blob = new Blob([COMPLETE_MARKDOWN_MANUAL_EXPORT], {
      type: mime,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadFeedback(`${filename} transferido com sucesso!`);
    setTimeout(() => setDownloadFeedback(null), 3500);
  };

  const handlePrintPdfManual = () => {
    window.print();
  };

  const surfaceBg = isDaylight ? '#FFFFFF' : '#05070B';
  const cardBg = isDaylight ? '#F8FAFC' : '#0B0F17';
  const innerBg = isDaylight ? '#FFFFFF' : '#111827';
  const primaryText = isDaylight ? '#090D16' : '#FFFFFF';
  const secondaryText = isDaylight ? '#475569' : '#94A3B8';
  const borderCol = isDaylight ? '#CBD5E1' : 'rgba(0, 229, 255, 0.32)';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Manual e Dossiê Legal Delivery Buddy"
    >
      <div
        style={{
          backgroundColor: surfaceBg,
          borderColor: '#00E5FF',
          color: primaryText,
          height: '92dvh',
        }}
        className="w-full max-w-2xl rounded-2xl border-2 p-3 sm:p-4 shadow-[0_0_35px_rgba(0,229,255,0.22)] flex flex-col gap-2 overflow-hidden"
      >
        {/* 1. Compact Single-Row Top Bar (flex-shrink: 0) */}
        <div
          style={{ borderColor: borderCol }}
          className="flex items-center justify-between gap-2 border-b pb-2 shrink-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 text-[#00E5FF] shrink-0" />
            <h2
              style={{ color: primaryText }}
              className="text-sm sm:text-base font-black truncate"
            >
              📘 Manual &amp; Dossiê Legal
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handlePrintPdfManual}
              style={{
                backgroundColor: cardBg,
                borderColor: borderCol,
                color: primaryText,
              }}
              className="rounded-lg border px-2 py-1 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="Imprimir ou Guardar como PDF"
            >
              <span>📥 PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadManualFile('txt')}
              style={{
                backgroundColor: cardBg,
                borderColor: borderCol,
                color: primaryText,
              }}
              className="rounded-lg border px-2 py-1 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="Transferir Manual e Dossiê em .TXT"
            >
              <span>📥 TXT</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#0B0F17',
                borderColor: '#00E5FF',
                color: '#00E5FF',
              }}
              className="rounded-lg border px-2.5 py-1 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              aria-label="Fechar Manual"
            >
              <span>✕ Fechar</span>
            </button>
          </div>
        </div>

        {downloadFeedback && (
          <div
            style={{
              backgroundColor: '#0B0F17',
              borderColor: '#00E5FF',
              color: '#00E5FF',
            }}
            className="rounded-lg border px-2.5 py-1 text-[11px] font-extrabold shrink-0"
          >
            ✓ {downloadFeedback}
          </div>
        )}

        {/* 2. Compact Horizontal 3-Tab Switcher + Slim Search Input (flex-shrink: 0) */}
        <div className="space-y-1.5 shrink-0">
          <div
            style={{ backgroundColor: cardBg, borderColor: borderCol }}
            className="grid grid-cols-3 gap-1 p-1 rounded-xl border"
          >
            {(
              [
                {
                  id: 'MANUAL_ESTAFETA',
                  label: '📘 Estafeta',
                },
                {
                  id: 'MANUAL_EXECUTIVO',
                  label: '🛡️ Executivo',
                },
                {
                  id: 'DOSSIE_LEGAL_RGPD',
                  label: '⚖️ Dossiê Legal',
                },
              ] as const
            ).map((t) => {
              const active = activeManualTab === t.id && !normalizedQuery;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveManualTab(t.id);
                  }}
                  style={
                    active
                      ? {
                          backgroundColor: '#0B0F17',
                          borderColor: '#00E5FF',
                          color: '#00E5FF',
                        }
                      : {
                          backgroundColor: 'transparent',
                          borderColor: 'transparent',
                          color: secondaryText,
                        }
                  }
                  className="rounded-lg border py-1.5 px-1.5 text-[11px] font-black transition cursor-pointer text-center whitespace-nowrap truncate"
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search
              style={{ color: secondaryText }}
              className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar RGPD, AT, IVA Art. 53, INPI, Libras, comandos..."
              style={{
                backgroundColor: innerBg,
                borderColor: borderCol,
                color: primaryText,
              }}
              className="w-full rounded-xl border pl-8 pr-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[#00E5FF]"
            />
          </div>
        </div>

        {/* 3. Spacious Scrollable Content Body (flex: 1, overflow-y: auto, min-height: 68dvh) */}
        <div className="flex-1 min-h-[68dvh] overflow-y-auto space-y-2.5 pr-1">
          {filteredSections.map((sec) => (
            <div
              key={sec.id}
              style={{
                backgroundColor: cardBg,
                borderColor: borderCol,
              }}
              className="rounded-xl border p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  style={{
                    backgroundColor: '#0B0F17',
                    borderColor: '#00E5FF',
                    color: '#00E5FF',
                  }}
                  className="rounded-md border px-2 py-0.5 text-[10px] font-extrabold"
                >
                  {sec.badge}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onSpeakPt(
                      `${sec.title}. ${sec.summary} ${sec.bullets.join(' ')}`
                    )
                  }
                  style={{
                    backgroundColor: innerBg,
                    borderColor: borderCol,
                    color: primaryText,
                  }}
                  className="rounded-lg border px-2.5 py-1 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Volume2 className="h-3 w-3 text-[#00E5FF]" />
                  <span>Ouvir</span>
                </button>
              </div>
              <h3
                style={{ color: primaryText }}
                className="text-xs sm:text-sm font-black leading-snug"
              >
                {sec.title}
              </h3>
              <p
                style={{ color: secondaryText }}
                className="text-xs leading-relaxed font-semibold"
              >
                {sec.summary}
              </p>
              <ul className="space-y-1.5 pt-1">
                {sec.bullets.map((b, idx) => (
                  <li
                    key={idx}
                    style={{ color: primaryText }}
                    className="text-xs flex items-start gap-1.5 leading-relaxed"
                  >
                    <span className="text-[#00E5FF] font-black">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {(activeManualTab === 'MANUAL_ESTAFETA' || normalizedQuery) && (
            <div
              style={{
                backgroundColor: cardBg,
                borderColor: borderCol,
              }}
              className="rounded-xl border p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  style={{ color: primaryText }}
                  className="text-xs font-black flex items-center gap-1.5"
                >
                  <Volume2 className="h-3.5 w-3.5 text-[#00E5FF]" />
                  <span>
                    Tabela de Comandos de Voz Mãos-Livres (pt-BR)
                  </span>
                </span>
                <span
                  style={{
                    backgroundColor: '#0B0F17',
                    borderColor: '#00E5FF',
                    color: '#00E5FF',
                  }}
                  className="rounded border px-2 py-0.5 text-[10px] font-extrabold shrink-0"
                >
                  {filteredVoiceCommands.length} Comandos
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr
                      style={{ borderColor: borderCol, color: secondaryText }}
                      className="border-b"
                    >
                      <th className="py-1.5 pr-2 font-extrabold">
                        Frase (&ldquo;Buddy...&rdquo;)
                      </th>
                      <th className="py-1.5 px-2 font-extrabold">Módulo</th>
                      <th className="py-1.5 px-2 font-extrabold">
                        Ação Executada
                      </th>
                      <th className="py-1.5 pl-2 font-extrabold text-right">
                        Custo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-500/20">
                    {filteredVoiceCommands.map((cmd) => (
                      <tr key={cmd.phrase}>
                        <td
                          style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                          className="py-2 pr-2 font-black"
                        >
                          {cmd.phrase}
                        </td>
                        <td
                          style={{ color: primaryText }}
                          className="py-2 px-2 font-bold whitespace-nowrap"
                        >
                          {cmd.context}
                        </td>
                        <td
                          style={{ color: secondaryText }}
                          className="py-2 px-2 font-semibold"
                        >
                          {cmd.action}
                        </td>
                        <td className="py-2 pl-2 text-right whitespace-nowrap">
                          <span
                            style={{
                              backgroundColor: '#0B0F17',
                              borderColor: '#00E5FF',
                              color: '#00E5FF',
                            }}
                            className="rounded border px-1.5 py-0.5 text-[10px] font-bold"
                          >
                            {cmd.cost}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type AjustesSubPageId =
  | 'LISTA_PRINCIPAL'
  | 'PERSONALIZAR_ALERTAS_VOZ'
  | 'ARQUIVO_PROVAS'
  | 'ACORDOS_ZONA'
  | 'PERIGOS_VIA'
  | 'RAIO_MAPA';

export const MenuMaisHubView: React.FC = () => {
  const [buddySkin, setBuddySkinPref] = useBuddySkin();
  const {
    activeTab,
    setActiveTab,
    openWelcomeTour,
    isAppPaused,
    toggleAppPauseMode,
    userPrefs,
    toggleAnonymousMode,
    ttsVoiceEnabled,
    toggleTtsVoice,
    logoutSession,
    resetAllToSeed,
    activeScannedOffer,
    setActiveScannedOffer,
    selectOfferPreset,
    setAuditedOrderItemsPreset,
    totalAuditedWeightKg,
    simulateSpeedAlert,
    simulatePhoneMisuseInMotion,
    clearSafetyAlerts,
    themeMode,
    toggleThemeMode,
    setViewMode,
    alertPopupPrefs,
    voiceActivationConfig,
    mapRadiusKm,
    selectedRegionName,
    evidentiaryVaultRecords,
    zonePacts,
    roadHazards,
    deviceScreenProfile,
    updateDeviceScreenProfile,
    redetectDeviceScreenProfile,
    startVoiceTeachSkillMode,
    realCourierProfile,
    setIsCourierRegistrationModalOpen,
    switchOrCreateNewCourierProfileOnDevice,
    refreshLiveGpsPosition,
    activePlatforms,
    toggleActivePlatform,
    updateCourierAvatarUrl,
    wakeLockEnabled,
    wakeLockActiveOnDevice,
    toggleWakeLock,
    setIsOfficialManualModalOpen,
    buddyVoiceRate,
    setBuddyVoiceRate,
    resolvedPtBrVoiceName,
    speakTextPt,
    isAppInstalledStandalone,
    canPromptNativeInstall,
    triggerNativeAppInstallPrompt,
    showManualInstallGuideModal,
    setShowManualInstallGuideModal,
    rainLockActive,
    toggleRainLock,
    crashDetectionEnabled,
    toggleCrashDetection,
    crashSensitivityLevel,
    setCrashSensitivityLevel,
    triggerSimulatedCrashTest,
    batterySurvivalMode,
    toggleBatterySurvivalMode,
    batteryLevelPct,
    isBatteryCharging,
    userBatteryAlertThreshold,
    setUserBatteryAlertThreshold,
    simulateChargerUnpluggedAlert,
    cycleDevicePtVoice,
    setIsBubbleMinimized,
    isListeningSpeechRecognition,
    requestOrConfirmSosActivation,
    buddyMascotImages,
    currentMascotState,
    uploadThreePoseMascotSheet,
    uploadThreePoseMascotSheetFromDataUrl,
    applyCustomMascotImagesSet,
    mascotSyncId,
    resetMascotImagesToBuiltin,
    bubbleRestingPreset,
    setBubbleRestingPreset,
    aiAgentConfig,
    autoOfferDetectorEnabled,
    toggleAutoOfferDetectorEnabled,
    isAccessibilityDiagnosticOpen,
    setIsAccessibilityDiagnosticOpen,
    triggerAutoDetectedOffer,
  } = useEstafetas();

  const [learnedTemplatesState, setLearnedTemplatesState] = useState(() =>
    loadLearnedPlatformTemplates()
  );
  const [calibPlatform, setCalibPlatform] = useState<PlatformName>('Glovo');
  const [calibAcceptYRatio, setCalibAcceptYRatio] = useState<number>(0.88);
  const [calibRejectYRatio, setCalibRejectYRatio] = useState<number>(0.14);
  const [calibStatusMsg, setCalibStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const refreshTemplates = () => {
      const latest = loadLearnedPlatformTemplates();
      setLearnedTemplatesState(latest);
      if (latest[calibPlatform]?.acceptButtonBounds) {
        setCalibAcceptYRatio(latest[calibPlatform].acceptButtonBounds.yRatio);
      }
      if (latest[calibPlatform]?.rejectButtonBounds) {
        setCalibRejectYRatio(latest[calibPlatform].rejectButtonBounds.yRatio);
      }
    };
    refreshTemplates();
    window.addEventListener('buddy-order-template-updated', refreshTemplates);
    return () =>
      window.removeEventListener(
        'buddy-order-template-updated',
        refreshTemplates
      );
  }, [calibPlatform, isAccessibilityDiagnosticOpen]);

  const mascotFileInputRef = useRef<HTMLInputElement | null>(null);
  const chromeBridgeAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const [mascotUploadStatus, setMascotUploadStatus] = useState<string>('');

  const chromeBridgeHttpsUrl = `https://iokmoreira.github.io/Delivery-buddy/?upload_mascot=1&sync_id=${encodeURIComponent(
    mascotSyncId
  )}${
    aiAgentConfig?.supabaseUrl
      ? `&sb_url=${encodeURIComponent(aiAgentConfig.supabaseUrl)}`
      : ''
  }${
    aiAgentConfig?.supabaseAnonKey
      ? `&sb_key=${encodeURIComponent(aiAgentConfig.supabaseAnonKey)}`
      : ''
  }`;

  const chromeDirectSchemeUrl = `googlechrome://navigate?url=${chromeBridgeHttpsUrl}`;

  useEffect(() => {
    const onCloudSynced = () => {
      setMascotUploadStatus(
        '✓ 3 Poses sincronizadas via Chrome e aplicadas na App, Mapa e Bolinha!'
      );
    };
    window.addEventListener('buddy-mascot-cloud-synced', onCloudSynced);
    return () =>
      window.removeEventListener('buddy-mascot-cloud-synced', onCloudSynced);
  }, []);

  const handleOpenExternalChromeBridge = useCallback(() => {
    setMascotUploadStatus(
      '🌐 A abrir Galeria no Chrome... Escolha a imagem das 3 poses lá e ela sincroniza automaticamente aqui!'
    );
    const winAny = window as unknown as {
      BuddyNativeOverlay?: {
        openExternalBrowser?: (url: string) => void;
      };
    };
    if (typeof winAny.BuddyNativeOverlay?.openExternalBrowser === 'function') {
      winAny.BuddyNativeOverlay.openExternalBrowser(chromeBridgeHttpsUrl);
      return;
    }
    try {
      // Trigger googlechrome:// scheme to launch Android Chrome directly from WebView
      const a = document.createElement('a');
      a.href = chromeDirectSchemeUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // ignore
    }
  }, [chromeBridgeHttpsUrl, chromeDirectSchemeUrl]);

  const handleMascotPasteEvent = async (
    e: React.ClipboardEvent<HTMLDivElement>
  ) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            try {
              setMascotUploadStatus('A recortar as 3 poses da imagem colada...');
              await uploadThreePoseMascotSheet(file);
              setMascotUploadStatus(
                '✓ 3 Poses coladas e aplicadas na App, Mapa e Bolinha!'
              );
            } catch {
              setMascotUploadStatus('Erro ao recortar a imagem colada.');
            }
            return;
          }
        }
      }
    }

    const htmlData = e.clipboardData?.getData('text/html') || '';
    const srcMatch = htmlData.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      e.preventDefault();
      try {
        setMascotUploadStatus('A recortar as 3 poses da imagem colada...');
        await uploadThreePoseMascotSheetFromDataUrl(srcMatch[1]);
        setMascotUploadStatus(
          '✓ 3 Poses coladas e aplicadas na App, Mapa e Bolinha!'
        );
        return;
      } catch {
        // continue to text check
      }
    }

    const textData = (e.clipboardData?.getData('text/plain') || '').trim();
    if (textData) {
      const preSliced = parseMascotClipboardOrJsonText(textData);
      if (preSliced) {
        e.preventDefault();
        applyCustomMascotImagesSet(preSliced);
        setMascotUploadStatus(
          '✓ 3 Poses coladas e aplicadas na App, Mapa e Bolinha!'
        );
        return;
      }
      if (textData.startsWith('data:image/')) {
        e.preventDefault();
        try {
          setMascotUploadStatus('A recortar as 3 poses da imagem colada...');
          await uploadThreePoseMascotSheetFromDataUrl(textData);
          setMascotUploadStatus(
            '✓ 3 Poses coladas e aplicadas na App, Mapa e Bolinha!'
          );
        } catch {
          setMascotUploadStatus('Erro ao processar a imagem colada.');
        }
      }
    }
  };

  const handleReadClipboardButton = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.read === 'function') {
        const clipItems = await navigator.clipboard.read();
        for (const clipItem of clipItems) {
          const imgType = clipItem.types.find((t) => t.startsWith('image/'));
          if (imgType) {
            const blob = await clipItem.getType(imgType);
            setMascotUploadStatus(
              'A recortar as 3 poses da área de transferência...'
            );
            await uploadThreePoseMascotSheet(blob);
            setMascotUploadStatus(
              '✓ 3 Poses lidas da área de transferência e aplicadas!'
            );
            return;
          }
        }
      }
    } catch {
      // fallback to readText
    }
    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.readText === 'function'
      ) {
        const text = (await navigator.clipboard.readText()).trim();
        const preSliced = parseMascotClipboardOrJsonText(text);
        if (preSliced) {
          applyCustomMascotImagesSet(preSliced);
          setMascotUploadStatus(
            '✓ 3 Poses sincronizadas da área de transferência!'
          );
          return;
        }
        if (text.startsWith('data:image/')) {
          await uploadThreePoseMascotSheetFromDataUrl(text);
          setMascotUploadStatus(
            '✓ 3 Poses recortadas da área de transferência!'
          );
          return;
        }
      }
    } catch {
      // ignore
    }
    setMascotUploadStatus(
      'Toque e segure na caixa tracejada abaixo e escolha "Colar" (ou use o botão Abrir Galeria via Chrome).'
    );
  };

  const [subPage, setSubPage] = useState<AjustesSubPageId>('LISTA_PRINCIPAL');
  const [openAccordion, setOpenAccordion] = useState<
    'PERFIL' | 'VOZ_BOLINHA' | 'CENTRO_FINANCAS' | 'SEGURANCA_SISTEMA' | null
  >(null);
  const [isLiveSupportModalOpen, setIsLiveSupportModalOpen] =
    useState<boolean>(false);
  const [isDirectApkShareModalOpen, setIsDirectApkShareModalOpen] =
    useState<boolean>(false);
  const [isHubSelectorModalOpen, setIsHubSelectorModalOpen] =
    useState<boolean>(false);
  const [isShiftDrawerOpen, setIsShiftDrawerOpen] = useState<boolean>(false);

  // Intercept Smart Back ("↩ Voltar") when any local modal or sub-page inside Perfil is open
  useEffect(() => {
    const handleSmartBack = (ev: Event) => {
      if (isLiveSupportModalOpen) {
        setIsLiveSupportModalOpen(false);
        ev.preventDefault();
        return;
      }
      if (isDirectApkShareModalOpen) {
        setIsDirectApkShareModalOpen(false);
        ev.preventDefault();
        return;
      }
      if (isHubSelectorModalOpen) {
        setIsHubSelectorModalOpen(false);
        ev.preventDefault();
        return;
      }
      if (isShiftDrawerOpen) {
        setIsShiftDrawerOpen(false);
        ev.preventDefault();
        return;
      }
      if (subPage !== 'LISTA_PRINCIPAL') {
        setSubPage('LISTA_PRINCIPAL');
        ev.preventDefault();
        return;
      }
      if (openAccordion !== null) {
        setOpenAccordion(null);
        ev.preventDefault();
      }
    };
    window.addEventListener('buddy-smart-back', handleSmartBack);
    return () =>
      window.removeEventListener('buddy-smart-back', handleSmartBack);
  }, [
    isLiveSupportModalOpen,
    isDirectApkShareModalOpen,
    isHubSelectorModalOpen,
    isShiftDrawerOpen,
    subPage,
    openAccordion,
  ]);

  const toggleAccordionCard = (
    cardId: 'PERFIL' | 'VOZ_BOLINHA' | 'CENTRO_FINANCAS' | 'SEGURANCA_SISTEMA'
  ) => {
    setOpenAccordion((prev) => (prev === cardId ? null : cardId));
  };

  const shiftBadge = isAppPaused
    ? 'Em Pausa'
    : userPrefs.anonymousMode
      ? 'Anónimo'
      : 'Online';

  const currentUserName =
    realCourierProfile?.name?.trim() || 'Estafeta';

  const initialContactPrefs =
    getCourierContactAndOptInPreferences(currentUserName);
  const [courierWhatsappInput, setCourierWhatsappInput] = useState<string>(
    initialContactPrefs.whatsapp || '+351'
  );
  const [courierEmailInput, setCourierEmailInput] = useState<string>(
    initialContactPrefs.email || ''
  );
  const [courierOptInWhatsapp, setCourierOptInWhatsapp] = useState<boolean>(
    initialContactPrefs.optInWhatsapp
  );
  const [courierOptInEmail, setCourierOptInEmail] = useState<boolean>(
    initialContactPrefs.optInEmail
  );
  const [contactSavedFeedback, setContactSavedFeedback] = useState<
    string | null
  >(null);

  useEffect(() => {
    const prefs = getCourierContactAndOptInPreferences(currentUserName);
    setCourierWhatsappInput(prefs.whatsapp || '+351');
    setCourierEmailInput(prefs.email || '');
    setCourierOptInWhatsapp(prefs.optInWhatsapp);
    setCourierOptInEmail(prefs.optInEmail);
  }, [currentUserName]);

  const handleSaveCourierContactOptIn = async (
    nextWa = courierWhatsappInput,
    nextEmail = courierEmailInput,
    nextOptWa = courierOptInWhatsapp,
    nextOptEmail = courierOptInEmail
  ) => {
    await saveCourierContactAndOptInPreferences({
      courierId: realCourierProfile?.id || `courier_${currentUserName}`,
      courierName: currentUserName,
      whatsapp: nextWa,
      email: nextEmail,
      optInWhatsapp: nextOptWa,
      optInEmail: nextOptEmail,
    });
    setContactSavedFeedback('✓ Preferências WhatsApp & E-mail guardadas!');
    setTimeout(() => setContactSavedFeedback(null), 3000);
  };

  // 100% Full-Screen Sub-Page View (No Stuck Top Card)
  if (subPage !== 'LISTA_PRINCIPAL') {
    const subPageTitleMap: Record<
      Exclude<AjustesSubPageId, 'LISTA_PRINCIPAL'>,
      string
    > = {
      PERSONALIZAR_ALERTAS_VOZ: 'Personalizar Alertas, Voz & Mensagens',
      ARQUIVO_PROVAS: 'Arquivo de Provas (Dossiê Legal)',
      ACORDOS_ZONA: 'Acordos de Zona (Piso Mínimo)',
      PERIGOS_VIA: 'Perigos na Via (Amarante 35 km)',
      RAIO_MAPA: 'Centro Operacional & Raio 35 km',
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setSubPage('LISTA_PRINCIPAL')}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar a Perfil</span>
          </button>
          <span className="text-xs font-extrabold text-zinc-200 text-right leading-snug">
            {subPageTitleMap[subPage]}
          </span>
        </div>

        {subPage === 'PERSONALIZAR_ALERTAS_VOZ' && (
          <AlertVoiceMessagesCustomizationPanel />
        )}
        {subPage === 'ARQUIVO_PROVAS' && <EvidentiaryArchiveVaultSection />}
        {subPage === 'ACORDOS_ZONA' && <ZoneAgreementsSettingsSection />}
        {subPage === 'PERIGOS_VIA' && <RoadHazardsSettingsSection />}
        {subPage === 'RAIO_MAPA' && <MapRadiusSettingsSection />}
      </div>
    );
  }

  const isFinancasSubTab = activeTab === 'financas';

  const currentShiftMode: 'ONLINE' | 'AUSENTE' | 'NINJA' = userPrefs.anonymousMode
    ? 'NINJA'
    : isAppPaused
      ? 'AUSENTE'
      : 'ONLINE';

  const isPresidenteProfile = isCourierAdminByName(currentUserName);
  const perfilStatusAvatarUrl = getBuddyAvatarForState(currentShiftMode, buddySkin);

  const handleSelectShiftMode = (mode: 'ONLINE' | 'AUSENTE' | 'NINJA') => {
    if (mode === 'ONLINE') {
      if (isAppPaused) toggleAppPauseMode();
      if (userPrefs.anonymousMode) toggleAnonymousMode();
    } else if (mode === 'AUSENTE') {
      if (userPrefs.anonymousMode) toggleAnonymousMode();
      if (!isAppPaused) toggleAppPauseMode();
    } else if (mode === 'NINJA') {
      if (isAppPaused) toggleAppPauseMode();
      if (!userPrefs.anonymousMode) toggleAnonymousMode();
    }
  };

  return (
    <div className="space-y-3">
      {/* TOP SEGMENTED SWITCHER INSIDE PERFIL: Tab A (Meu Perfil & Ajustes) | Tab B (Finanças & Metas) */}
      <div
        style={{
          backgroundColor: themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#0B0F17',
          borderColor:
            themeMode === 'DAYLIGHT' ? '#CBD5E1' : 'rgba(0, 229, 255, 0.35)',
        }}
        className="rounded-2xl border p-1.5 grid grid-cols-2 gap-1.5 shadow-sm"
      >
        <button
          type="button"
          onClick={() => setActiveTab('menu_mais')}
          style={{
            backgroundColor: !isFinancasSubTab
              ? '#00E5FF'
              : themeMode === 'DAYLIGHT'
                ? '#F8FAFC'
                : '#111827',
            borderColor: !isFinancasSubTab ? '#00E5FF' : 'transparent',
            color: !isFinancasSubTab
              ? '#090D16'
              : themeMode === 'DAYLIGHT'
                ? '#334155'
                : '#CBD5E1',
          }}
          className="rounded-xl border py-2.5 px-2 text-xs sm:text-sm font-black tracking-tight flex items-center justify-center gap-1.5 cursor-pointer transition whitespace-nowrap"
        >
          <UserCheck className="h-4 w-4 shrink-0" />
          <span>Meu Perfil &amp; Ajustes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('financas')}
          style={{
            backgroundColor: isFinancasSubTab
              ? '#00E5FF'
              : themeMode === 'DAYLIGHT'
                ? '#F8FAFC'
                : '#111827',
            borderColor: isFinancasSubTab ? '#00E5FF' : 'transparent',
            color: isFinancasSubTab
              ? '#090D16'
              : themeMode === 'DAYLIGHT'
                ? '#334155'
                : '#CBD5E1',
          }}
          className="rounded-xl border py-2.5 px-2 text-xs sm:text-sm font-black tracking-tight flex items-center justify-center gap-1.5 cursor-pointer transition whitespace-nowrap"
        >
          <Wallet className="h-4 w-4 shrink-0" />
          <span>Finanças &amp; Metas</span>
        </button>
      </div>

      {isFinancasSubTab ? (
        <FinanceGoalsAndRewardsModule />
      ) : (
        <>
          {/* 1. SLEEK USER HEADER AT TOP OF PERFIL + OFFICIAL 3-MODE SHIFT SELECTOR (Online | Ausente | Modo Ninja) */}
          <div
            style={{
              backgroundColor: themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#0F172A',
              borderColor:
                themeMode === 'DAYLIGHT'
                  ? '#CBD5E1'
                  : 'rgba(0, 229, 255, 0.28)',
            }}
            className="rounded-2xl border p-3.5 space-y-3 shadow-xs"
          >
            {/* User Identity Row: Avatar + Nome, Veículo, Plataformas */}
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-12 w-12 shrink-0">
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-[#00E5FF] bg-black flex items-center justify-center">
                    <img
                      src={
                        realCourierProfile?.isRegistered &&
                        realCourierProfile.avatar_url
                          ? realCourierProfile.avatar_url
                          : isPresidenteProfile
                            ? BUDDY_AVATARS.presidente
                            : perfilStatusAvatarUrl
                      }
                      alt={currentUserName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {/* Live 3D Buddy status badge (Presidente crown for Admin) */}
                  <img
                    src={
                      isPresidenteProfile && currentShiftMode === 'ONLINE'
                        ? BUDDY_AVATARS.presidente
                        : perfilStatusAvatarUrl
                    }
                    alt="Estado do Buddy"
                    className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full object-cover bg-black ring-2 ring-[#0F172A] shadow-sm"
                  />
                </div>
                <div className="min-w-0">
                  <span
                    style={{
                      color: themeMode === 'DAYLIGHT' ? '#0F172A' : '#FFFFFF',
                    }}
                    className="block text-base font-extrabold truncate"
                  >
                    {currentUserName}
                  </span>
                  <span
                    style={{
                      color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
                    }}
                    className="block text-xs font-semibold truncate mt-0.5"
                  >
                    {realCourierProfile?.vehicle || 'Mota 125cc'} •{' '}
                    {activePlatforms.join(' + ')}
                  </span>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold shrink-0 border ${
                  currentShiftMode === 'ONLINE'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : currentShiftMode === 'AUSENTE'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800 border-cyan-500/40 text-cyan-300'
                }`}
              >
                {currentShiftMode === 'ONLINE'
                  ? 'Online'
                  : currentShiftMode === 'AUSENTE'
                    ? 'Ausente'
                    : 'Modo Ninja'}
              </span>
            </div>

            {/* Quick SVG Action Buttons: Editar Perfil | Foto | Terminar Sessão (Sleek Matte Dark Slate #0F172A, Zero Bright Red) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setIsCourierRegistrationModalOpen(true)}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 py-2 px-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition whitespace-nowrap"
              >
                <Edit3 className="h-3.5 w-3.5 shrink-0" />
                <span>Editar Perfil</span>
              </button>

              <button
                type="button"
                onClick={() => toggleAccordionCard('PERFIL')}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 py-2 px-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition whitespace-nowrap"
              >
                <Camera className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>Foto</span>
              </button>

              <button
                type="button"
                onClick={logoutSession}
                style={{ backgroundColor: '#0F172A' }}
                className="rounded-xl border border-slate-700 hover:border-cyan-500/40 text-slate-200 py-2 px-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition whitespace-nowrap"
              >
                <LogOut className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>Terminar Sessão</span>
              </button>
            </div>

            {/* Prominent 3-Way Estado do Turno Selector: Online | Ausente | Modo Ninja */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Estado do Turno</span>
                <span className="text-cyan-400">
                  {currentShiftMode === 'ONLINE'
                    ? 'Visível no Mapa & Buddys'
                    : currentShiftMode === 'AUSENTE'
                      ? 'Em Pausa / Intervalo'
                      : 'Invisível no Mapa (Acesso Total)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectShiftMode('ONLINE')}
                  className={`rounded-xl py-2 px-2 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition border ${
                    currentShiftMode === 'ONLINE'
                      ? 'bg-slate-950 border-[#00E5FF] text-[#00E5FF]'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Radio className="h-3.5 w-3.5 shrink-0" />
                  <span>Online</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectShiftMode('AUSENTE')}
                  className={`rounded-xl py-2 px-2 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition border ${
                    currentShiftMode === 'AUSENTE'
                      ? 'bg-slate-950 border-amber-400 text-amber-300'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <PauseCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Ausente</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectShiftMode('NINJA')}
                  className={`rounded-xl py-2 px-2 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition border ${
                    currentShiftMode === 'NINJA'
                      ? 'bg-slate-950 border-[#00E5FF] text-[#00E5FF]'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <EyeOff className="h-3.5 w-3.5 shrink-0" />
                  <span>Modo Ninja</span>
                </button>
              </div>
            </div>

            {/* Buddy Visual: live 3D status preview + seasonal skin selector (Padrão | Halloween) */}
            <div className="pt-2.5 border-t border-slate-800/80 flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl overflow-hidden bg-black ring-1 ring-[#00E5FF]/40 shrink-0">
                <img
                  src={perfilStatusAvatarUrl}
                  alt="Pré-visualização do Buddy"
                  className="h-full w-full object-cover scale-110"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                  <span className="text-slate-400">Visual do Buddy</span>
                  <span className="text-cyan-400 truncate">
                    {currentShiftMode === 'NINJA'
                      ? 'Buddy Ninja'
                      : currentShiftMode === 'AUSENTE'
                        ? 'Buddy de Costas (Ausente)'
                        : buddySkin === 'HALLOWEEN'
                          ? 'Buddy Halloween'
                          : 'Buddy Explorador'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBuddySkinPref('DEFAULT')}
                    className={`rounded-lg py-1.5 px-2 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition border ${
                      buddySkin === 'DEFAULT'
                        ? 'bg-slate-950 border-[#00E5FF] text-[#00E5FF]'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span>Padrão</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuddySkinPref('HALLOWEEN')}
                    className={`rounded-lg py-1.5 px-2 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition border ${
                      buddySkin === 'HALLOWEEN'
                        ? 'bg-slate-950 border-amber-400 text-amber-300'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Ghost className="h-3.5 w-3.5 shrink-0" />
                    <span>Modo Halloween</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Top Quick Actions Grid: Enviar App / QR Code APK | Suporte em Tempo Real | Manual & Dossiê Legal */}
      <div
        style={{
          backgroundColor: themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#0B0F17',
          borderColor:
            themeMode === 'DAYLIGHT' ? '#CBD5E1' : 'rgba(0, 229, 255, 0.25)',
          borderRadius: '12px',
        }}
        className="border p-3 shadow-xs space-y-2"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsDirectApkShareModalOpen(true)}
            style={{
              backgroundColor: themeMode === 'DAYLIGHT' ? '#F8FAFC' : '#111827',
              borderColor:
                themeMode === 'DAYLIGHT'
                  ? '#CBD5E1'
                  : 'rgba(0, 229, 255, 0.28)',
              color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
              borderRadius: '12px',
            }}
            className="w-full border py-2.5 px-3 text-left flex items-center justify-between gap-2.5 cursor-pointer transition hover:border-[#00E5FF]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                style={{
                  backgroundColor: 'rgba(0, 229, 255, 0.14)',
                  borderColor: 'rgba(0, 229, 255, 0.45)',
                  color: '#00E5FF',
                }}
                className="h-9 w-9 rounded-lg border flex items-center justify-center shrink-0"
              >
                <Download className="h-4 w-4 text-[#00E5FF]" />
              </span>
              <div className="min-w-0">
                <span
                  style={{
                    color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                  }}
                  className="block text-sm font-extrabold truncate"
                >
                  Enviar App / QR Code APK
                </span>
                <span
                  style={{
                    color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
                  }}
                  className="block text-xs truncate"
                >
                  Partilhar instalação direta com colegas
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#00E5FF] shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setIsLiveSupportModalOpen(true)}
            style={{
              backgroundColor: themeMode === 'DAYLIGHT' ? '#F8FAFC' : '#111827',
              borderColor:
                themeMode === 'DAYLIGHT'
                  ? '#CBD5E1'
                  : 'rgba(0, 229, 255, 0.28)',
              color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
              borderRadius: '12px',
            }}
            className="w-full border py-2.5 px-3 text-left flex items-center justify-between gap-2.5 cursor-pointer transition hover:border-[#00E5FF]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                style={{
                  backgroundColor: 'rgba(0, 229, 255, 0.14)',
                  borderColor: 'rgba(0, 229, 255, 0.45)',
                  color: '#00E5FF',
                }}
                className="h-9 w-9 rounded-lg border flex items-center justify-center shrink-0"
              >
                <MessageSquare className="h-4 w-4 text-[#00E5FF]" />
              </span>
              <div className="min-w-0">
                <span
                  style={{
                    color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                  }}
                  className="block text-sm font-extrabold truncate"
                >
                  Suporte em Tempo Real
                </span>
                <span
                  style={{
                    color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
                  }}
                  className="block text-xs truncate"
                >
                  Linha direta com a coordenação
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#00E5FF] shrink-0" />
          </button>
        </div>

        {/* Direct 1-Tap Access to Manual & Dossiê Legal */}
        <button
          type="button"
          onClick={() => setIsOfficialManualModalOpen(true)}
          style={{
            backgroundColor: themeMode === 'DAYLIGHT' ? '#F8FAFC' : '#111827',
            borderColor: '#00E5FF',
            color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
            borderRadius: '12px',
          }}
          className="w-full border py-2.5 px-3 text-left flex items-center justify-between gap-2.5 cursor-pointer transition hover:opacity-95"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              style={{
                backgroundColor: '#0B0F17',
                borderColor: '#00E5FF',
                color: '#00E5FF',
              }}
              className="h-9 w-9 rounded-lg border flex items-center justify-center shrink-0"
            >
              <BookOpen className="h-4 w-4 text-[#00E5FF]" />
            </span>
            <div className="min-w-0">
              <span
                style={{
                  color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                }}
                className="block text-sm font-extrabold truncate"
              >
                Manual &amp; Dossiê Legal (RGPD / Finanças / AT)
              </span>
              <span
                style={{
                  color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
                }}
                className="block text-xs truncate"
              >
                Guia do Estafeta, Manual Executivo e Enquadramento Legal UE
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#00E5FF] shrink-0" />
        </button>
      </div>

      {/* Live Support Modal inside Ajustes */}
      {isLiveSupportModalOpen && (
        <div className="fixed inset-0 z-[1300] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-sky-500/40 p-4 shadow-2xl">
            <RealTimeSupportPanel
              onBack={() => setIsLiveSupportModalOpen(false)}
              isDaylight={themeMode === 'DAYLIGHT'}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          ACCORDION CARD 1: 👤 PERFIL (${currentUserName})
          ===================================================================== */}
      <div
        style={{
          backgroundColor: themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#0B0F17',
          borderColor:
            themeMode === 'DAYLIGHT' ? '#CBD5E1' : 'rgba(0, 229, 255, 0.25)',
          borderRadius: '12px',
        }}
        className="border overflow-hidden shadow-xs"
      >
        <button
          type="button"
          onClick={() => toggleAccordionCard('PERFIL')}
          style={{
            backgroundColor: themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#0B0F17',
            color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
            borderRadius: '0px',
          }}
          className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left transition cursor-pointer"
        >
          <div className="min-w-0">
            <span
              style={{
                color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
              }}
              className="flex items-center gap-1.5 text-sm sm:text-base font-extrabold truncate"
            >
              <UserCheck className="h-4 w-4 text-[#00E5FF] shrink-0" />
              <span>Perfil ({currentUserName})</span>
            </span>
            <span
              style={{
                color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
              }}
              className="block text-xs font-semibold truncate mt-0.5"
            >
              {activePlatforms.join(' • ')} • Turno: {shiftBadge}
            </span>
          </div>
          <ChevronRight
            style={{
              color: themeMode === 'DAYLIGHT' ? '#090D16' : '#00E5FF',
            }}
            className={`h-5 w-5 shrink-0 transition-transform ${
              openAccordion === 'PERFIL' ? 'rotate-90' : ''
            }`}
          />
        </button>

        {openAccordion === 'PERFIL' && (
          <div className="p-3.5 pt-2.5 border-t border-zinc-800 space-y-2.5 bg-zinc-950/60">
            {/* Top Quick Buttons: GPS | Editar Perfil */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={refreshLiveGpsPosition}
                className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 py-2.5 px-3 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <MapPin className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" />
                <span>GPS</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCourierRegistrationModalOpen(true)}
                style={{
                  backgroundColor: '#00E5FF',
                  color: '#05070B',
                }}
                className="w-full rounded-xl py-2.5 px-3 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition hover:opacity-95 shadow-xs"
              >
                <Edit3 className="h-3.5 w-3.5 shrink-0" />
                <span>Editar Perfil</span>
              </button>
            </div>

            {/* Clean Avatar Preview + Single Escolher Foto Button */}
            <ZeroAiProfilePhotoUploader
              avatarUrl={
                realCourierProfile?.isRegistered
                  ? realCourierProfile.avatar_url
                  : undefined
              }
              courierName={currentUserName}
              onAvatarCompressedChange={(dataUrl) => {
                void updateCourierAvatarUrl(dataUrl);
              }}
              compact
            />

            {/* Optional WhatsApp & E-mail Opt-In Card for Important Fleet Alerts */}
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-100">
                  <Bell className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" />
                  <span>Receber alertas e mensagens importantes via:</span>
                </span>
                {contactSavedFeedback && (
                  <span className="text-[11px] font-black text-emerald-400">
                    {contactSavedFeedback}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 mb-1">
                    <Smartphone className="h-3 w-3 text-[#00E5FF]" />
                    <span>WhatsApp (Opcional)</span>
                  </label>
                  <input
                    type="tel"
                    value={courierWhatsappInput}
                    onChange={(e) => setCourierWhatsappInput(e.target.value)}
                    placeholder="+351 912 345 678"
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 mb-1">
                    <Mail className="h-3 w-3 text-[#00E5FF]" />
                    <span>E-mail (Opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={courierEmailInput}
                    onChange={(e) => setCourierEmailInput(e.target.value)}
                    placeholder="estafeta@email.pt"
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = !courierOptInWhatsapp;
                    setCourierOptInWhatsapp(next);
                    void handleSaveCourierContactOptIn(
                      courierWhatsappInput,
                      courierEmailInput,
                      next,
                      courierOptInEmail
                    );
                  }}
                  style={{
                    backgroundColor: courierOptInWhatsapp
                      ? 'rgba(0, 229, 255, 0.14)'
                      : '#090D16',
                    borderColor: courierOptInWhatsapp ? '#00E5FF' : '#27272a',
                    color: courierOptInWhatsapp ? '#00E5FF' : '#a1a1aa',
                  }}
                  className="rounded-lg border py-1.5 px-2 text-xs font-extrabold cursor-pointer transition"
                >
                  {courierOptInWhatsapp ? '✓ WhatsApp' : 'WhatsApp'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !courierOptInEmail;
                    setCourierOptInEmail(next);
                    void handleSaveCourierContactOptIn(
                      courierWhatsappInput,
                      courierEmailInput,
                      courierOptInWhatsapp,
                      next
                    );
                  }}
                  style={{
                    backgroundColor: courierOptInEmail
                      ? 'rgba(0, 229, 255, 0.14)'
                      : '#090D16',
                    borderColor: courierOptInEmail ? '#00E5FF' : '#27272a',
                    color: courierOptInEmail ? '#00E5FF' : '#a1a1aa',
                  }}
                  className="rounded-lg border py-1.5 px-2 text-xs font-extrabold cursor-pointer transition"
                >
                  {courierOptInEmail ? '✓ E-mail' : 'E-mail'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveCourierContactOptIn()}
                  style={{
                    backgroundColor: '#00E5FF',
                    color: '#05070B',
                  }}
                  className="rounded-lg py-1.5 px-2 text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition hover:opacity-95"
                >
                  <Save className="h-3.5 w-3.5 shrink-0" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>

            {/* Personal, Financial, Theme & Shift Controls inside Perfil */}
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setActiveTab('financas')}
                className="w-full py-3 px-3.5 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-zinc-100">
                  <Target className="h-4 w-4 text-[#00E5FF] shrink-0" />
                  <span>Metas Financeiras &amp; Caixa</span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#00E5FF] shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('calculadora')}
                className="w-full py-3 px-3.5 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-zinc-100">
                  <Car className="h-4 w-4 text-[#00E5FF] shrink-0" />
                  <span>Veículo, Custos &amp; Impostos</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="rounded bg-zinc-950 border border-[#00E5FF]/40 px-2 py-0.5 text-[11px] font-extrabold text-[#00E5FF]">
                    &gt;= {userPrefs.minGrossOrderValueEur.toFixed(2)} €
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#00E5FF]" />
                </div>
              </button>

              <button
                type="button"
                onClick={toggleThemeMode}
                className="w-full py-3 px-3.5 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-zinc-100">
                  {themeMode === 'DAYLIGHT' ? (
                    <Sun className="h-4 w-4 text-[#00E5FF] shrink-0" />
                  ) : (
                    <Moon className="h-4 w-4 text-[#00E5FF] shrink-0" />
                  )}
                  <span>Tema Visual (Modo Claro / Escuro)</span>
                </span>
                <span className="rounded bg-zinc-950 border border-zinc-700 px-2 py-0.5 text-[11px] font-extrabold text-zinc-200 shrink-0">
                  {themeMode === 'DAYLIGHT' ? 'Modo Claro' : 'Modo Escuro'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsShiftDrawerOpen((prev) => !prev)}
                className="w-full py-3 px-3.5 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-zinc-100">
                  <Radio className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Estado do Turno (Online / Ausente / Modo Ninja / Voz)</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="rounded bg-zinc-950 border border-[#00E5FF]/40 px-2 py-0.5 text-[11px] font-extrabold text-[#00E5FF]">
                    {shiftBadge}
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 text-[#00E5FF] transition-transform ${
                      isShiftDrawerOpen ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </button>

              {isShiftDrawerOpen && (
                <div className="px-3.5 py-2.5 bg-zinc-950 grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={toggleAppPauseMode}
                    className={`rounded-lg py-2 px-2 text-xs font-extrabold cursor-pointer ${
                      isAppPaused
                        ? 'bg-white text-zinc-950'
                        : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    {isAppPaused ? '▶ Retomar' : '⏸ Pausar'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleAnonymousMode}
                    className={`rounded-lg py-2 px-2 text-xs font-extrabold cursor-pointer ${
                      userPrefs.anonymousMode
                        ? 'bg-white text-zinc-950'
                        : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    Ninja: {userPrefs.anonymousMode ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleTtsVoice}
                    className={`rounded-lg py-2 px-2 text-xs font-extrabold cursor-pointer ${
                      ttsVoiceEnabled
                        ? 'bg-white text-zinc-950'
                        : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    Voz: {ttsVoiceEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          ACCORDION CARD 2: VOZ & POSIÇÃO DA BOLINHA
          ===================================================================== */}
      <div
        style={{
          backgroundColor: themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#0B0F17',
          borderColor:
            themeMode === 'DAYLIGHT' ? '#CBD5E1' : 'rgba(0, 229, 255, 0.25)',
          borderRadius: '12px',
        }}
        className="border overflow-hidden shadow-xs"
      >
        <button
          type="button"
          onClick={() => toggleAccordionCard('VOZ_BOLINHA')}
          style={{
            backgroundColor: themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#0B0F17',
            color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
            borderRadius: '0px',
          }}
          className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left transition cursor-pointer"
        >
          <div className="min-w-0">
            <span
              style={{
                color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
              }}
              className="flex items-center gap-1.5 text-sm sm:text-base font-extrabold truncate"
            >
              <Mic className="h-4 w-4 text-[#00E5FF] shrink-0" />
              <span>Voz &amp; Posição da Bolinha</span>
            </span>
            <span
              style={{
                color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
              }}
              className="block text-xs font-semibold truncate mt-0.5"
            >
              Velocidade {buddyVoiceRate.toFixed(2)}x • Setas Direcionais &amp; Alertas
            </span>
          </div>
          <ChevronRight
            style={{
              color: themeMode === 'DAYLIGHT' ? '#090D16' : '#00E5FF',
            }}
            className={`h-5 w-5 shrink-0 transition-transform ${
              openAccordion === 'VOZ_BOLINHA' ? 'rotate-90' : ''
            }`}
          />
        </button>

        {openAccordion === 'VOZ_BOLINHA' && (
          <div className="p-3.5 pt-2 border-t border-zinc-800 space-y-3 bg-zinc-950/60">
            {/* Natural Male pt-BR Voice Engine Tuning Card */}
            <div
              style={{
                backgroundColor:
                  themeMode === 'DAYLIGHT' ? '#F8FAFC' : '#111827',
                borderColor:
                  themeMode === 'DAYLIGHT'
                    ? '#E2E8F0'
                    : 'rgba(0, 229, 255, 0.25)',
              }}
              className="rounded-xl border p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span
                    style={{
                      color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                    }}
                    className="text-sm font-extrabold flex items-center gap-1.5"
                  >
                    <Volume2 className="h-4 w-4 text-[#00E5FF] shrink-0" />
                    <span>
                      Velocidade da Voz (pt-BR Masculina):{' '}
                      {buddyVoiceRate.toFixed(2)}x
                    </span>
                  </span>
                  <span
                    style={{
                      color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
                    }}
                    className="block text-xs"
                  >
                    Voz Ativa:{' '}
                    <strong
                      style={{
                        color: themeMode === 'DAYLIGHT' ? '#0284C7' : '#00E5FF',
                      }}
                    >
                      {resolvedPtBrVoiceName}
                    </strong>{' '}
                    • Pitch 0.80 (Grave Masculino) • Intro 1.0x / App 1.1x
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={cycleDevicePtVoice}
                    style={{
                      backgroundColor:
                        themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#1E293B',
                      borderColor:
                        themeMode === 'DAYLIGHT'
                          ? '#CBD5E1'
                          : 'rgba(0, 229, 255, 0.35)',
                      color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                    }}
                    className="rounded-xl border px-2.5 py-1.5 text-xs font-extrabold flex items-center gap-1 cursor-pointer transition hover:border-[#00E5FF] shadow-xs shrink-0"
                    title="Alternar entre as vozes portuguesas instaladas no telemóvel"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-[#00E5FF]" />
                    <span>🔄 Alternar Voz</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      speakTextPt('Uber: 6,20 limpos, 1,55 por km. Vale a pena.')
                    }
                    style={{
                      backgroundColor: '#0B0F17',
                      borderColor: '#00E5FF',
                      color: '#00E5FF',
                    }}
                    className="rounded-xl border px-3 py-1.5 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition hover:opacity-95 shadow-xs shrink-0"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>🔊 Ouvir Voz ({buddyVoiceRate.toFixed(2)}x)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  style={{
                    color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
                  }}
                  className="text-xs font-bold"
                >
                  0.90x
                </span>
                <input
                  type="range"
                  min="0.90"
                  max="1.50"
                  step="0.05"
                  value={buddyVoiceRate}
                  onChange={(e) => setBuddyVoiceRate(Number(e.target.value))}
                  aria-label="Velocidade da Voz do Buddy"
                  className="flex-1 accent-[#00E5FF] cursor-pointer"
                />
                <span
                  style={{
                    color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
                  }}
                  className="text-xs font-bold"
                >
                  1.50x
                </span>
                {Math.abs(buddyVoiceRate - 1.1) >= 0.01 && (
                  <button
                    type="button"
                    onClick={() => setBuddyVoiceRate(1.1)}
                    style={{
                      backgroundColor: '#0B0F17',
                      borderColor: '#00E5FF',
                      color: '#00E5FF',
                    }}
                    className="rounded-lg border px-2 py-0.5 text-xs font-bold cursor-pointer"
                  >
                    Repor 1.10x
                  </button>
                )}
              </div>
            </div>

            {/* 3 Bundled 3D Poses Status Preview */}
            <div className="grid grid-cols-3 gap-2">
              <div
                style={{
                  backgroundColor:
                    themeMode === 'DAYLIGHT'
                      ? currentMascotState === 'ACTIVE'
                        ? '#ECFEFF'
                        : '#FFFFFF'
                      : '#111827',
                  borderColor:
                    currentMascotState === 'ACTIVE'
                      ? '#00E5FF'
                      : themeMode === 'DAYLIGHT'
                        ? '#E2E8F0'
                        : 'rgba(0, 229, 255, 0.25)',
                }}
                className="rounded-xl p-2.5 flex flex-col items-center text-center border-2 transition"
              >
                <div className="h-12 w-12 flex items-center justify-center bg-transparent mb-1">
                  <img
                    src={buddyMascotImages.mascotActive}
                    alt="Pose 1 Ativo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <span
                  style={{
                    color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                  }}
                  className="text-xs font-extrabold"
                >
                  1. Online
                </span>
              </div>

              <div
                style={{
                  backgroundColor:
                    themeMode === 'DAYLIGHT'
                      ? currentMascotState === 'INACTIVE'
                        ? '#ECFEFF'
                        : '#FFFFFF'
                      : '#111827',
                  borderColor:
                    currentMascotState === 'INACTIVE'
                      ? '#00E5FF'
                      : themeMode === 'DAYLIGHT'
                        ? '#E2E8F0'
                        : 'rgba(0, 229, 255, 0.25)',
                }}
                className="rounded-xl p-2.5 flex flex-col items-center text-center border-2 transition"
              >
                <div className="h-12 w-12 flex items-center justify-center bg-transparent mb-1">
                  <img
                    src={buddyMascotImages.mascotInactive}
                    alt="Pose 2 Pausa"
                    className="h-full w-full object-contain"
                  />
                </div>
                <span
                  style={{
                    color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                  }}
                  className="text-xs font-extrabold"
                >
                  2. Pausa
                </span>
              </div>

              <div
                style={{
                  backgroundColor:
                    themeMode === 'DAYLIGHT'
                      ? currentMascotState === 'DELIVERY'
                        ? '#ECFEFF'
                        : '#FFFFFF'
                      : '#111827',
                  borderColor:
                    currentMascotState === 'DELIVERY'
                      ? '#00E5FF'
                      : themeMode === 'DAYLIGHT'
                        ? '#E2E8F0'
                        : 'rgba(0, 229, 255, 0.25)',
                }}
                className="rounded-xl p-2.5 flex flex-col items-center text-center border-2 transition"
              >
                <div className="h-12 w-12 flex items-center justify-center bg-transparent mb-1">
                  <img
                    src={buddyMascotImages.mascotDelivery}
                    alt="Pose 3 Entrega"
                    className="h-full w-full object-contain"
                  />
                </div>
                <span
                  style={{
                    color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                  }}
                  className="text-xs font-extrabold"
                >
                  3. Entrega 🚀
                </span>
              </div>
            </div>

            {/* Directional Pad (D-Pad) for Floating Bubble Resting Position */}
            <div className="space-y-2">
              <span className="text-sm font-extrabold text-zinc-100 block">
                📍 Posição de Repouso da Bolinha Flutuante
              </span>

              {/* 6-Direction Visual D-Pad (↖ Topo Esq | ↗ Topo Dir | ⬅ Meio Esq | ➡ Meio Dir | ↙ Baixo Esq | ↘ Baixo Dir) */}
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-2.5 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'TOP_LEFT', label: '↖ Topo Esq' },
                      { id: 'TOP_RIGHT', label: '↗ Topo Dir' },
                      { id: 'MIDDLE_LEFT', label: '⬅ Meio Esq' },
                      { id: 'MIDDLE_RIGHT', label: '➡ Meio Dir' },
                      { id: 'BOTTOM_LEFT', label: '↙ Baixo Esq' },
                      { id: 'BOTTOM_RIGHT', label: '↘ Baixo Dir' },
                    ] as const
                  ).map((dir) => {
                    const isSelected = bubbleRestingPreset === dir.id;
                    return (
                      <button
                        key={dir.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setBubbleRestingPreset(dir.id)}
                        style={{
                          backgroundColor: isSelected
                            ? '#00E5FF'
                            : themeMode === 'DAYLIGHT'
                              ? '#FFFFFF'
                              : '#111827',
                          borderColor: isSelected
                            ? '#00E5FF'
                            : themeMode === 'DAYLIGHT'
                              ? '#CBD5E1'
                              : 'rgba(0, 229, 255, 0.35)',
                          color: isSelected
                            ? '#05070B'
                            : themeMode === 'DAYLIGHT'
                              ? '#090D16'
                              : '#FFFFFF',
                        }}
                        className="rounded-xl border-2 py-2.5 px-3 text-xs font-black flex items-center justify-between gap-2 cursor-pointer transition active:scale-95"
                      >
                        <span>{dir.label}</span>
                        {isSelected && <span className="text-xs font-black">✓</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Single Card Directly Below D-Pad: 📌 Fixar onde eu arrastar a bolinha */}
                {(() => {
                  const isCustomDrag = bubbleRestingPreset === 'CUSTOM_DRAG';
                  return (
                    <button
                      type="button"
                      aria-pressed={isCustomDrag}
                      onClick={() => setBubbleRestingPreset('CUSTOM_DRAG')}
                      style={{
                        backgroundColor:
                          themeMode === 'DAYLIGHT'
                            ? isCustomDrag
                              ? '#ECFEFF'
                              : '#FFFFFF'
                            : '#111827',
                        borderColor: isCustomDrag
                          ? '#00E5FF'
                          : themeMode === 'DAYLIGHT'
                            ? '#CBD5E1'
                            : 'rgba(0, 229, 255, 0.3)',
                        color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                      }}
                      className="w-full rounded-xl px-3 py-2.5 text-left border-2 transition cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span
                          style={{
                            color:
                              themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                          }}
                          className="block text-xs sm:text-sm font-extrabold"
                        >
                          📌 Fixar onde eu arrastar a bolinha
                        </span>
                        <span
                          style={{
                            color:
                              themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
                          }}
                          className="block text-[11px]"
                        >
                          Guarda automaticamente o último ponto onde soltares
                        </span>
                      </div>
                      <span
                        style={{
                          backgroundColor: isCustomDrag
                            ? '#0B0F17'
                            : 'transparent',
                          borderColor: isCustomDrag
                            ? '#00E5FF'
                            : themeMode === 'DAYLIGHT'
                              ? '#CBD5E1'
                              : 'rgba(0, 229, 255, 0.35)',
                          color: isCustomDrag
                            ? '#00E5FF'
                            : themeMode === 'DAYLIGHT'
                              ? '#64748B'
                              : '#94A3B8',
                        }}
                        className="h-5 w-5 rounded-full border flex items-center justify-center text-xs font-black shrink-0"
                      >
                        {isCustomDrag ? '✓' : ''}
                      </span>
                    </button>
                  );
                })()}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSubPage('PERSONALIZAR_ALERTAS_VOZ')}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 py-3 px-3.5 flex justify-between items-center text-left hover:bg-zinc-800/60 transition cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-extrabold text-zinc-100 flex items-center gap-2 min-w-0">
                <Sliders className="h-4 w-4 text-[#00E5FF] shrink-0" />
                <span>
                  Personalizar Alertas, Trigger (&ldquo;
                  {voiceActivationConfig.customTriggerWord || 'Buddy'}&rdquo;) &amp; Mensagens
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-[#00E5FF] shrink-0" />
            </button>
          </div>
        )}
      </div>

      {/* =====================================================================
          ACCORDION CARD 3: 📍 MAPA, ZONA & ACORDOS (AMARANTE)
          ===================================================================== */}
      <div
        style={{
          backgroundColor: themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#0B0F17',
          borderColor:
            themeMode === 'DAYLIGHT' ? '#CBD5E1' : 'rgba(0, 229, 255, 0.25)',
          borderRadius: '12px',
        }}
        className="border overflow-hidden shadow-xs"
      >
        <button
          type="button"
          onClick={() => toggleAccordionCard('CENTRO_FINANCAS')}
          style={{
            backgroundColor: themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#0B0F17',
            color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
            borderRadius: '0px',
          }}
          className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left transition cursor-pointer"
        >
          <div className="min-w-0">
            <span
              style={{
                color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
              }}
              className="flex items-center gap-1.5 text-sm sm:text-base font-extrabold truncate"
            >
              <MapPin className="h-4 w-4 text-[#00E5FF] shrink-0" />
              <span>Mapa, Zona &amp; Acordos ({selectedRegionName})</span>
            </span>
            <span
              style={{
                color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
              }}
              className="block text-xs font-semibold truncate mt-0.5"
            >
              Centro operacional • Raio {mapRadiusKm} km &amp; Piso Mínimo Coletivo
            </span>
          </div>
          <ChevronRight
            style={{
              color: themeMode === 'DAYLIGHT' ? '#090D16' : '#00E5FF',
            }}
            className={`h-5 w-5 shrink-0 transition-transform ${
              openAccordion === 'CENTRO_FINANCAS' ? 'rotate-90' : ''
            }`}
          />
        </button>

        {openAccordion === 'CENTRO_FINANCAS' && (
          <div className="p-3.5 pt-2.5 border-t border-zinc-800 space-y-2.5 bg-zinc-950/60">
            {/* 1. Editar Centro & Raio do Mapa */}
            <button
              type="button"
              onClick={() => setIsHubSelectorModalOpen(true)}
              className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 p-3 flex items-center justify-between gap-2.5 text-left transition cursor-pointer"
            >
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-zinc-100">
                  <MapPin className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" />
                  <span>Editar Centro &amp; Raio do Mapa</span>
                </span>
                <span className="text-xs text-[#00E5FF] font-semibold block mt-0.5">
                  {selectedRegionName} • Raio {mapRadiusKm} km
                </span>
              </div>
              <span className="rounded-lg bg-[#0B0F17] border border-[#00E5FF] px-2.5 py-1 text-xs font-extrabold text-[#00E5FF] shrink-0 whitespace-nowrap">
                Alterar
              </span>
            </button>

            {/* 2. Acordos de Zona (Piso Mínimo Coletivo) */}
            <button
              type="button"
              onClick={() => setSubPage('ACORDOS_ZONA')}
              className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 p-3 flex items-center justify-between gap-2.5 text-left transition cursor-pointer"
            >
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-zinc-100">
                  <Handshake className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" />
                  <span>Acordos de Zona (Piso Mínimo Coletivo)</span>
                </span>
                <span className="text-xs text-zinc-400 font-semibold block mt-0.5">
                  Tarifa mínima acordada entre estafetas da zona
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="rounded-lg bg-zinc-950 border border-zinc-700 px-2.5 py-1 text-xs font-extrabold text-zinc-200 whitespace-nowrap">
                  {zonePacts.filter((p) => p.joinedByUser).length}/
                  {zonePacts.length} Ativos
                </span>
                <ChevronRight className="h-4 w-4 text-[#00E5FF]" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* =====================================================================
          ACCORDION CARD 4: SEGURANÇA DE RUA & SISTEMA
          ===================================================================== */}
      <div
        style={{
          backgroundColor: themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#0B0F17',
          borderColor:
            themeMode === 'DAYLIGHT' ? '#CBD5E1' : 'rgba(0, 229, 255, 0.25)',
          borderRadius: '12px',
        }}
        className="border overflow-hidden shadow-xs"
      >
        <button
          type="button"
          onClick={() => toggleAccordionCard('SEGURANCA_SISTEMA')}
          style={{
            backgroundColor: themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#0B0F17',
            color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
            borderRadius: '0px',
          }}
          className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left transition cursor-pointer"
        >
          <div className="min-w-0">
            <span
              style={{
                color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
              }}
              className="flex items-center gap-1.5 text-sm sm:text-base font-extrabold truncate"
            >
              <Shield className="h-4 w-4 text-[#00E5FF] shrink-0" />
              <span>Segurança de Rua &amp; Sistema</span>
            </span>
            <span
              style={{
                color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
              }}
              className="block text-xs font-semibold truncate mt-0.5"
            >
              Modo Chuva, Queda 45s, SOS, Perigos &amp; Bateria ({batteryLevelPct}%)
            </span>
          </div>
          <ChevronRight
            style={{
              color: themeMode === 'DAYLIGHT' ? '#090D16' : '#00E5FF',
            }}
            className={`h-5 w-5 shrink-0 transition-transform ${
              openAccordion === 'SEGURANCA_SISTEMA' ? 'rotate-90' : ''
            }`}
          />
        </button>

        {openAccordion === 'SEGURANCA_SISTEMA' && (
          <div className="p-3.5 pt-2.5 border-t border-zinc-800 space-y-2.5 bg-zinc-950/60">
            {/* 1. Street Safety & Battery Survival Modules */}
            <div className="space-y-2">
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-100">
                    <CloudRain className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" />
                    <span>Modo Chuva &amp; Luvas</span>
                  </span>
                  <span className="text-[11px] text-zinc-400 block">
                    Bloqueia toques fantasma de gotas de água
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleRainLock}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-extrabold cursor-pointer ${
                    rainLockActive
                      ? 'bg-sky-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-200'
                  }`}
                >
                  {rainLockActive ? 'ATIVO' : 'Ativar'}
                </button>
              </div>

              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-100">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>Deteção Automática de Queda (45s)</span>
                    </span>
                    <span className="text-[11px] text-zinc-400 block">
                      Exige impacto &gt;32 m/s² + 3.5s de imobilidade pós-impacto
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={toggleCrashDetection}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-extrabold cursor-pointer ${
                        crashDetectionEnabled
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {crashDetectionEnabled ? 'ON' : 'OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={triggerSimulatedCrashTest}
                      className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1.5 text-xs font-bold cursor-pointer"
                    >
                      Testar
                    </button>
                  </div>
                </div>

                {/* 3-Pill Fall Sensor Sensitivity Selector */}
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {(
                    [
                      {
                        id: 'TOLERANT',
                        label: 'Tolerante (Padrão)',
                      },
                      {
                        id: 'MEDIUM',
                        label: 'Médio',
                      },
                      {
                        id: 'SENSITIVE',
                        label: 'Sensível',
                      },
                    ] as const
                  ).map((pill) => {
                    const isActive = crashSensitivityLevel === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setCrashSensitivityLevel(pill.id)}
                        style={{
                          backgroundColor: isActive ? '#00E5FF' : '#090D16',
                          borderColor: isActive ? '#00E5FF' : '#27272a',
                          color: isActive ? '#05070B' : '#d4d4d8',
                        }}
                        className="rounded-lg border py-1.5 px-1.5 text-[11px] font-black cursor-pointer transition text-center truncate"
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-100">
                      <BatteryCharging className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" />
                      <span>Modo Sobrevivência (&le;{userBatteryAlertThreshold}%)</span>
                    </span>
                    <span className="text-[11px] text-zinc-400 block">
                      Sem alertas de carregador acima de {userBatteryAlertThreshold}% (Atual: {batteryLevelPct}%{isBatteryCharging ? ' • A carregar' : ''})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={toggleBatterySurvivalMode}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-extrabold cursor-pointer ${
                        batterySurvivalMode
                          ? 'bg-amber-500 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {batterySurvivalMode ? 'ON' : 'Eco'}
                    </button>
                    <button
                      type="button"
                      onClick={simulateChargerUnpluggedAlert}
                      className="rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2.5 py-1.5 text-xs font-bold cursor-pointer"
                    >
                      Cabo
                    </button>
                  </div>
                </div>

                {/* User-Defined Battery % Alert Threshold Slider (10% to 50%) */}
                <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-zinc-300">
                      Definir % da bateria para começar a receber alertas:
                    </span>
                    <span className="rounded bg-[#0B0F17] border border-[#00E5FF] px-2 py-0.5 text-[11px] font-black text-[#00E5FF]">
                      {userBatteryAlertThreshold}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-zinc-400">
                      10%
                    </span>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="5"
                      value={userBatteryAlertThreshold}
                      onChange={(e) =>
                        setUserBatteryAlertThreshold(Number(e.target.value))
                      }
                      aria-label="Limiar de percentagem da bateria para alertas"
                      className="flex-1 accent-[#00E5FF] cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-zinc-400">
                      50%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Acionar Alerta SOS de Emergência (Sleek Matte Dark Slate, Zero Bright Red) */}
            <button
              type="button"
              onClick={() => requestOrConfirmSosActivation('Acidente na Via')}
              style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}
              className="w-full rounded-xl border border-amber-400/50 py-2.5 px-3 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition hover:opacity-95"
            >
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Acionar Alerta SOS de Emergência (ou diga &ldquo;Buddy SOS&rdquo;)
              </span>
            </button>

            {/* 3. Ecrã Sempre Ligado | Auto-Detetor de Pedidos | Atualizar App Agora (OTA) */}
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
              <button
                type="button"
                onClick={toggleWakeLock}
                className="w-full py-3 px-3.5 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-zinc-100">
                  <Lock className="h-4 w-4 text-[#00E5FF] shrink-0" />
                  <span>Ecrã Sempre Ligado</span>
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-extrabold shrink-0 ${
                    wakeLockEnabled
                      ? 'bg-[#00E5FF] text-slate-950'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {wakeLockEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!autoOfferDetectorEnabled) {
                    toggleAutoOfferDetectorEnabled();
                  }
                  setIsAccessibilityDiagnosticOpen(true);
                  speakTextPt(
                    'Auto-Detetor de Pedidos ativo para Uber Eats, Glovo e Bolt Food.'
                  );
                }}
                className="w-full py-3 px-3.5 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-zinc-100">
                    <Smartphone className="h-4 w-4 text-[#00E5FF] shrink-0" />
                    <span>Auto-Detetor de Pedidos (Acessibilidade)</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 mt-0.5">
                    {autoOfferDetectorEnabled
                      ? 'Estado: ATIVO (Uber, Glovo & Bolt)'
                      : 'Estado: INATIVO — Toque para ativar'}
                  </span>
                </div>
                <span className="rounded bg-[#00E5FF] px-2.5 py-1 text-xs font-black text-slate-950 shrink-0 shadow-xs">
                  Configurar
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    window.localStorage.setItem(
                      'buddy_pending_ota_toast_v1',
                      '1'
                    );
                    window.dispatchEvent(
                      new CustomEvent('buddy-ota-updated-toast')
                    );
                  } catch {
                    // ignore
                  }
                  const winAny = window as unknown as {
                    BuddyNativeOverlay?: {
                      reloadOtaNow?: () => void;
                    };
                  };
                  if (
                    typeof winAny.BuddyNativeOverlay?.reloadOtaNow ===
                    'function'
                  ) {
                    winAny.BuddyNativeOverlay.reloadOtaNow();
                    return;
                  }
                  try {
                    if ('caches' in window) {
                      caches.keys().then((names) => {
                        names.forEach((n) => caches.delete(n));
                      });
                    }
                  } catch {
                    // ignore
                  }
                  const baseUrl = window.location.href.split('?')[0];
                  window.location.replace(`${baseUrl}?ota_ts=${Date.now()}`);
                }}
                className="w-full py-3 px-3.5 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-zinc-100">
                  <RefreshCw className="h-4 w-4 text-[#00E5FF] shrink-0" />
                  <span>Atualizar App Agora (OTA)</span>
                </span>
                <span className="rounded bg-sky-500/15 border border-sky-500/35 px-2 py-0.5 text-xs font-bold text-sky-300 shrink-0">
                  Recarregar
                </span>
              </button>

              {/* 4. Perigos na Via | Rotas Proibidas & Reclamações */}
              <button
                type="button"
                onClick={() => setSubPage('PERIGOS_VIA')}
                className="w-full py-3 px-3.5 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-zinc-100">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Perigos na Via</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="rounded-lg bg-zinc-800 px-2.5 py-0.5 text-xs font-bold text-zinc-200">
                    {roadHazards.filter((h) => !h.resolved).length} Alertas
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#00E5FF]" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reclamacoes')}
                className="w-full py-3 px-3.5 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-zinc-100">
                  <FileCheck2 className="h-4 w-4 text-[#00E5FF] shrink-0" />
                  <span>Rotas Proibidas &amp; Reclamações</span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#00E5FF] shrink-0" />
              </button>
            </div>

            {/* 5. ↺ Repor Dados */}
            <div className="flex items-center justify-start px-1 pt-1">
              <button
                type="button"
                onClick={resetAllToSeed}
                className="text-xs sm:text-sm font-bold text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>↺ Repor Dados</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <DirectApkShareModal
        isOpen={isDirectApkShareModalOpen}
        onClose={() => setIsDirectApkShareModalOpen(false)}
      />

      <OperationalHubSelectorModal
        isOpen={isHubSelectorModalOpen}
        onClose={() => setIsHubSelectorModalOpen(false)}
      />

      {/* INTERACTIVE ACCESSIBILITY ORDER READER & SELF-LEARNING CALIBRATION MODAL */}
      {isAccessibilityDiagnosticOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
          onClick={() => setIsAccessibilityDiagnosticOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#0B0F17',
              borderColor: '#00E5FF',
              color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
            }}
            className="w-full max-w-md rounded-3xl border-2 p-5 shadow-2xl space-y-3.5 my-auto"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block">
                  {autoOfferDetectorEnabled
                    ? 'Estado: ATIVO 🟢 • Multi-Modo Embutido'
                    : 'Estado: PAUSADO ⚪'}
                </span>
                <h3
                  style={{
                    color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                  }}
                  className="text-base font-black tracking-tight mt-0.5"
                >
                  📱 Auto-Detetor de Pedidos: Uber, Glovo &amp; Bolt
                </h3>
                <p
                  style={{
                    color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
                  }}
                  className="text-xs font-bold mt-0.5"
                >
                  Monitoriza <code className="text-[#00B8D4]">Glovo Rider</code>,{' '}
                  <code className="text-[#00B8D4]">Uber Driver</code> e{' '}
                  <code className="text-[#00B8D4]">Bolt Food</code> em Portugal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAccessibilityDiagnosticOpen(false)}
                className="h-8 w-8 rounded-full border border-[#00E5FF]/40 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Toggle Switch: Deteção Automática em Tempo Real: ON 🟢 */}
            <button
              type="button"
              onClick={toggleAutoOfferDetectorEnabled}
              style={{
                backgroundColor:
                  themeMode === 'DAYLIGHT' ? '#F8FAFC' : '#090D16',
                borderColor: autoOfferDetectorEnabled ? '#10B981' : '#475569',
              }}
              className="w-full rounded-2xl border-2 p-3.5 flex items-center justify-between gap-2 cursor-pointer transition"
            >
              <div className="text-left">
                <div className="text-xs font-black">
                  Deteção Automática em Tempo Real:{' '}
                  <span
                    className={
                      autoOfferDetectorEnabled
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }
                  >
                    {autoOfferDetectorEnabled ? 'ON 🟢' : 'OFF ⚪'}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  Lê valor (€), km e calcula lucro limpo + semáforo em{' '}
                  {'<100ms'}
                </div>
              </div>
              <span
                className={`rounded-xl px-3 py-1 text-xs font-black shrink-0 ${
                  autoOfferDetectorEnabled
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {autoOfferDetectorEnabled ? 'ON 🟢' : 'OFF'}
              </span>
            </button>

            {/* Button 1: ⚡ Simular Pedido Agora (Teste Real) */}
            <button
              type="button"
              onClick={() => {
                if (!autoOfferDetectorEnabled) {
                  toggleAutoOfferDetectorEnabled();
                }
                triggerAutoDetectedOffer(6.8, 2.4, calibPlatform);
                setIsAccessibilityDiagnosticOpen(false);
              }}
              className="w-full rounded-2xl border-2 border-emerald-400 bg-emerald-500 text-slate-950 py-3 px-4 text-xs font-black cursor-pointer text-center shadow-[0_6px_20px_rgba(16,185,129,0.35)]"
            >
              ⚡ Simular Pedido Agora (Teste Real • 🟢 ACEITAR + Voz 1.1x)
            </button>

            {/* Button 2: ⚙️ Abrir Acessibilidade do Android + 2-Line Samsung Restricted Settings Tip */}
            <div
              style={{
                backgroundColor:
                  themeMode === 'DAYLIGHT' ? '#F8FAFC' : '#090D16',
                borderColor: 'rgba(0, 229, 255, 0.35)',
              }}
              className="rounded-2xl border p-3 space-y-2"
            >
              <button
                type="button"
                onClick={() => {
                  const winAny = window as unknown as {
                    BuddyNativeOverlay?: {
                      openAccessibilitySettings?: () => void;
                    };
                  };
                  if (
                    typeof winAny.BuddyNativeOverlay
                      ?.openAccessibilitySettings === 'function'
                  ) {
                    winAny.BuddyNativeOverlay.openAccessibilitySettings();
                  } else {
                    setCalibStatusMsg(
                      'ℹ️ Em telemóvel Android (.APK instalado), este botão abre diretamente Definições → Acessibilidade → Aplicações instaladas → Delivery Buddy.'
                    );
                  }
                }}
                className="w-full rounded-xl bg-[#00E5FF] text-[#090D16] py-2.5 px-3.5 text-xs font-black flex items-center justify-between cursor-pointer shadow-sm"
              >
                <span>⚙️ Abrir Acessibilidade do Android</span>
                <ChevronRight className="h-4 w-4 text-[#090D16]" />
              </button>
              <p
                style={{
                  color: themeMode === 'DAYLIGHT' ? '#334155' : '#CBD5E1',
                }}
                className="text-[11px] font-bold leading-snug"
              >
                💡 <strong>No Samsung:</strong> Definições &rarr; Aplicações
                &rarr; Delivery Buddy &rarr; 3 pontos no topo &rarr;{' '}
                <span className="text-[#00E5FF] font-black">
                  Permitir definições restritas
                </span>
                .
              </p>
            </div>

            {/* 2. Platform Selector & Pre-Trained / Self-Learned Templates */}
            <div
              style={{
                backgroundColor:
                  themeMode === 'DAYLIGHT' ? '#F8FAFC' : '#090D16',
                borderColor: 'rgba(0, 229, 255, 0.35)',
              }}
              className="rounded-2xl border p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-[#00E5FF]">
                  🧠 Ensinar Tela / Calibrar Botões por App
                </span>
                <span className="text-[10px] font-extrabold text-emerald-400">
                  {learnedTemplatesState[calibPlatform]?.learnedSamplesCount ||
                    1}{' '}
                  amostras
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {(['Glovo', 'Uber Eats', 'Bolt Food'] as PlatformName[]).map(
                  (plat) => {
                    const active = calibPlatform === plat;
                    return (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => setCalibPlatform(plat)}
                        style={{
                          backgroundColor: active ? '#00E5FF' : '#111827',
                          borderColor: active ? '#00E5FF' : '#27272a',
                          color: active ? '#090D16' : '#E2E8F0',
                        }}
                        className="rounded-xl border py-1.5 px-2 text-xs font-black cursor-pointer transition"
                      >
                        {plat}
                      </button>
                    );
                  }
                )}
              </div>

              <div className="space-y-2 pt-1">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>
                      Posição Vertical Botão &ldquo;Aceitar&rdquo; (Auto-Click):
                    </span>
                    <span className="text-[#00E5FF] font-black">
                      {Math.round(calibAcceptYRatio * 100)}% do ecrã
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.65"
                    max="0.96"
                    step="0.01"
                    value={calibAcceptYRatio}
                    onChange={(e) =>
                      setCalibAcceptYRatio(Number(e.target.value))
                    }
                    className="w-full accent-[#00E5FF] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>
                      Posição Vertical Botão &ldquo;Recusar&rdquo; (Auto-Click):
                    </span>
                    <span className="text-rose-400 font-black">
                      {Math.round(calibRejectYRatio * 100)}% do ecrã
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.06"
                    max="0.45"
                    step="0.01"
                    value={calibRejectYRatio}
                    onChange={(e) =>
                      setCalibRejectYRatio(Number(e.target.value))
                    }
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const updated = learnFromScannedOrderSample({
                      platform: calibPlatform,
                      grossEur: 6.4,
                      distanceKm: 2.3,
                      estimatedMinutes: 14,
                      acceptButtonXY: { xRatio: 0.5, yRatio: calibAcceptYRatio },
                      rejectButtonXY: {
                        xRatio: 0.84,
                        yRatio: calibRejectYRatio,
                      },
                    });
                    setLearnedTemplatesState(updated);
                    if (updated[calibPlatform]) {
                      void publishLearnedOrderTemplateToCloud(
                        updated[calibPlatform]
                      );
                    }
                    setCalibStatusMsg(
                      `✅ Calibração de ${calibPlatform} guardada e sincronizada na Cloud!`
                    );
                  }}
                  className="w-full rounded-xl border border-[#00E5FF] bg-[#00E5FF]/15 text-[#00E5FF] py-2 text-xs font-black cursor-pointer"
                >
                  💾 Guardar Calibração de {calibPlatform} na Cloud
                </button>
              </div>
            </div>

            {/* 3. Test Real-Time Order Screen Reader & Traffic-Light Verdict */}
            <button
              type="button"
              onClick={() => {
                triggerAutoDetectedOffer(6.8, 2.4, calibPlatform);
                setIsAccessibilityDiagnosticOpen(false);
              }}
              className="w-full rounded-2xl border-2 border-emerald-400 bg-emerald-500/20 text-emerald-300 py-2.5 px-3 text-xs font-black cursor-pointer text-center"
            >
              ⚡ Testar Leitura &amp; Veredito Semáforo (🟢 ACEITAR / 🟡 / 🔴)
            </button>

            {calibStatusMsg && (
              <p className="text-[11px] font-extrabold text-[#00E5FF] text-center">
                {calibStatusMsg}
              </p>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

/**
 * Full-Screen External Chrome Gallery Picker & Cloud Sync Bridge (`?upload_mascot=1&sync_id=...`)
 * Works in Chrome where `<input type="file">` always opens the native Android Gallery,
 * slices the 3-pose mascot image, and syncs it in real time to the installed Delivery Buddy app!
 */
export const ChromeMascotGalleryBridgeView: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [slicedPreview, setSlicedPreview] = useState<BuddyMascotImagesSet>(
    DEFAULT_BUILTIN_MASCOT_IMAGES
  );
  const [statusMessage, setStatusMessage] = useState<string>(
    'Toque no botão verde abaixo para escolher a imagem das 3 Poses na Galeria do telemóvel.'
  );
  const [isSyncedSuccess, setIsSyncedSuccess] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const searchParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const syncId = searchParams.get('sync_id') || 'amarante_default';
  const sbUrl = searchParams.get('sb_url') || '';
  const sbKey = searchParams.get('sb_key') || '';

  const processAndSyncSlicedImages = async (sliced: BuddyMascotImagesSet) => {
    setSlicedPreview(sliced);
    setStatusMessage(
      '⏳ A enviar as 3 poses em tempo real para a App Delivery Buddy...'
    );
    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(
          serializeMascotImagesForClipboard(sliced)
        );
      }
    } catch {
      // ignore clipboard error
    }

    const syncedOk = await publishMascotImagesToCloudBridge(sliced, syncId, {
      supabaseUrl: sbUrl,
      supabaseAnonKey: sbKey,
    });
    setIsSyncedSuccess(true);
    setStatusMessage(
      syncedOk
        ? '✅ 3 Poses Recortadas e Sincronizadas com Sucesso! Pode voltar à App Delivery Buddy agora (já estão aplicadas).'
        : '✅ 3 Poses Recortadas e Copiadas! Volte à App Delivery Buddy (sincronização pronta).'
    );
  };

  return (
    <div
      style={{ backgroundColor: '#020617', color: '#f8fafc' }}
      className="min-h-screen w-full flex flex-col items-center justify-center p-4"
    >
      <div
        style={{ backgroundColor: '#0f172a', borderColor: '#10b981' }}
        className="w-full max-w-md rounded-3xl border-2 p-5 space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-sm font-black text-emerald-400 block">
              🤖 Delivery Buddy — Galeria &amp; Sincronização
            </span>
            <span className="text-[11px] text-slate-400 block">
              Ponte de Galeria Chrome → App Instalada (ID: {syncId})
            </span>
          </div>
          <a
            href="https://iokmoreira.github.io/Delivery-buddy/"
            className="rounded-xl bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-200 no-underline"
          >
            Abrir App Web
          </a>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setIsProcessing(true);
            try {
              setStatusMessage('✂️ A recortar as 3 poses do Robô Buddy...');
              const sliced = await sliceThreePoseMascotSheetFile(file);
              await processAndSyncSlicedImages(sliced);
            } catch {
              setStatusMessage('❌ Erro ao processar a imagem selecionada.');
            } finally {
              setIsProcessing(false);
              e.target.value = '';
            }
          }}
        />

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => fileInputRef.current?.click()}
          style={{ backgroundColor: '#059669', color: '#ffffff' }}
          className="w-full rounded-2xl py-4 px-4 text-base font-black shadow-lg cursor-pointer flex items-center justify-center gap-2 active:scale-98 transition"
        >
          <span>🖼️ Selecionar Imagem das 3 Poses na Galeria</span>
        </button>

        <div
          style={{
            backgroundColor: isSyncedSuccess ? '#064e3b' : '#1e293b',
            borderColor: isSyncedSuccess ? '#34d399' : '#334155',
            color: '#ffffff',
          }}
          className="rounded-2xl border p-3 text-xs font-extrabold text-center leading-relaxed"
        >
          {statusMessage}
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="rounded-2xl bg-slate-950 border border-emerald-500/50 p-2.5 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-emerald-400 bg-slate-900 mb-1.5">
              <img
                src={slicedPreview.mascotActive}
                alt="Pose 1 Ativo"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-[11px] font-black text-emerald-300">
              1. Ativo 👍
            </span>
            <span className="text-[9px] text-slate-400">🟢 Online</span>
          </div>

          <div className="rounded-2xl bg-slate-950 border border-slate-500/50 p-2.5 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-slate-400 bg-slate-900 mb-1.5">
              <img
                src={slicedPreview.mascotInactive}
                alt="Pose 2 Inativo"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-[11px] font-black text-slate-200">
              2. Inativo
            </span>
            <span className="text-[9px] text-slate-400">⚪ Pausa</span>
          </div>

          <div className="rounded-2xl bg-slate-950 border border-amber-500/50 p-2.5 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-amber-400 bg-slate-900 mb-1.5">
              <img
                src={slicedPreview.mascotDelivery}
                alt="Pose 3 Em Entrega"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-[11px] font-black text-amber-300">
              3. Entrega 🚀
            </span>
            <span className="text-[9px] text-slate-400">Jato DB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
