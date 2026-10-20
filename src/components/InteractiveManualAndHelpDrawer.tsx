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
    <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative h-12 w-12 rounded-full overflow-hidden bg-zinc-900 border-2 border-emerald-500/70 flex items-center justify-center shrink-0 shadow-md">
            {compressedPreviewUrl ? (
              <img
                src={compressedPreviewUrl}
                alt={courierName}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <span className="text-sm font-black text-emerald-300">
                {initials}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-extrabold text-zinc-100 truncate">
              Foto de Perfil (Opcional)
            </span>
            <span className="block text-[10px] text-zinc-400">
              {compressedPreviewUrl
                ? 'Foto pronta para o teu perfil'
                : 'Aparece no teu ícone em Amarante'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-3 py-1.5 text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
          >
            <Camera className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>📷 Escolher Foto (Opcional)</span>
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
            className="rounded-xl bg-zinc-900 border border-dashed border-emerald-500/40 px-2.5 py-1.5 text-[10px] font-bold text-emerald-300 cursor-text outline-none focus:border-emerald-400"
          >
            📋 Colar Foto
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
              className="rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-rose-400 p-1.5 cursor-pointer transition"
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
        <span className="text-[10px] font-semibold text-emerald-400">
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
              className={`rounded-xl py-2.5 px-2 text-xs font-extrabold flex items-center justify-center gap-1.5 border transition cursor-pointer whitespace-nowrap ${
                isChecked
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
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
  | 'GUIA_RAPIDO'
  | 'COMANDOS_VOZ'
  | 'FINANCAS_CAIXA'
  | 'MANUAL_ADMIN';

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
    id: 'guia-scanner',
    tab: 'GUIA_RAPIDO',
    badge: '1. INÍCIO (SCANNER)',
    title: 'Scanner de Lucro Real, Desvio de KM (±45%) e Divisão de Peso',
    summary:
      'Audita em milissegundos se uma oferta da Uber Eats, Glovo ou Bolt Food dá lucro líquido real após combustível, desgaste, impostos e retorno.',
    bullets: [
      'Semáforo instantâneo: ACEITAR (Verde), AVALIAR (Âmbar) ou RECUSAR (Vermelho) segundo os seus critérios €/km e €/hora.',
      'Auditoria de Desvio de KM: Compara os KM anunciados pela plataforma com a distância real de estrada. Se exceder o limiar (±45%), abre popup de voz e arquiva prova legal.',
      'Auditoria de Peso (>10kg / >20kg): Deteta garrafões de 5L/6L e sacos pesados, gerando mensagem pronta para exigir Divisão de Pedido com 2.º estafeta no Suporte.',
    ],
  },
  {
    id: 'guia-mapa',
    tab: 'GUIA_RAPIDO',
    badge: '2. MAPA (AMARANTE 60%)',
    title: 'Mapa em Tempo Real (60% Ecrã), Pins de Colegas e Projeção Horária',
    summary:
      'Registo rápido em 1 clique com GPS em tempo real, pins de colegas online e histórico de mercado por hora.',
    bullets: [
      'O seu pino aparece ao vivo com foto de perfil Zero-AI (120x120px) e anel verde pulsante (Disponível) ou âmbar (Em Entrega).',
      'Seletor de Projeção Horária (Agora vs 12h, 13h, 19h, 20h, 21h, 22h): Combina procura histórica em Amarante com o n.º real de estafetas registados no Supabase.',
    ],
  },
  {
    id: 'guia-buddys',
    tab: 'GUIA_RAPIDO',
    badge: '3. BUDDYS & SOS',
    title: 'Rede de Estafetas, Walkie-Talkie Mãos-Livres, Encontros e Botão SOS',
    summary:
      'Comunicação direta entre estafetas da zona, alertas de trânsito/espera e botão de emergência SOS.',
    bullets: [
      'Walkie-Talkie e Chat da Zona sincronizados via Supabase Realtime (`buddy_messages`).',
      'Agendar Ponto de Encontro (Café / Descanso / Carregamento) visível para colegas próximos.',
      'Botão SOS de Emergência: Partilha coordenadas GPS exatas no canal da zona e aciona contactos de emergência.',
    ],
  },
  {
    id: 'guia-ajustes-provas',
    tab: 'GUIA_RAPIDO',
    badge: '4. DEFESA LEGAL & PERFIL',
    title: 'Arquivo de Provas (Dossiê Legal), Plataformas Ativas e WakeLock',
    summary:
      'Personalize as plataformas em que trabalha, mantenha o ecrã sempre ligado na mota e exporte provas de discrepâncias.',
    bullets: [
      'Seletor de Plataformas Ativas (Uber Eats, Glovo, Bolt Food): Oculta automaticamente as plataformas que não usa em todas as abas para ganhar espaço no ecrã.',
      'Foto de Perfil Circular Zero-AI: Recorte e compressão 120x120px no próprio telemóvel (0 custo de API).',
      'Manter Ecrã Ligado na Mota (WakeLock): Impede o bloqueio do ecrã durante o turno ativo.',
    ],
  },
  {
    id: 'financas-metas',
    tab: 'FINANCAS_CAIXA',
    badge: 'METAS & EFICIÊNCIA',
    title: 'Meta Diária, Semanal, Mensal e Matriz Comparativa (€/h e €/km)',
    summary:
      'Acompanhe a evolução do lucro líquido em tempo real e compare qual plataforma rende mais na sua zona.',
    bullets: [
      'Barras de progresso Diária, Semanal e Mensal com cálculo automático do valor restante.',
      'Matriz de Eficiência Real: Compara €/Hora Bruto, €/KM e Tempo Médio por entrega nas suas plataformas ativas.',
      'Se trabalhar apenas numa única plataforma, a aba "Global (Cruzado)" é ocultada para maximizar a leitura.',
    ],
  },
  {
    id: 'financas-caixa',
    tab: 'FINANCAS_CAIXA',
    badge: 'CAIXA & ADIANTAMENTOS',
    title: 'Reconciliação de Dinheiro na Mão (Glovo/Uber) vs Transferência Bancária',
    summary:
      'Nunca mais seja surpreendido por descontos de dinheiro recebido em espécie no fecho semanal.',
    bullets: [
      'Fórmula de Fecho: Ganho Bruto Total − Dinheiro Já Recebido na Mão (Cash) − Taxas de App = Valor Exato a Receber no Banco.',
      'Calendário de Pagamentos: Uber Eats (Terça-feira), Bolt Food (Quarta-feira) e Glovo (Quinta-feira).',
      'Registo Rápido em 1 Clique (+ Entrega Manual, + Gorjeta Digital ou + Recebi Dinheiro na Mão) com exportação CSV.',
    ],
  },
  {
    id: 'admin-motor-ia',
    tab: 'MANUAL_ADMIN',
    badge: 'MOTOR GEMINI & SKILLS',
    title: 'Motor Híbrido IA + Regra 0-Custo por Proporção de Ecrã (20:9 / 19.5:9)',
    summary:
      'Como o proprietário gere a chave Gemini Pro e reutiliza Skills aprendidas sem gastar tokens repetidos.',
    bullets: [
      'Quando um estafeta ensina um botão ("Buddy ensinar comando"), o sistema grava as coordenadas relativas (%X, %Y) associadas ao modelo e proporção de ecrã (ex.: 20:9).',
      'Todos os outros estafetas com ecrã 20:9 executam a mesma ação a 0 custo de API (100% determinístico).',
      'Interruptor Global do Motor IA: Híbrido (Recomendado), Sempre Gemini Live ou 100% Local Offline.',
    ],
  },
  {
    id: 'admin-supabase-kyc',
    tab: 'MANUAL_ADMIN',
    badge: 'SUPABASE & KYC B2B',
    title: 'Banco de Dados Supabase Realtime, Controlo KYC e Patrocínios B2B',
    summary:
      'Configuração em 1 clique do esquema SQL, aprovação/suspensão de estafetas e receitas de oficinas parceiras.',
    bullets: [
      'Botão "📋 Copiar Script SQL das Tabelas": Inclui tabelas `couriers`, `buddy_messages`, `admin_broadcasts`, `shared_learned_skills` e `hourly_market_snapshots` com migrações idempotentes.',
      'Aba Estafetas (KYC): Verifica estafetas registados ao vivo no mapa, aprova contas ou suspende infratores.',
      'Aba Patrocínios B2B: Gere parceiros locais (oficinas, seguros, pneus) exibidos aos estafetas.',
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
    action: 'Muda para o Mapa 60% e anuncia quantos estafetas estão online na zona',
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

const COMPLETE_MARKDOWN_MANUAL_EXPORT = `# MANUAL OFICIAL COMPLETO — DELIVERY BUDDY (AMARANTE & PORTUGAL)
**Versão de Produção:** 2026.10 • **Idioma:** Português (pt-PT / Voz pt-BR)
**Arquitetura:** Copiloto Financeiro, Auditor de Rotas/Peso, Rede de Estafetas em Tempo Real e Consola de Administração.

---

## PARTE 1 — GUIA PRÁTICO DO ESTAFETA

### 1. Registo Rápido em 1 Clique, Foto Zero-AI e Plataformas Ativas
- Ao abrir o aplicativo pela primeira vez (ou clicando em **"Editar Meu Perfil / Registo"** no topo de \`Mapa\`, \`Buddys\` ou \`Ajustes\`), configure:
  1. **Nome / Apelido no Mapa** (ex.: \`Caio M.\`)
  2. **Foto de Perfil Circular Zero-AI (\`120x120px\`):** Toque em **"📷 Importar / Escolher Foto de Perfil"**, ajuste o zoom/posição e guarde. O recorte e compressão são feitos 100% no telemóvel (0 custo de API).
  3. **Plataformas em que Trabalhas (\`Uber Eats\`, \`Glovo\`, \`Bolt Food\`):** Desmarque as plataformas que não utiliza. O aplicativo oculta automaticamente as plataformas desmarcadas de todas as tabelas, filtros e calendários para dar mais espaço visual.
  4. **Veículo e Zona Base (Amarante 25km).**

### 2. Scanner de Lucro Real, Desvio de KM e Divisão de Peso (\`Início\`)
- **Semáforo de Rentabilidade:** Calcula o Lucro Líquido Real descontando combustível/energia, desgaste por km, reserva fiscal (Segurança Social/IRS) e distância de retorno.
- **Auditoria de Desvio de Rota (±45%):** Compara os KM anunciados pela plataforma com a rota real. Quando o desvio ultrapassa o seu limite configurado em \`Ajustes\`, dispara um alerta visual + voz e guarda a evidência no **Arquivo de Provas**.
- **Divisão de Pedidos Pesados (>10 kg / >20 kg):** Selecionando itens pesados (ex.: garrafões de água 5L/6L), o Delivery Buddy gera automaticamente a mensagem formal para colar no chat do Suporte exigindo um **2.º estafeta (Divisão de Pedido)** ou taxa extra de peso.

### 3. Gestão de Metas, Eficiência €/h e Dinheiro na Mão (\`Finanças\`)
- **Estatísticas & Metas:** Defina e acompanhe a sua Meta Diária, Semanal e Mensal. Compare a eficiência real (\`€/h\` e \`€/km\`) entre as suas plataformas ativas.
- **Reconciliação de Dinheiro na Mão (Cash vs Banco):**
  - \`Fórmula:\` **Ganho Bruto Total − Dinheiro Recebido na Mão − Taxas = Valor Líquido a Receber por Transferência Bancária**.
  - Registe entregas manuais, gorjetas e pagamentos recebidos em numerário em 1 clique e exporte o fecho em \`.CSV\`.

### 4. Mapa de Amarante em Tempo Real (60% Ecrã) & Projeções Horárias (\`Mapa\`)
- **Presença GPS Real:** O seu pino aparece ao vivo no mapa de Amarante com a sua foto e anel verde (\`Disponível\`) ou âmbar (\`Em Entrega\`), juntamente com todos os colegas ligados ao Supabase.
- **Seletor de Projeção Horária (\`Agora\` vs \`12h\`, \`13h\`, \`19h\`, \`20h\`, \`21h\`, \`22h\`):** Consulta a relação entre estafetas online e restaurantes quentes por faixa horária para decidir as melhores horas de turno.

### 5. Rede de Estafetas, Walkie-Talkie, Encontros e SOS (\`Buddys\`)
- **Chat da Zona & Walkie-Talkie:** Mensagens instantâneas e avisos de voz entre estafetas da mesma região.
- **Pontos de Encontro:** Marque pausas para café, descanso ou carregamento elétrico.
- **Botão SOS:** Em caso de acidente ou avaria grave, transmite a sua localização GPS exata para todos os colegas próximos.

### 6. Ecrã Sempre Ligado na Mota (\`WakeLock\`) & Defesa Legal (\`Ajustes\`)
- **🔒 Manter Ecrã Ligado na Mota (\`WakeLock\`):** Ative na barra superior ou em \`Ajustes\` para impedir que o ecrã do telemóvel bloqueie durante o turno.
- **Arquivo de Provas (Dossiê Legal):** Consulte e exporte todas as discrepâncias de KM e tempos de espera abusivos registados.

---

## PARTE 2 — MANUAL DA CONSOLA DO PROPRIETÁRIO (ADMIN)

1. **Acesso:** Em \`Ajustes -> Consola do Proprietário (Admin Isolado)\` ou no botão de topo.
2. **Motor Gemini Pro / Híbrido:** Insira a sua chave Google Gemini API e escolha o modo de operação (\`Híbrido Recomendado\`, \`Sempre Gemini Live\` ou \`100% Local Offline\`).
3. **Skills Aprendidas por Proporção de Ecrã (\`20:9\`, \`19.5:9\`, \`16:9\`):** As coordenadas relativas (\`%X\`, \`%Y\`) ensinadas num telemóvel ficam imediatamente disponíveis a **0 custo de API** para todos os aparelhos com a mesma proporção de ecrã.
4. **Supabase Realtime & SQL em 1 Clique:** Na aba \`Sistema & API\`, clique em **"📋 Copiar Script SQL das Tabelas"** e execute no SQL Editor do Supabase para criar/atualizar todas as tabelas e colunas (\`avatar_url\`, \`active_platforms\`, \`hourly_market_snapshots\`).
5. **Controlo KYC, Comunicados e Patrocínios B2B:** Aprove estafetas reais registados no mapa, envie alertas globais para a frota e gira patrocínios de oficinas e parceiros.

---

## PARTE 3 — TABELA COMPLETA DE COMANDOS DE VOZ (PT-BR)

| Comando de Voz ("Buddy...") | Contexto | Ação Executada | Custo API |
| :--- | :--- | :--- | :--- |
| **"Buddy aceitar"** | Início (Scanner) | Aceita a oferta auditada e inicia rota GPS | 0 Tokens |
| **"Buddy recusar"** | Início (Scanner) | Recusa a oferta abaixo do mínimo configurado | 0 Tokens |
| **"Buddy dividir pedido"** | Início / Suporte | Gera e copia mensagem exigindo 2.º estafeta (>10kg) | 0 Tokens |
| **"Buddy suporte atraso"** | Voz & Suporte | Copia mensagem formal de atraso no restaurante | 0 Tokens |
| **"Buddy cliente ausente"** | Voz & Suporte | Aciona protocolo e texto de cliente ausente | 0 Tokens |
| **"Buddy ensinar comando"** | Global | Abre calibrador visual %X/%Y para gravar novo botão | 0 Tokens |
| **"Buddy quanto falta para a meta"** | Finanças | Anuncia por voz o lucro atual e o valor restante da meta | 0 Tokens |
| **"Buddy registar gorjeta"** | Finanças | Abre o registo rápido de gorjeta / dinheiro na mão | 0 Tokens |
| **"Buddy abrir mapa"** | Mapa | Abre o Mapa 60% de Amarante e lê estafetas online | 0 Tokens |
| **"Buddy alerta trânsito"** | Mapa / Buddys | Regista perigo na via para os colegas da zona | 0 Tokens |
| **"Buddy SOS"** | Emergência | Envia alerta SOS com coordenadas GPS na rede Buddys | 0 Tokens |
`;

const OfficialManualAndCommandsModal: React.FC<{
  onClose: () => void;
  onSpeakPt: (text: string) => void;
}> = ({ onClose, onSpeakPt }) => {
  const [activeManualTab, setActiveManualTab] =
    useState<OfficialManualTabId>('GUIA_RAPIDO');
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

  const handleDownloadMarkdownManual = () => {
    const blob = new Blob([COMPLETE_MARKDOWN_MANUAL_EXPORT], {
      type: 'text/markdown;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MANUAL_DELIVERY_BUDDY.md';
    a.click();
    URL.revokeObjectURL(url);
    setDownloadFeedback('MANUAL_DELIVERY_BUDDY.md transferido com sucesso!');
    setTimeout(() => setDownloadFeedback(null), 3500);
  };

  const handlePrintPdfManual = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Manual Oficial de Uso e Lista de Comandos Delivery Buddy"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-zinc-900 border border-indigo-500/40 p-4 space-y-3 shadow-2xl my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 block">
                DOCUMENTAÇÃO OFICIAL • PT-PT &amp; VOZ PT-BR
              </span>
              <h2 className="text-sm font-black text-zinc-100">
                📘 Manual de Uso &amp; Lista Completa de Comandos
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
            aria-label="Fechar Manual"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search & Export Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar comando de voz, caixa, peso >10kg, SQL, WakeLock..."
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-8 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadMarkdownManual}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow"
            >
              <Download className="h-3.5 w-3.5" />
              <span>⬇️ Baixar Manual Completo (.MD / Imprimir PDF)</span>
            </button>
            <button
              type="button"
              onClick={handlePrintPdfManual}
              className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-2 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              title="Imprimir ou Guardar como PDF"
            >
              <Printer className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {downloadFeedback && (
          <div className="rounded-lg bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 text-[11px] font-bold text-emerald-300 shrink-0">
            {downloadFeedback}
          </div>
        )}

        {/* 4 Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
          {(
            [
              { id: 'GUIA_RAPIDO', label: '1. Guia Rápido' },
              { id: 'COMANDOS_VOZ', label: '2. Comandos de Voz' },
              { id: 'FINANCAS_CAIXA', label: '3. Finanças & Caixa' },
              { id: 'MANUAL_ADMIN', label: '4. Manual Admin' },
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
                className={`rounded-lg py-2 px-2 text-[11px] font-extrabold transition cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
          {(activeManualTab === 'COMANDOS_VOZ' || normalizedQuery) && (
            <div className="rounded-xl bg-zinc-950/90 border border-zinc-800 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>
                    Tabela Completa de Comandos de Voz Mãos-Livres (pt-BR)
                  </span>
                </span>
                <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-300">
                  {filteredVoiceCommands.length} Comandos
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="py-1.5 pr-2 font-bold">Frase (&ldquo;Buddy...&rdquo;)</th>
                      <th className="py-1.5 px-2 font-bold">Módulo</th>
                      <th className="py-1.5 px-2 font-bold">Ação Executada</th>
                      <th className="py-1.5 pl-2 font-bold text-right">Custo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredVoiceCommands.map((cmd) => (
                      <tr key={cmd.phrase} className="hover:bg-zinc-900/60">
                        <td className="py-2 pr-2 font-bold text-emerald-300">
                          {cmd.phrase}
                        </td>
                        <td className="py-2 px-2 text-zinc-300 whitespace-nowrap">
                          {cmd.context}
                        </td>
                        <td className="py-2 px-2 text-zinc-400">{cmd.action}</td>
                        <td className="py-2 pl-2 text-right whitespace-nowrap">
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-emerald-400">
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

          {(activeManualTab !== 'COMANDOS_VOZ' || normalizedQuery) &&
            filteredSections.map((sec) => (
              <div
                key={sec.id}
                className="rounded-xl bg-zinc-950/90 border border-zinc-800 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                    {sec.badge}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onSpeakPt(`${sec.title}. ${sec.summary} ${sec.bullets.join(' ')}`)
                    }
                    className="rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="h-3 w-3 text-indigo-400" />
                    <span>Ouvir</span>
                  </button>
                </div>
                <h3 className="text-xs font-extrabold text-zinc-100">
                  {sec.title}
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {sec.summary}
                </p>
                <ul className="space-y-1 pt-1">
                  {sec.bullets.map((b, idx) => (
                    <li
                      key={idx}
                      className="text-[11px] text-zinc-300 flex items-start gap-1.5"
                    >
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800 shrink-0">
          <span className="text-[10px] text-zinc-400">
            Ficheiro raiz: <code className="text-zinc-200">MANUAL_DELIVERY_BUDDY.md</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-1.5 text-xs font-bold cursor-pointer"
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
      {/* Unified Monochromatic Slate & Light Neon Blue Quick Actions Grid */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0',
        }}
        className="rounded-2xl border p-3 shadow-xs space-y-2"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsDirectApkShareModalOpen(true)}
            style={{
              backgroundColor: '#F8FAFC',
              borderColor: '#E2E8F0',
              color: '#0F172A',
            }}
            className="w-full rounded-xl border py-2.5 px-3 text-left flex items-center justify-between gap-2.5 cursor-pointer transition hover:border-[#00E5FF]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                style={{
                  backgroundColor: 'rgba(0, 229, 255, 0.14)',
                  borderColor: 'rgba(0, 184, 212, 0.35)',
                  color: '#00838F',
                }}
                className="h-9 w-9 rounded-xl border flex items-center justify-center shrink-0"
              >
                <Download className="h-4 w-4 text-[#00B8D4]" />
              </span>
              <div className="min-w-0">
                <span className="block text-sm font-extrabold text-[#0F172A] truncate">
                  Enviar App / QR Code APK
                </span>
                <span className="block text-xs text-slate-500 truncate">
                  Partilhar instalação direta com colegas
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setIsLiveSupportModalOpen(true)}
            style={{
              backgroundColor: '#F8FAFC',
              borderColor: '#E2E8F0',
              color: '#0F172A',
            }}
            className="w-full rounded-xl border py-2.5 px-3 text-left flex items-center justify-between gap-2.5 cursor-pointer transition hover:border-[#00E5FF]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                style={{
                  backgroundColor: 'rgba(0, 229, 255, 0.14)',
                  borderColor: 'rgba(0, 184, 212, 0.35)',
                  color: '#00838F',
                }}
                className="h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 text-base"
              >
                💬
              </span>
              <div className="min-w-0">
                <span className="block text-sm font-extrabold text-[#0F172A] truncate">
                  Suporte em Tempo Real
                </span>
                <span className="block text-xs text-slate-500 truncate">
                  Linha direta com a coordenação
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          </button>
        </div>
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
      <div className="rounded-2xl bg-zinc-900/95 border border-zinc-800 overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => toggleAccordionCard('PERFIL')}
          className="w-full px-4 py-3.5 flex items-center justify-between gap-2 text-left hover:bg-zinc-800/40 transition cursor-pointer"
        >
          <span className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
            <span>👤 Meu Perfil &amp; Plataformas</span>
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-0.5 text-xs font-extrabold text-emerald-300">
              {realCourierProfile?.name || 'Estafeta'} • {activePlatforms.length} App(s)
            </span>
            <ChevronRight
              className={`h-5 w-5 text-zinc-400 transition-transform ${
                openAccordion === 'PERFIL' ? 'rotate-90' : ''
              }`}
            />
          </div>
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
      <div className="rounded-2xl bg-zinc-900/95 border border-zinc-800 overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => toggleAccordionCard('VOZ_BOLINHA')}
          className="w-full px-4 py-3.5 flex items-center justify-between gap-2 text-left hover:bg-zinc-800/40 transition cursor-pointer"
        >
          <span className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
            <span>🎙️ Voz &amp; Posição da Bolinha</span>
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span
              style={{
                backgroundColor: '#F0F9FF',
                borderColor: '#7DD3FC',
                color: '#0369A1',
              }}
              className="rounded-lg border px-2.5 py-0.5 text-xs font-extrabold"
            >
              {buddyVoiceRate.toFixed(2)}x • pt-BR
            </span>
            <ChevronRight
              className={`h-5 w-5 text-zinc-400 transition-transform ${
                openAccordion === 'VOZ_BOLINHA' ? 'rotate-90' : ''
              }`}
            />
          </div>
        </button>

        {openAccordion === 'VOZ_BOLINHA' && (
          <div className="p-3.5 pt-2 border-t border-zinc-800 space-y-3 bg-zinc-950/60">
            {/* Natural Male pt-BR Voice Engine Tuning Card */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderColor: '#E2E8F0',
              }}
              className="rounded-xl border p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-sm font-extrabold text-[#0F172A] flex items-center gap-1.5">
                    <Volume2 className="h-4 w-4 text-[#00B8D4] shrink-0" />
                    <span>
                      Velocidade da Voz (pt-BR Masculina):{' '}
                      {buddyVoiceRate.toFixed(2)}x
                    </span>
                  </span>
                  <span className="block text-xs text-slate-600">
                    Voz Ativa:{' '}
                    <strong className="text-[#0284C7]">
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
                    backgroundColor: '#0F172A',
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
                <span className="text-xs font-bold text-slate-600">1.00x</span>
                <input
                  type="range"
                  min="1.0"
                  max="1.5"
                  step="0.05"
                  value={buddyVoiceRate}
                  onChange={(e) => setBuddyVoiceRate(Number(e.target.value))}
                  aria-label="Velocidade da Voz do Buddy"
                  className="flex-1 accent-[#00B8D4] cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-600">1.50x</span>
                {Math.abs(buddyVoiceRate - 1.15) >= 0.01 && (
                  <button
                    type="button"
                    onClick={() => setBuddyVoiceRate(1.15)}
                    style={{
                      backgroundColor: '#E0F2FE',
                      borderColor: '#7DD3FC',
                      color: '#0369A1',
                    }}
                    className="rounded-lg border px-2 py-0.5 text-xs font-bold cursor-pointer"
                  >
                    Repor 1.15x
                  </button>
                )}
              </div>
            </div>

            {/* 3 Bundled 3D Poses Status Preview (Clean Light-Slate Cards + #00E5FF Active Border) */}
            <div className="grid grid-cols-3 gap-2">
              <div
                style={{
                  backgroundColor:
                    currentMascotState === 'ACTIVE' ? '#ECFEFF' : '#F8FAFC',
                  borderColor:
                    currentMascotState === 'ACTIVE' ? '#00E5FF' : '#E2E8F0',
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
                <span className="text-xs font-extrabold text-[#0F172A]">
                  1. Online
                </span>
              </div>

              <div
                style={{
                  backgroundColor:
                    currentMascotState === 'INACTIVE' ? '#ECFEFF' : '#F8FAFC',
                  borderColor:
                    currentMascotState === 'INACTIVE' ? '#00E5FF' : '#E2E8F0',
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
                <span className="text-xs font-extrabold text-[#0F172A]">
                  2. Pausa
                </span>
              </div>

              <div
                style={{
                  backgroundColor:
                    currentMascotState === 'DELIVERY' ? '#ECFEFF' : '#F8FAFC',
                  borderColor:
                    currentMascotState === 'DELIVERY' ? '#00E5FF' : '#E2E8F0',
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
                <span className="text-xs font-extrabold text-[#0F172A]">
                  3. Entrega 🚀
                </span>
              </div>
            </div>

            {/* Configurable Floating Bubble Resting Position Selector (Clean Light-Slate Cards) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-zinc-100">
                  📍 Posição de Repouso da Bolinha Flutuante
                </span>
                <span
                  style={{
                    backgroundColor: '#ECFEFF',
                    borderColor: '#00E5FF',
                    color: '#0E7490',
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
                        backgroundColor: isSelected ? '#ECFEFF' : '#F8FAFC',
                        borderColor: isSelected ? '#00E5FF' : '#E2E8F0',
                        color: '#0F172A',
                      }}
                      className="rounded-xl px-3 py-2.5 text-left border-2 transition cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span
                          style={{ color: '#0F172A' }}
                          className="block text-sm font-extrabold truncate"
                        >
                          {opt.label}
                        </span>
                        <span
                          style={{ color: '#475569' }}
                          className="block text-xs truncate"
                        >
                          {opt.shortDesc}
                        </span>
                      </div>
                      <span
                        style={{
                          backgroundColor: isSelected ? '#0F172A' : '#FFFFFF',
                          borderColor: isSelected ? '#00E5FF' : '#CBD5E1',
                          color: isSelected ? '#00E5FF' : '#64748B',
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
          ACCORDION CARD 3: 📍 CENTRO: AMARANTE (RAIO 35 KM) & FINANÇAS
          ===================================================================== */}
      <div className="rounded-2xl bg-zinc-900/95 border border-zinc-800 overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => toggleAccordionCard('CENTRO_FINANCAS')}
          className="w-full px-4 py-3.5 flex items-center justify-between gap-2 text-left hover:bg-zinc-800/40 transition cursor-pointer"
        >
          <span className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
            <span>📍 Centro: Amarante (Raio 35 km) &amp; Finanças</span>
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-0.5 text-xs font-extrabold text-emerald-300">
              Ativo • 35 km
            </span>
            <ChevronRight
              className={`h-5 w-5 text-zinc-400 transition-transform ${
                openAccordion === 'CENTRO_FINANCAS' ? 'rotate-90' : ''
              }`}
            />
          </div>
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
      <div className="rounded-2xl bg-zinc-900/95 border border-zinc-800 overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => toggleAccordionCard('SEGURANCA_SISTEMA')}
          className="w-full px-4 py-3.5 flex items-center justify-between gap-2 text-left hover:bg-zinc-800/40 transition cursor-pointer"
        >
          <span className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
            <span>🛡️ Segurança de Rua &amp; Sistema</span>
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-lg bg-zinc-800 px-2.5 py-0.5 text-xs font-extrabold text-emerald-300">
              {batteryLevelPct}% {isBatteryCharging ? '⚡' : '🔋'}
            </span>
            <ChevronRight
              className={`h-5 w-5 text-zinc-400 transition-transform ${
                openAccordion === 'SEGURANCA_SISTEMA' ? 'rotate-90' : ''
              }`}
            />
          </div>
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
                  backgroundColor: '#F8FAFC',
                  borderColor: '#E2E8F0',
                  color: '#0F172A',
                }}
                className="rounded-xl border py-2.5 px-3 text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition hover:border-[#00E5FF]"
              >
                <BookOpen className="h-4 w-4 text-[#00B8D4] shrink-0" />
                <span>Manual de Uso &amp; Comandos</span>
              </button>

              <button
                type="button"
                onClick={toggleWakeLock}
                style={{
                  backgroundColor: wakeLockEnabled ? '#ECFEFF' : '#F8FAFC',
                  borderColor: wakeLockEnabled ? '#00E5FF' : '#E2E8F0',
                  color: '#0F172A',
                }}
                className="rounded-xl py-2.5 px-3 text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition border"
              >
                {wakeLockEnabled ? (
                  <Lock className="h-4 w-4 text-[#00B8D4] shrink-0" />
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

      {/* Bottom Secondary Outlined Button: Terminar Sessão / Trocar Conta */}
      <div className="pt-1">
        <button
          type="button"
          onClick={logoutSession}
          style={{
            backgroundColor: '#F8FAFC',
            borderColor: '#CBD5E1',
            color: '#334155',
          }}
          className="w-full rounded-xl border py-2.5 px-4 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
          <span>Terminar Sessão / Trocar Conta</span>
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
