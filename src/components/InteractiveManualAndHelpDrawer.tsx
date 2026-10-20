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
import { RealTimeSupportPanel } from './AuthAndVerificationGate';

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
              Foto de Perfil (Opcional)
            </span>
            <span className="block text-[10px] text-zinc-400 truncate">
              {compressedPreviewUrl
                ? `Foto pronta ${compressedSizeKb ? `(${compressedSizeKb})` : ''}`
                : 'Aparece no teu ícone em Amarante'}
            </span>
          </div>
        </div>

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

      {/* Responsive 2-Column Grid for Escolher Foto & Colar Foto (100% Inside Card) */}
      <div className="grid grid-cols-2 gap-2 w-full">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-2.5 py-2 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm truncate"
        >
          <Camera className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" />
          <span className="truncate">📷 Escolher Foto</span>
        </button>
        <div
          contentEditable
          suppressContentEditableWarning
          onPaste={handlePasteAvatar}
          onInput={(e) => {
            const el = e.currentTarget;
            const imgEl = el.querySelector('img');
            if (imgEl && imgEl.src) {
              loadAvatarFromDataUrl(imgEl.src);
            }
            el.innerHTML = '';
          }}
          className="w-full rounded-xl bg-zinc-900 border border-dashed border-[#00E5FF]/50 px-2.5 py-2 text-xs font-extrabold text-[#00E5FF] flex items-center justify-center cursor-text outline-none focus:border-[#00E5FF] truncate text-center"
        >
          📋 Colar Foto
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
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Manual e Dossiê Legal, Burocrático e RGPD Delivery Buddy"
    >
      <div
        style={{
          backgroundColor: surfaceBg,
          borderColor: '#00E5FF',
          color: primaryText,
        }}
        className="w-full max-w-2xl rounded-2xl border-2 p-4 space-y-3 shadow-[0_0_35px_rgba(0,229,255,0.22)] my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div
          style={{ borderColor: borderCol }}
          className="flex items-start justify-between gap-2 border-b pb-2.5 shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{
                backgroundColor: '#0B0F17',
                borderColor: '#00E5FF',
                color: '#00E5FF',
              }}
              className="h-9 w-9 rounded-xl border flex items-center justify-center shrink-0"
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span
                style={{ color: isDaylight ? '#00838F' : '#00E5FF' }}
                className="text-[10px] font-extrabold uppercase tracking-wider block"
              >
                DOCUMENTAÇÃO OFICIAL &amp; CONFORMIDADE UE / PORTUGAL
              </span>
              <h2
                style={{ color: primaryText }}
                className="text-sm sm:text-base font-black"
              >
                📘 Manual &amp; Dossiê Legal, Burocrático e RGPD
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#0B0F17',
              borderColor: '#00E5FF',
              color: '#00E5FF',
            }}
            className="rounded-xl border px-2.5 py-1.5 text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
            aria-label="Fechar Manual"
          >
            <X className="h-4 w-4" />
            <span>Fechar</span>
          </button>
        </div>

        {/* Search & Download Complete Dossier Bar */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="relative">
            <Search
              style={{ color: secondaryText }}
              className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar RGPD, AT, IVA Art. 53, INPI, Libras, comandos de voz..."
              style={{
                backgroundColor: innerBg,
                borderColor: borderCol,
                color: primaryText,
              }}
              className="w-full rounded-xl border pl-8 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-[#00E5FF]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleDownloadManualFile('txt')}
              style={{
                backgroundColor: '#0B0F17',
                borderColor: '#00E5FF',
                color: '#00E5FF',
              }}
              className="flex-1 rounded-xl border px-3 py-2 text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer transition hover:opacity-95 shadow-xs"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span>
                📥 Baixar Manual &amp; Dossiê Completo (.TXT / .MD / Imprimir PDF)
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadManualFile('md')}
              style={{
                backgroundColor: cardBg,
                borderColor: borderCol,
                color: primaryText,
              }}
              className="rounded-xl border px-2.5 py-2 text-[11px] font-extrabold cursor-pointer"
              title="Transferir em formato Markdown (.MD)"
            >
              .MD
            </button>
            <button
              type="button"
              onClick={handlePrintPdfManual}
              style={{
                backgroundColor: cardBg,
                borderColor: borderCol,
                color: primaryText,
              }}
              className="rounded-xl border px-2.5 py-2 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
              title="Imprimir ou Guardar como PDF"
            >
              <Printer className="h-3.5 w-3.5 text-[#00E5FF]" />
              <span>PDF</span>
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
            className="rounded-xl border px-3 py-1.5 text-xs font-extrabold shrink-0"
          >
            ✓ {downloadFeedback}
          </div>
        )}

        {/* 3 Structured Tabs: Manual do Estafeta | Manual Executivo | Dossiê Legal, Burocrático & RGPD */}
        <div
          style={{ backgroundColor: cardBg, borderColor: borderCol }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1.5 rounded-xl border shrink-0"
        >
          {(
            [
              {
                id: 'MANUAL_ESTAFETA',
                label: '📘 Manual do Estafeta',
              },
              {
                id: 'MANUAL_EXECUTIVO',
                label: '🛡️ Manual Executivo (CEO / Admin)',
              },
              {
                id: 'DOSSIE_LEGAL_RGPD',
                label: '⚖️ Dossiê Legal, Burocrático & RGPD',
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
                className="rounded-lg border py-2 px-2.5 text-xs font-black transition cursor-pointer text-center"
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
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
                  className="rounded-lg border px-2.5 py-1 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="h-3 w-3 text-[#00E5FF]" />
                  <span>Ouvir</span>
                </button>
              </div>
              <h3
                style={{ color: primaryText }}
                className="text-xs sm:text-sm font-black"
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
                    className="text-xs flex items-start gap-1.5 leading-snug"
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
                    Tabela Completa de Comandos de Voz Mãos-Livres (pt-BR)
                  </span>
                </span>
                <span
                  style={{
                    backgroundColor: '#0B0F17',
                    borderColor: '#00E5FF',
                    color: '#00E5FF',
                  }}
                  className="rounded border px-2 py-0.5 text-[10px] font-extrabold"
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
                          style={{ color: isDaylight ? '#00838F' : '#00E5FF' }}
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

        {/* Footer */}
        <div
          style={{ borderColor: borderCol }}
          className="flex items-center justify-between pt-2 border-t shrink-0"
        >
          <span style={{ color: secondaryText }} className="text-[11px] font-bold">
            RGPD (UE 2016/679) • Lei n.º 58/2019 • DL n.º 252/94 • Lei n.º 13/2023
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#0B0F17',
              borderColor: '#00E5FF',
              color: '#00E5FF',
            }}
            className="rounded-xl border px-4 py-1.5 text-xs font-extrabold cursor-pointer"
          >
            Fechar Manual
          </button>
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
  const {
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
    triggerSimulatedCrashTest,
    batterySurvivalMode,
    toggleBatterySurvivalMode,
    batteryLevelPct,
    isBatteryCharging,
    simulateChargerUnpluggedAlert,
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
  } = useEstafetas();

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
  >('PERFIL');
  const [isLiveSupportModalOpen, setIsLiveSupportModalOpen] =
    useState<boolean>(false);
  const [isDirectApkShareModalOpen, setIsDirectApkShareModalOpen] =
    useState<boolean>(false);
  const [isHubSelectorModalOpen, setIsHubSelectorModalOpen] =
    useState<boolean>(false);
  const [isShiftDrawerOpen, setIsShiftDrawerOpen] = useState<boolean>(false);

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

  // 100% Full-Screen Sub-Page View (No Stuck Top Card)
  if (subPage !== 'LISTA_PRINCIPAL') {
    const subPageTitleMap: Record<
      Exclude<AjustesSubPageId, 'LISTA_PRINCIPAL'>,
      string
    > = {
      PERSONALIZAR_ALERTAS_VOZ: 'Personalizar Alertas (±45%), Voz & Mensagens',
      ARQUIVO_PROVAS: 'Arquivo de Provas (Dossiê Legal)',
      ACORDOS_ZONA: 'Acordos de Zona (Piso Mínimo)',
      PERIGOS_VIA: 'Perigos na Via (Amarante — Raio 35 km)',
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
            <span>Voltar a Ajustes</span>
          </button>
          <span className="text-[11px] font-bold text-zinc-300 truncate">
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

  return (
    <div className="space-y-3">
      {/* Unified Monochromatic Slate & Light Neon Blue Quick Actions Grid (Strict Light/Dark Theme) */}
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
                className="h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 text-base"
              >
                💬
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
                📘 Manual &amp; Dossiê Legal (RGPD / Finanças / AT)
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
          ACCORDION CARD 1: 👤 MEU PERFIL & PLATAFORMAS
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
              className="block text-sm sm:text-base font-extrabold truncate"
            >
              👤 Meu Perfil &amp; Plataformas
            </span>
            <span
              style={{
                color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
              }}
              className="block text-xs font-semibold truncate mt-0.5"
            >
              {realCourierProfile?.name || 'Estafeta'} •{' '}
              {activePlatforms.join(', ')}
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
          <div className="p-3.5 pt-2 border-t border-zinc-800 space-y-3 bg-zinc-950/60">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                {realCourierProfile?.isRegistered &&
                realCourierProfile.avatar_url ? (
                  <img
                    src={realCourierProfile.avatar_url}
                    alt={realCourierProfile.name}
                    className="h-10 w-10 rounded-full object-cover border-2 border-emerald-400 shrink-0"
                  />
                ) : (
                  <MapPin className="h-5 w-5 text-emerald-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="block text-sm font-extrabold text-zinc-100 truncate">
                    {realCourierProfile?.isRegistered && realCourierProfile.name
                      ? `Registado no Mapa: ${realCourierProfile.name} (${realCourierProfile.vehicle})`
                      : 'Ainda não registado no Mapa em Tempo Real'}
                  </span>
                  <span className="block text-xs text-zinc-400 truncate">
                    {realCourierProfile?.isRegistered && realCourierProfile.name
                      ? `Zona: ${realCourierProfile.zone} • GPS: ${realCourierProfile.lat.toFixed(4)}, ${realCourierProfile.lng.toFixed(4)}`
                      : 'Registe o seu perfil para aparecer no Mapa de Amarante e Buddys.'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={refreshLiveGpsPosition}
                  className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
                  <span>GPS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCourierRegistrationModalOpen(true)}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-extrabold flex items-center gap-1 cursor-pointer transition"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Editar Meu Perfil / Registo</span>
                </button>
              </div>
            </div>

            <ZeroAiProfilePhotoUploader
              avatarUrl={
                realCourierProfile?.isRegistered
                  ? realCourierProfile.avatar_url
                  : undefined
              }
              courierName={
                realCourierProfile?.isRegistered && realCourierProfile.name
                  ? realCourierProfile.name
                  : 'Novo Estafeta'
              }
              onAvatarCompressedChange={(dataUrl) => {
                void updateCourierAvatarUrl(dataUrl);
              }}
              compact
            />

            <ActivePlatformsSelectorGroup
              selectedPlatforms={activePlatforms}
              onTogglePlatform={toggleActivePlatform}
            />
          </div>
        )}
      </div>

      {/* =====================================================================
          ACCORDION CARD 2: 🎙️ VOZ & POSIÇÃO DA BOLINHA
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
              className="block text-sm sm:text-base font-extrabold truncate"
            >
              🎙️ Voz &amp; Posição da Bolinha
            </span>
            <span
              style={{
                color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
              }}
              className="block text-xs font-semibold truncate mt-0.5"
            >
              Velocidade {buddyVoiceRate.toFixed(2)}x • Voz Masculina pt-BR &amp;
              Repouso
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
                        color: themeMode === 'DAYLIGHT' ? '#00838F' : '#00E5FF',
                      }}
                    >
                      {resolvedPtBrVoiceName}
                    </strong>{' '}
                    • Pitch 0.95 • Sem Eco
                  </span>
                </div>

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

              <div className="flex items-center gap-3">
                <span
                  style={{
                    color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
                  }}
                  className="text-xs font-bold"
                >
                  1.00x
                </span>
                <input
                  type="range"
                  min="1.0"
                  max="1.5"
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
                {Math.abs(buddyVoiceRate - 1.15) >= 0.01 && (
                  <button
                    type="button"
                    onClick={() => setBuddyVoiceRate(1.15)}
                    style={{
                      backgroundColor: '#0B0F17',
                      borderColor: '#00E5FF',
                      color: '#00E5FF',
                    }}
                    className="rounded-lg border px-2 py-0.5 text-xs font-bold cursor-pointer"
                  >
                    Repor 1.15x
                  </button>
                )}
              </div>
            </div>

            {/* 3 Bundled 3D Poses Status Preview (Theme-Aware Cards + #00E5FF Active Border) */}
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

            {/* Configurable Floating Bubble Resting Position Selector (Theme-Aware Cards) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-zinc-100">
                  📍 Posição de Repouso da Bolinha Flutuante
                </span>
                <span
                  style={{
                    backgroundColor: '#0B0F17',
                    borderColor: '#00E5FF',
                    color: '#00E5FF',
                  }}
                  className="rounded-full border px-2.5 py-0.5 text-xs font-extrabold"
                >
                  {BUBBLE_RESTING_PRESET_OPTIONS.find(
                    (o) => o.id === bubbleRestingPreset
                  )?.label || 'Canto Inferior Direito'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BUBBLE_RESTING_PRESET_OPTIONS.map((opt) => {
                  const isSelected = bubbleRestingPreset === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setBubbleRestingPreset(opt.id)}
                      style={{
                        backgroundColor:
                          themeMode === 'DAYLIGHT'
                            ? isSelected
                              ? '#ECFEFF'
                              : '#FFFFFF'
                            : '#111827',
                        borderColor: isSelected
                          ? '#00E5FF'
                          : themeMode === 'DAYLIGHT'
                            ? '#E2E8F0'
                            : 'rgba(0, 229, 255, 0.25)',
                        color:
                          themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                      }}
                      className="rounded-xl px-3 py-2.5 text-left border-2 transition cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span
                          style={{
                            color:
                              themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                          }}
                          className="block text-sm font-extrabold truncate"
                        >
                          {opt.label}
                        </span>
                        <span
                          style={{
                            color:
                              themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
                          }}
                          className="block text-xs truncate"
                        >
                          {opt.shortDesc}
                        </span>
                      </div>
                      <span
                        style={{
                          backgroundColor: isSelected
                            ? '#0B0F17'
                            : 'transparent',
                          borderColor: isSelected
                            ? '#00E5FF'
                            : themeMode === 'DAYLIGHT'
                              ? '#CBD5E1'
                              : 'rgba(0, 229, 255, 0.35)',
                          color: isSelected
                            ? '#00E5FF'
                            : themeMode === 'DAYLIGHT'
                              ? '#64748B'
                              : '#94A3B8',
                        }}
                        className="h-5 w-5 rounded-full border flex items-center justify-center text-xs font-black shrink-0"
                      >
                        {isSelected ? '✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSubPage('PERSONALIZAR_ALERTAS_VOZ')}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 py-3 px-4 flex justify-between items-center text-left hover:bg-zinc-800/60 transition cursor-pointer"
            >
              <span className="text-sm font-extrabold text-zinc-100 flex items-center gap-2 min-w-0">
                <Sliders className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="truncate">
                  Personalizar Alertas (±45%), Trigger (&ldquo;
                  {voiceActivationConfig.customTriggerWord || 'Buddy'}&rdquo;) &amp; Macros
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
            </button>
          </div>
        )}
      </div>

      {/* =====================================================================
          ACCORDION CARD 3: 📍 CENTRO: AMARANTE & FINANÇAS
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
              className="block text-sm sm:text-base font-extrabold truncate"
            >
              📍 Centro: {selectedRegionName} &amp; Finanças
            </span>
            <span
              style={{
                color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
              }}
              className="block text-xs font-semibold truncate mt-0.5"
            >
              Raio operacional {mapRadiusKm} km • Metas, Custos &amp; Acordos
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
          <div className="border-t border-zinc-800 divide-y divide-zinc-800 bg-zinc-950/60">
            <button
              type="button"
              onClick={() => setIsHubSelectorModalOpen(true)}
              className="w-full py-3.5 px-4 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <span className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Compass className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>📍 Centro: Amarante (Raio 35 km)</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-1 text-sm font-bold text-emerald-300">
                  Ativo • 35 km
                </span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('financas')}
              className="w-full py-3.5 px-4 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <span className="text-sm font-bold text-zinc-100">
                💰 Metas Financeiras &amp; Caixa
              </span>
              <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calculadora')}
              className="w-full py-3.5 px-4 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <span className="text-sm font-bold text-zinc-100">
                🧮 Veículo, Custos &amp; Impostos
              </span>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 shrink-0">
                <span className="text-xs font-bold text-emerald-300">
                  &gt;= {userPrefs.minGrossOrderValueEur.toFixed(2)} €
                </span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSubPage('ACORDOS_ZONA')}
              className="w-full py-3.5 px-4 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <span className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Handshake className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>Acordos de Zona (Piso Mínimo Coletivo)</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-200">
                  {zonePacts.filter((p) => p.joinedByUser).length}/
                  {zonePacts.length} Ativos
                </span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* =====================================================================
          ACCORDION CARD 4: 🛡️ SEGURANÇA DE RUA & SISTEMA
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
              className="block text-sm sm:text-base font-extrabold truncate"
            >
              🛡️ Segurança de Rua &amp; Sistema
            </span>
            <span
              style={{
                color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
              }}
              className="block text-xs font-semibold truncate mt-0.5"
            >
              Modo Chuva, Queda 45s, SOS, Dossiê Legal &amp; Bateria (
              {batteryLevelPct}%)
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
          <div className="p-3.5 pt-2 border-t border-zinc-800 space-y-3 bg-zinc-950/60">
            {/* Street Safety & Battery Survival Modules */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-100 block truncate">
                    🌧️ Modo Chuva &amp; Luvas
                  </span>
                  <span className="text-[11px] text-zinc-400 block truncate">
                    Bloqueia toques fantasma
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleRainLock}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-extrabold cursor-pointer ${
                    rainLockActive
                      ? 'bg-sky-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {rainLockActive ? 'ATIVO' : 'Ativar'}
                </button>
              </div>

              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-100 block truncate">
                    🚨 Deteção Queda (45s)
                  </span>
                  <span className="text-[11px] text-zinc-400 block truncate">
                    Auto-SOS se imóvel
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={toggleCrashDetection}
                    className={`rounded-lg px-2 py-1 text-xs font-extrabold cursor-pointer ${
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
                    className="rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 px-2 py-1 text-xs font-bold cursor-pointer"
                  >
                    Testar
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-100 block truncate">
                    🔋 Sobrevivência &lt;20%
                  </span>
                  <span className="text-[11px] text-zinc-400 block truncate">
                    Alerta cabo desligado
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={toggleBatterySurvivalMode}
                    className={`rounded-lg px-2 py-1 text-xs font-extrabold cursor-pointer ${
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
                    className="rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-1 text-xs font-bold cursor-pointer"
                  >
                    Cabo
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => requestOrConfirmSosActivation('Acidente na Via')}
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              className="w-full rounded-xl border border-red-400 py-2.5 px-3 text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition hover:opacity-95"
            >
              <span>
                🆘 Acionar Alerta SOS de Emergência (ou diga &ldquo;Buddy SOS&rdquo;)
              </span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsOfficialManualModalOpen(true)}
                style={{
                  backgroundColor:
                    themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#111827',
                  borderColor:
                    themeMode === 'DAYLIGHT'
                      ? '#E2E8F0'
                      : 'rgba(0, 229, 255, 0.28)',
                  color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                }}
                className="rounded-xl border py-2.5 px-3 text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition hover:border-[#00E5FF]"
              >
                <BookOpen className="h-4 w-4 text-[#00E5FF] shrink-0" />
                <span>📘 Manual &amp; Dossiê Legal</span>
              </button>

              <button
                type="button"
                onClick={toggleWakeLock}
                style={{
                  backgroundColor:
                    themeMode === 'DAYLIGHT'
                      ? wakeLockEnabled
                        ? '#ECFEFF'
                        : '#FFFFFF'
                      : '#111827',
                  borderColor: wakeLockEnabled
                    ? '#00E5FF'
                    : themeMode === 'DAYLIGHT'
                      ? '#E2E8F0'
                      : 'rgba(0, 229, 255, 0.28)',
                  color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                }}
                className="rounded-xl py-2.5 px-3 text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition border"
              >
                {wakeLockEnabled ? (
                  <Lock className="h-4 w-4 text-[#00E5FF] shrink-0" />
                ) : (
                  <Unlock className="h-4 w-4 text-slate-400 shrink-0" />
                )}
                <span>
                  Ecrã Sempre Ligado: {wakeLockEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            <div className="rounded-xl bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  const winAny = window as unknown as {
                    BuddyNativeOverlay?: {
                      openAccessibilitySettings?: () => void;
                    };
                  };
                  if (
                    typeof winAny.BuddyNativeOverlay?.openAccessibilitySettings ===
                    'function'
                  ) {
                    winAny.BuddyNativeOverlay.openAccessibilitySettings();
                  } else {
                    speakTextPt(
                      'Ative o serviço Delivery Buddy nas definições de Acessibilidade do Android para leitura automática de pedidos.'
                    );
                  }
                }}
                className="w-full py-3 px-4 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <span className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Auto-Detetor de Pedidos (Acessibilidade)</span>
                </span>
                <span className="rounded bg-emerald-500/15 border border-emerald-500/35 px-2 py-0.5 text-xs font-bold text-emerald-300 shrink-0">
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
                className="w-full py-3 px-4 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <span className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-sky-400 shrink-0" />
                  <span>Atualizar App Agora (OTA)</span>
                </span>
                <span className="rounded bg-sky-500/15 border border-sky-500/35 px-2 py-0.5 text-xs font-bold text-sky-300 shrink-0">
                  Recarregar
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSubPage('PERIGOS_VIA')}
                className="w-full py-3 px-4 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <span className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-zinc-400 shrink-0" />
                  <span>Perigos na Via (Amarante — Raio 35 km)</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="rounded-lg bg-zinc-800 px-2.5 py-0.5 text-xs font-bold text-zinc-200">
                    {roadHazards.filter((h) => !h.resolved).length} Alertas
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reclamacoes')}
                className="w-full py-3 px-4 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <span className="text-sm font-bold text-zinc-100">
                  ⚠️ Rotas Proibidas &amp; Reclamações
                </span>
                <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={toggleThemeMode}
                className="w-full py-3 px-4 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <span className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  {themeMode === 'DAYLIGHT' ? (
                    <Sun className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-zinc-400" />
                  )}
                  <span>Tema Visual (Legibilidade ao Sol)</span>
                </span>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-200">
                  {themeMode === 'DAYLIGHT'
                    ? 'Modo Claro (Solar)'
                    : 'Modo Escuro Suave'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsShiftDrawerOpen((prev) => !prev)}
                className="w-full py-3 px-4 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <span className="text-sm font-bold text-zinc-100">
                  Estado do Turno (Pausa / Anónimo / Voz)
                </span>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 shrink-0">
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-200">
                    {shiftBadge}
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </div>
              </button>

              {isShiftDrawerOpen && (
                <div className="px-4 py-3 bg-zinc-950 grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={toggleAppPauseMode}
                    className={`rounded-lg py-2 px-2 text-xs font-semibold cursor-pointer ${
                      isAppPaused
                        ? 'bg-white text-zinc-950'
                        : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    {isAppPaused ? 'Retomar' : 'Pausar'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleAnonymousMode}
                    className={`rounded-lg py-2 px-2 text-xs font-semibold cursor-pointer ${
                      userPrefs.anonymousMode
                        ? 'bg-white text-zinc-950'
                        : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    Anónimo: {userPrefs.anonymousMode ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleTtsVoice}
                    className={`rounded-lg py-2 px-2 text-xs font-semibold cursor-pointer ${
                      ttsVoiceEnabled
                        ? 'bg-white text-zinc-950'
                        : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    Voz: {ttsVoiceEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-start px-1 pt-1">
              <button
                type="button"
                onClick={resetAllToSeed}
                className="text-sm text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Repor Dados</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Architectural Rectangular Card: Terminar Sessão / Trocar Conta */}
      <div className="pt-1">
        <button
          type="button"
          onClick={logoutSession}
          style={{
            backgroundColor: themeMode === 'DAYLIGHT' ? '#FFFFFF' : '#0B0F17',
            borderColor:
              themeMode === 'DAYLIGHT' ? '#CBD5E1' : 'rgba(0, 229, 255, 0.25)',
            color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
            borderRadius: '12px',
          }}
          className="w-full border px-4 py-3 text-left flex items-center justify-between gap-3 cursor-pointer transition hover:border-[#00E5FF] shadow-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
            <div className="min-w-0">
              <span
                style={{
                  color: themeMode === 'DAYLIGHT' ? '#090D16' : '#FFFFFF',
                }}
                className="block text-sm font-extrabold truncate"
              >
                Terminar Sessão / Trocar Conta
              </span>
              <span
                style={{
                  color: themeMode === 'DAYLIGHT' ? '#475569' : '#94A3B8',
                }}
                className="block text-xs font-semibold truncate"
              >
                Sair do turno atual de forma segura
              </span>
            </div>
          </div>
          <ChevronRight
            style={{
              color: themeMode === 'DAYLIGHT' ? '#090D16' : '#00E5FF',
            }}
            className="h-5 w-5 shrink-0"
          />
        </button>
      </div>

      <DirectApkShareModal
        isOpen={isDirectApkShareModalOpen}
        onClose={() => setIsDirectApkShareModalOpen(false)}
      />

      <OperationalHubSelectorModal
        isOpen={isHubSelectorModalOpen}
        onClose={() => setIsHubSelectorModalOpen(false)}
      />
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
