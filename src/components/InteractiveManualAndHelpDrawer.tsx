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
  MapRadiusSettingsSection,
  RoadHazardsSettingsSection,
  ZoneAgreementsSettingsSection,
} from './ShiftRadarModule';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      const img = new Image();
      img.onload = () => {
        loadedImageRef.current = img;
        setZoom(1.35);
        setPanX(0);
        setPanY(0);
        setIsCropping(true);
        renderCropTo120Canvas(img, 1.35, 0, 0);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
              Foto de Perfil no Mapa &amp; Buddys
            </span>
            <span className="block text-[10px] text-zinc-400">
              {compressedPreviewUrl
                ? `Auto-comprimida 120x120px (${compressedSizeKb || 'WebP/JPEG'} • 0 Custo IA)`
                : 'Recorte circular HTML5 Canvas (120x120px • 0 API Cost)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
          >
            <Camera className="h-3.5 w-3.5 shrink-0" />
            <span>📷 Importar / Escolher Foto de Perfil</span>
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
              ✂️ Ajustar Rosto no Círculo (Print Uber/Glovo ou Galeria • 0 Tokens IA)
            </span>
            <button
              type="button"
              onClick={() => setIsCropping(false)}
              className="rounded bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-extrabold cursor-pointer"
            >
              ✓ Concluir Recorte
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
    <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-extrabold text-zinc-100">
          {titleOverride ||
            'Plataformas em que Trabalhas (Oculta as restantes da tela):'}
        </span>
        <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-300">
          {selectedPlatforms.length}/3 Ativas
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
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
                  ? 'Mantém pelo menos 1 plataforma ativa'
                  : `Alternar ${platform}`
              }
              className={`rounded-xl py-2 px-1.5 text-[11px] font-extrabold flex items-center justify-center gap-1 border transition cursor-pointer whitespace-nowrap ${
                isChecked
                  ? 'bg-emerald-600/25 border-emerald-500 text-white shadow-sm'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="font-mono text-[10px]">
                {isChecked ? '[✓]' : '[ ]'}
              </span>
              <span>{platform}</span>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-zinc-400 leading-snug">
        {selectedPlatforms.length === 1 ? (
          <>
            Modo <strong className="text-emerald-400">Plataforma Única ({selectedPlatforms[0]})</strong>: Aba &ldquo;Global (Cruzado)&rdquo; e matriz comparativa ocultadas para maximizar o espaço no ecrã.
          </>
        ) : (
          <>
            Ativas: <strong className="text-zinc-200">{selectedPlatforms.join(' + ')}</strong>. Plataformas desmarcadas são ocultadas em Finanças, Início, Mapa e Buddys para ganhar espaço.
          </>
        )}
      </p>
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
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <form
            onSubmit={handleSaveCourierRegistration}
            className="rounded-2xl bg-zinc-900 border border-emerald-500/40 max-w-[430px] w-full p-4 shadow-2xl space-y-3 text-zinc-100 my-auto max-h-[94vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                  <h2 className="text-sm font-extrabold text-white">
                    {realCourierProfile?.isRegistered
                      ? 'Editar Meu Perfil / Registo'
                      : 'Bem-vindo ao Delivery Buddy — Registe o Seu Perfil no Mapa'}
                  </h2>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Sessão isolada neste telemóvel sincronizada em tempo real com{' '}
                  <code className="text-emerald-300 font-mono">
                    public.couriers
                  </code>{' '}
                  (Mapa &amp; Buddys).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCourierRegistrationModalOpen(false)}
                className="p-1 rounded-lg bg-zinc-950 text-zinc-400 hover:text-zinc-100 cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Account Switch / Fresh Device Profile Reset + Ghost Pin Cleanup */}
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={handleResetToFreshDeviceProfile}
                style={{ backgroundColor: '#d97706', color: '#ffffff' }}
                className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 border border-amber-400 text-white py-2 px-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition"
              >
                <span>🔄 Não és tu? Criar Novo Perfil neste Telemóvel</span>
              </button>
              <button
                type="button"
                onClick={() => void cleanupGhostDuplicatePinsNow()}
                style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}
                className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 py-1.5 px-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <span>🧹 Limpar Pinos Fantasmas Antigos (Ex: Caio M.)</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Zero-AI Profile Photo Uploader & Circle Cropper (0 API Cost) */}
              <ZeroAiProfilePhotoUploader
                avatarUrl={regAvatarUrl}
                courierName={regName || 'Novo Estafeta'}
                onAvatarCompressedChange={(dataUrl) => setRegAvatarUrl(dataUrl)}
                compact
              />

              {/* Active Platforms Selector (Uber Eats, Glovo, Bolt Food) */}
              <ActivePlatformsSelectorGroup
                selectedPlatforms={regPlatforms}
                onTogglePlatform={handleToggleRegPlatform}
              />

              {/* 1. Nome / Apelido no Mapa */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  1. Nome / Apelido no Mapa
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ex: João S. / Pedro M. (O teu nome)"
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* 2. Veículo */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  2. Veículo Operacional
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {VEHICLE_OPTIONS.map((v) => {
                    const active = regVehicle === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRegVehicle(v)}
                        className={`rounded-xl py-2 px-2.5 text-xs font-bold text-left border transition cursor-pointer ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                        }`}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Zona Base (Amarante 25km) */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  3. Zona Base (Amarante 25km)
                </label>
                <select
                  value={regZone}
                  onChange={(e) =>
                    setRegZone(e.target.value as AmaranteBaseZoneOption)
                  }
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                >
                  {AMARANTE_ZONE_OPTIONS.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Auto-Detected Device Signature (Read-Only Badge) */}
              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Smartphone className="h-4 w-4 text-indigo-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[10px] font-semibold text-zinc-400">
                      4. Assinatura Auto-Detetada do Dispositivo
                    </span>
                    <span className="block text-xs font-extrabold text-emerald-300 truncate">
                      {detectedOsBadge} • Tela{' '}
                      {deviceScreenProfile.screenAspectRatio} (
                      {deviceScreenProfile.deviceModel})
                    </span>
                  </div>
                </div>
                <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300 shrink-0">
                  ID:{' '}
                  {(
                    realCourierProfile?.id || getOrCreatePersistentCourierUuid()
                  ).slice(0, 8)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingReg || !regName.trim()}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white py-2.5 px-4 text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition"
            >
              <UserCheck className="h-4 w-4 shrink-0" />
              <span>
                {isSavingReg
                  ? 'A Sincronizar GPS & Supabase...'
                  : 'Entrar Online no Mapa & Guardar no Supabase'}
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
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
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
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 block">
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
                <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
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
                        <td className="py-2 pr-2 font-mono font-bold text-emerald-300">
                          {cmd.phrase}
                        </td>
                        <td className="py-2 px-2 text-zinc-300 whitespace-nowrap">
                          {cmd.context}
                        </td>
                        <td className="py-2 px-2 text-zinc-400">{cmd.action}</td>
                        <td className="py-2 pl-2 text-right whitespace-nowrap">
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
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
                  <span className="rounded-md bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300">
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
  } = useEstafetas();

  const [subPage, setSubPage] = useState<AjustesSubPageId>('LISTA_PRINCIPAL');
  const [isShiftDrawerOpen, setIsShiftDrawerOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isDeviceProfileOpen, setIsDeviceProfileOpen] =
    useState<boolean>(false);
  const [customDeviceModelDraft, setCustomDeviceModelDraft] = useState<string>(
    deviceScreenProfile.deviceModel
  );
  const [showApkBuildSteps, setShowApkBuildSteps] = useState<boolean>(true);

  const hasNativeOverlayBridge =
    typeof window !== 'undefined' &&
    Boolean(
      (
        window as unknown as {
          BuddyNativeOverlay?: unknown;
          BuddyAndroid?: unknown;
        }
      ).BuddyNativeOverlay ||
        (
          window as unknown as {
            BuddyNativeOverlay?: unknown;
            BuddyAndroid?: unknown;
          }
        ).BuddyAndroid
    );

  const handlePickPreset = (preset: ScannedOffer) => {
    selectOfferPreset(preset);
    setIsSimulatorOpen(false);
    setActiveTab('scanner');
  };

  const handlePickSubMinimum = () => {
    const subMinOffer: ScannedOffer = {
      id: `PRESET-SUB-MIN-${Date.now()}`,
      presetBadge: '6. Abaixo do Mínimo (3,00 € / 1.5 km)',
      platform: 'Uber Eats',
      grossAmountEur: 3.0,
      appAnnouncedKm: 1.5,
      estimatedMinutes: 10,
      originName: 'Padaria Portuguesa — Amarante',
      destinationName: 'Av. General Silveira',
      segmentText: 'Amarante Centro → Av. General Silveira (1.5 km)',
      cityZone: 'Amarante — São Gonçalo',
      ocrRawSnippet:
        'UBER EATS • 3,00 € • 1.5 km • Recolha: Padaria Portuguesa Amarante',
    };
    setActiveScannedOffer(subMinOffer);
    setAuditedOrderItemsPreset('NORMAL_2_4KG');
    setIsSimulatorOpen(false);
    setActiveTab('scanner');
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
      PERIGOS_VIA: 'Perigos na Via (Amarante 25 km)',
      RAIO_MAPA: 'Raio do Mapa (km) & Região',
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
      {/* High-Contrast Interactive "📲 Gerar & Baixar .APK Nativo" Guide Card */}
      <div
        style={{ backgroundColor: '#022c22', color: '#ecfdf5' }}
        className="rounded-2xl border-2 border-emerald-400/80 p-3.5 space-y-2.5 shadow-[0_0_24px_rgba(16,185,129,0.2)]"
      >
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                style={{ backgroundColor: '#10b981', color: '#022c22' }}
                className="rounded-full px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider"
              >
                {hasNativeOverlayBridge
                  ? '✓ PONTE NATIVA APK DETETADA'
                  : 'CAPACITOR + GITHUB ACTIONS APK BUILDER'}
              </span>
              <span
                style={{ backgroundColor: '#064e3b', color: '#6ee7b7' }}
                className="rounded-full border border-emerald-400/50 px-2 py-0.5 text-[9px] font-mono font-bold"
              >
                VAD 2-Estágios: {isListeningSpeechRecognition ? '🎙️ ON' : 'Pronto'}
              </span>
            </div>
            <h3
              style={{ color: '#ffffff' }}
              className="text-sm font-black tracking-tight pt-0.5"
            >
              📲 Gerar &amp; Baixar .APK Nativo (Sobreposição Uber / Glovo)
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowApkBuildSteps((prev) => !prev)}
            style={{ backgroundColor: '#065f46', color: '#d1fae5' }}
            className="rounded-lg border border-emerald-400/40 px-2.5 py-1 text-[10px] font-extrabold cursor-pointer shrink-0"
          >
            {showApkBuildSteps ? 'Ocultar Passos' : 'Ver 3 Passos'}
          </button>
        </div>

        {/* Status of Native Bridge & 1-Tap Invisible Minimized Bubble Test */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
          <div
            style={{ backgroundColor: '#064e3b' }}
            className="rounded-xl border border-emerald-500/40 px-2.5 py-2 flex items-center justify-between gap-2"
          >
            <span style={{ color: '#a7f3d0' }} className="font-semibold">
              Ponte Nativa (<code className="font-mono">BuddyNativeOverlay</code>):
            </span>
            <span
              style={{ color: hasNativeOverlayBridge ? '#34d399' : '#fde68a' }}
              className="font-mono font-black text-[10px] shrink-0"
            >
              {hasNativeOverlayBridge ? 'ATIVA (.APK)' : 'MODO WEB / OTA'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsBubbleMinimized(true);
            }}
            style={{ backgroundColor: '#10b981', color: '#022c22' }}
            className="rounded-xl border border-emerald-200 px-3 py-2 text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition"
          >
            <span>🟢 Testar Bolinha Minimizada Invisível</span>
          </button>
        </div>

        {showApkBuildSteps && (
          <div
            style={{ backgroundColor: '#042f2e', color: '#ecfdf5' }}
            className="rounded-xl border border-emerald-500/40 p-2.5 space-y-1.5 text-[11px]"
          >
            <div
              style={{ color: '#6ee7b7' }}
              className="text-[10px] font-extrabold uppercase tracking-wider"
            >
              Como Baixar o Ficheiro Delivery-Buddy-Amarante.apk (3 Passos):
            </div>
            <ol className="space-y-1 text-[11px] leading-snug list-decimal list-inside">
              <li>
                <strong style={{ color: '#ffffff' }}>GitHub Actions Cloud Builder:</strong>{' '}
                Aceda ao separador <strong>Actions &rarr; &ldquo;Build Signed Android APK (Delivery Buddy)&rdquo;</strong> no seu repositório GitHub.
              </li>
              <li>
                <strong style={{ color: '#ffffff' }}>Download Direto do Artifact:</strong>{' '}
                Abra o último build concluído e toque em{' '}
                <code
                  style={{ backgroundColor: '#064e3b', color: '#a7f3d0' }}
                  className="px-1.5 py-0.5 rounded font-mono font-bold"
                >
                  Delivery-Buddy-Amarante-APK
                </code>{' '}
                para descarregar o `.apk` assinado com `SYSTEM_ALERT_WINDOW` + Serviço de Voz em 1.º Plano.
              </li>
              <li>
                <strong style={{ color: '#ffffff' }}>Ativar Sobreposição no Android:</strong>{' '}
                Instale o `.apk`, autorize <em>&ldquo;Sobrepor a outras aplicações&rdquo;</em> e diga{' '}
                <strong>&ldquo;Buddy minimizar&rdquo;</strong> para deixar apenas a bolinha verde `DB` (`56dp`) sobre a Uber Eats / Glovo!
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Prominent 1-Click Native Fullscreen App Install Card (PWA Standalone + Capacitor APK/OTA) */}
      {isAppInstalledStandalone ? (
        <div
          style={{ backgroundColor: '#064e3b', color: '#ecfdf5' }}
          className="rounded-xl border border-emerald-500/60 px-3 py-2 flex items-center justify-between gap-2 shadow-sm"
        >
          <span
            style={{ color: '#a7f3d0' }}
            className="text-[11px] font-extrabold truncate"
          >
            ✓ App Instalada • Modo Ecrã Inteiro Ativo (OTA Capacitor)
          </span>
          <span
            style={{ backgroundColor: '#065f46', color: '#ffffff' }}
            className="rounded-md px-2 py-0.5 text-[10px] font-mono font-bold shrink-0"
          >
            100% Ecrã
          </span>
        </div>
      ) : (
        <div
          style={{ backgroundColor: '#064e3b', color: '#ecfdf5' }}
          className="rounded-xl border border-emerald-500/60 p-3 space-y-2 shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <span
                style={{ color: '#6ee7b7' }}
                className="text-[10px] font-mono font-bold uppercase tracking-wider block"
              >
                {canPromptNativeInstall
                  ? 'INSTALAÇÃO DIRETA 1-CLIQUE PRONTA • OTA CAPACITOR'
                  : 'MODO STANDALONE FULLSCREEN • ANDROID & IOS'}
              </span>
              <h3
                style={{ color: '#ffffff' }}
                className="text-xs font-black"
              >
                📲 Instalar Aplicativo Delivery Buddy (Modo Nativo Ecrã Inteiro)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                void triggerNativeAppInstallPrompt();
              }}
              style={{ backgroundColor: '#10b981', color: '#022c22' }}
              className="rounded-xl px-3 py-2 text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>📲 Instalar Aplicativo no Telemóvel</span>
            </button>
          </div>

          <p
            style={{ color: '#d1fae5' }}
            className="text-[10px] leading-relaxed"
          >
            Remove a barra de endereço do Chrome para ganhar{' '}
            <strong style={{ color: '#ffffff' }}>100% do ecrã vertical</strong> e
            calibrar os toques <code style={{ color: '#a7f3d0' }}>%X / %Y</code> com
            precisão milimétrica (com.deliverybuddy.app • Live OTA Ativo).
          </p>

          {showManualInstallGuideModal && (
            <div
              style={{ backgroundColor: '#022c22', color: '#ecfdf5' }}
              className="rounded-xl border border-emerald-400/50 p-2.5 space-y-1.5 text-[11px]"
            >
              <div className="flex items-center justify-between">
                <span style={{ color: '#6ee7b7' }} className="font-extrabold">
                  Guia Rápido (5 Segundos — Ecrã Inteiro no Android/iOS):
                </span>
                <button
                  type="button"
                  onClick={() => setShowManualInstallGuideModal(false)}
                  style={{ color: '#a7f3d0' }}
                  className="text-[10px] cursor-pointer"
                >
                  Fechar ✕
                </button>
              </div>
              <p style={{ color: '#ffffff' }} className="font-semibold">
                1. Toque nos <strong>3 pontos do Chrome ⋮</strong> (canto superior direito) &rarr; <strong>&ldquo;Instalar aplicação&rdquo;</strong> / <strong>&ldquo;Adicionar ao ecrã principal&rdquo;</strong>.
              </p>
              <p style={{ color: '#a7f3d0' }} className="text-[10px]">
                2. Abra o ícone <strong>Delivery Buddy</strong> na sua gaveta de apps: abrirá 100% em ecrã inteiro como um APK nativo e receberá todas as atualizações automaticamente via OTA.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Gemini-Style Natural Voice Engine Tuning Card (1.15x Default +15% Faster) */}
      <div className="rounded-xl bg-zinc-900/95 border border-indigo-500/35 p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <span className="text-xs font-extrabold text-zinc-100 flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>
                Velocidade da Voz: {buddyVoiceRate.toFixed(2)}x (
                {Math.abs(buddyVoiceRate - 1.15) < 0.01
                  ? '+15% Rápida — Padrão'
                  : `${Math.round((buddyVoiceRate - 1) * 100)}% Rápida`}
                )
              </span>
            </span>
            <span className="block text-[10px] text-zinc-400">
              Timbre Neural Prioritário:{' '}
              <strong className="text-indigo-300">{resolvedPtBrVoiceName}</strong>{' '}
              • Pitch 1.0 • Telemetria &lt;2s
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              speakTextPt('Uber: 6,20 limpos, 1,55 por km. Vale a pena.')
            }
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow shrink-0"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>🔊 Ouvir Voz do Buddy ({buddyVoiceRate.toFixed(2)}x)</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-400">1.00x</span>
          <input
            type="range"
            min="1.0"
            max="1.5"
            step="0.05"
            value={buddyVoiceRate}
            onChange={(e) => setBuddyVoiceRate(Number(e.target.value))}
            aria-label="Velocidade da Voz do Buddy"
            className="flex-1 accent-indigo-500 cursor-pointer"
          />
          <span className="text-[10px] font-mono text-zinc-400">1.50x</span>
          {Math.abs(buddyVoiceRate - 1.15) >= 0.01 && (
            <button
              type="button"
              onClick={() => setBuddyVoiceRate(1.15)}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-300 px-2 py-0.5 text-[10px] font-mono font-bold cursor-pointer"
            >
              Repor 1.15x
            </button>
          )}
        </div>
      </div>

      {/* 5 Street Safety & Battery Survival Modules Control Center */}
      <div className="rounded-xl bg-zinc-900/95 border border-zinc-800 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-zinc-100">
            🛡️ Proteção de Rua, Chuva, Queda &amp; Bateria
          </span>
          <span className="text-[10px] font-mono text-emerald-400">
            {batteryLevelPct}% {isBatteryCharging ? '⚡ A Carregar' : '🔋 Bateria'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {/* Module 1: Rain Lock */}
          <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-zinc-100 block truncate">
                🌧️ Modo Chuva &amp; Luvas
              </span>
              <span className="text-[9px] text-zinc-400 block truncate">
                Bloqueia toques fantasma
              </span>
            </div>
            <button
              type="button"
              onClick={toggleRainLock}
              className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-extrabold cursor-pointer ${
                rainLockActive
                  ? 'bg-sky-500 text-zinc-950'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
              }`}
            >
              {rainLockActive ? 'ATIVO' : 'Ativar'}
            </button>
          </div>

          {/* Module 2: Crash Detection Auto-SOS */}
          <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-zinc-100 block truncate">
                🚨 Deteção Queda (45s)
              </span>
              <span className="text-[9px] text-zinc-400 block truncate">
                Auto-SOS se imóvel
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={toggleCrashDetection}
                className={`rounded-lg px-2 py-1 text-[10px] font-extrabold cursor-pointer ${
                  crashDetectionEnabled
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                }`}
              >
                {crashDetectionEnabled ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={triggerSimulatedCrashTest}
                title="Testar contagem regressiva Auto-SOS 45s"
                className="rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 px-1.5 py-1 text-[9px] font-bold cursor-pointer"
              >
                Testar
              </button>
            </div>
          </div>

          {/* Module 5: Battery Survival & Charger Unplugged Alert */}
          <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-zinc-100 block truncate">
                🔋 Sobrevivência &lt;20%
              </span>
              <span className="text-[9px] text-zinc-400 block truncate">
                Alerta cabo desligado
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={toggleBatterySurvivalMode}
                className={`rounded-lg px-2 py-1 text-[10px] font-extrabold cursor-pointer ${
                  batterySurvivalMode
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                }`}
              >
                {batterySurvivalMode ? 'ON' : 'Eco'}
              </button>
              <button
                type="button"
                onClick={simulateChargerUnpluggedAlert}
                title="Testar alerta de carregador desligado na mota"
                className="rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 px-1.5 py-1 text-[9px] font-bold cursor-pointer"
              >
                Cabo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Bar: Courier Identity, Zero-AI Photo & Active Platforms Quick Access */}
      <div className="rounded-xl bg-zinc-900/95 border border-emerald-500/35 p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            {realCourierProfile?.isRegistered && realCourierProfile.avatar_url ? (
              <img
                src={realCourierProfile.avatar_url}
                alt={realCourierProfile.name}
                className="h-9 w-9 rounded-full object-cover border-2 border-emerald-400 shrink-0"
              />
            ) : (
              <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="block text-xs font-extrabold text-zinc-100 truncate">
                {realCourierProfile?.isRegistered && realCourierProfile.name
                  ? `Registado no Mapa: ${realCourierProfile.name} (${realCourierProfile.vehicle})`
                  : 'Ainda não registado no Mapa em Tempo Real'}
              </span>
              <span className="block text-[10px] text-zinc-400 truncate">
                {realCourierProfile?.isRegistered && realCourierProfile.name
                  ? `Zona: ${realCourierProfile.zone} • GPS: ${realCourierProfile.lat.toFixed(4)}, ${realCourierProfile.lng.toFixed(4)}`
                  : 'Registe o seu perfil para aparecer no Mapa de Amarante, Buddys e KYC.'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={refreshLiveGpsPosition}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <RefreshCw className="h-3 w-3 text-emerald-400" />
              <span>GPS</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCourierRegistrationModalOpen(true)}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Editar Meu Perfil / Registo</span>
            </button>
          </div>
        </div>

        {/* Quick Device Account Switch Button */}
        <button
          type="button"
          onClick={switchOrCreateNewCourierProfileOnDevice}
          style={{ backgroundColor: '#d97706', color: '#ffffff' }}
          className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 border border-amber-400 text-white py-2 px-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition"
        >
          <span>🔄 Não és tu? Criar Novo Perfil neste Telemóvel</span>
        </button>

        {/* Direct Zero-AI Photo Uploader & Active Platforms Selector in Ajustes */}
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

        {/* Quick Actions Row: Official Manual + Screen WakeLock */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsOfficialManualModalOpen(true)}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-3 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition shadow"
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span>📘 Manual de Uso &amp; Lista de Comandos</span>
          </button>

          <button
            type="button"
            onClick={toggleWakeLock}
            className={`rounded-xl py-2 px-3 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition border ${
              wakeLockEnabled
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {wakeLockEnabled ? (
              <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Unlock className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            )}
            <span>
              🔒 Manter Ecrã Ligado na Mota: {wakeLockEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Compact Android Native APK & Overlay Readiness Diagnostics Card */}
      <div className="rounded-xl bg-zinc-900/90 border border-indigo-500/30 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-zinc-100 flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Prontidão Android Nativo (.APK &amp; Sobreposição)</span>
          </span>
          <span className="rounded-md bg-emerald-500/15 border border-emerald-500/35 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
            CAPACITOR / APK READY
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
          <div className="rounded-lg bg-zinc-950/90 border border-zinc-800/80 px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-zinc-400">GPS de Alta Precisão:</span>
            <span className="font-mono font-bold text-emerald-400">Ativo</span>
          </div>
          <div className="rounded-lg bg-zinc-950/90 border border-zinc-800/80 px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-zinc-400">Microfone &amp; Voz (pt-BR):</span>
            <span className="font-mono font-bold text-emerald-400">Pronto</span>
          </div>
          <div className="rounded-lg bg-zinc-950/90 border border-zinc-800/80 px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-zinc-400">Ecrã Sempre Ligado (WakeLock):</span>
            <span className="font-mono font-bold text-emerald-300">
              {wakeLockActiveOnDevice
                ? 'Suportado / Ativo (Hardware)'
                : wakeLockEnabled
                  ? 'Suportado / Ativo'
                  : 'Em Espera (OFF)'}
            </span>
          </div>
          <div className="rounded-lg bg-zinc-950/90 border border-zinc-800/80 px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-zinc-400">Proporção de Tela Detetada:</span>
            <span className="font-mono font-bold text-indigo-300">
              {deviceScreenProfile.screenAspectRatio} (
              {deviceScreenProfile.screenWidthPx}x
              {deviceScreenProfile.screenHeightPx})
            </span>
          </div>
          <div className="sm:col-span-2 rounded-lg bg-zinc-950/90 border border-zinc-800/80 px-2.5 py-1.5 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-zinc-400">
              Ponte Nativa Overlay / Acessibilidade:
            </span>
            <span className="font-mono font-bold text-emerald-400">
              Pronta para Empacotamento Capacitor/Android
            </span>
          </div>
        </div>
      </div>

      {/* Compact Soft Clean iOS/Uber Settings List */}
      <div className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 overflow-hidden">
        {/* 0. Automatic Device Model & Screen Aspect Ratio Fingerprinting */}
        <button
          type="button"
          onClick={() => {
            setCustomDeviceModelDraft(deviceScreenProfile.deviceModel);
            setIsDeviceProfileOpen((prev) => !prev);
          }}
          className="w-full py-3 px-4 flex justify-between items-center border-b border-zinc-800 text-left hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <span className="text-xs font-semibold text-zinc-100 flex items-center gap-2 min-w-0">
            <Smartphone className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">
              Modelo de Telemóvel &amp; Proporção IA
            </span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
              {deviceScreenProfile.deviceModel} • Tela{' '}
              {deviceScreenProfile.screenAspectRatio} (
              {deviceScreenProfile.screenWidthPx}x
              {deviceScreenProfile.screenHeightPx})
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </div>
        </button>

        {isDeviceProfileOpen && (
          <div className="p-3.5 bg-zinc-950 border-b border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs font-extrabold text-zinc-100">
                  {deviceScreenProfile.deviceModel} • Tela{' '}
                  {deviceScreenProfile.screenAspectRatio} (
                  {deviceScreenProfile.screenWidthPx}x
                  {deviceScreenProfile.screenHeightPx})
                </p>
                <p className="text-[10px] text-zinc-400">
                  Skills aprendidas em ecrãs {deviceScreenProfile.screenAspectRatio}{' '}
                  ficam automaticamente{' '}
                  <strong className="text-emerald-400">
                    Compatíveis &amp; Prontas
                  </strong>{' '}
                  para todos os colegas com a mesma proporção.
                </p>
              </div>
              <button
                type="button"
                onClick={redetectDeviceScreenProfile}
                className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 text-[10px] font-bold cursor-pointer shrink-0"
              >
                Auto-Detetar Ecrã
              </button>
            </div>

            {/* Common Courier Phone Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {COMMON_COURIER_DEVICE_PRESETS.map((preset) => {
                const isSelected =
                  deviceScreenProfile.deviceModel === preset.deviceModel &&
                  deviceScreenProfile.screenAspectRatio ===
                    preset.screenAspectRatio;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setCustomDeviceModelDraft(preset.deviceModel);
                      updateDeviceScreenProfile({
                        deviceModel: preset.deviceModel,
                        screenAspectRatio: preset.screenAspectRatio,
                        screenWidthPx: preset.widthPx,
                        screenHeightPx: preset.heightPx,
                      });
                    }}
                    className={`rounded-lg py-1.5 px-2.5 text-left text-[11px] flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'bg-white text-zinc-950 font-bold'
                        : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    <span className="truncate">{preset.deviceModel}</span>
                    <span className="text-[10px] font-mono opacity-80 ml-1.5 shrink-0">
                      {preset.screenAspectRatio}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Model Name & Aspect Ratio Refinement */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
              <input
                type="text"
                value={customDeviceModelDraft}
                onChange={(e) => setCustomDeviceModelDraft(e.target.value)}
                onBlur={() => {
                  if (customDeviceModelDraft.trim()) {
                    updateDeviceScreenProfile({
                      deviceModel: customDeviceModelDraft.trim(),
                    });
                  }
                }}
                placeholder="Ex: Samsung Galaxy A54 / S23"
                className="sm:col-span-2 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none"
              />
              <select
                value={deviceScreenProfile.screenAspectRatio}
                onChange={(e) =>
                  updateDeviceScreenProfile({
                    screenAspectRatio: e.target.value as ScreenAspectRatioTag,
                  })
                }
                className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none"
              >
                <option value="20:9">Tela 20:9</option>
                <option value="19.5:9">Tela 19.5:9</option>
                <option value="19:9">Tela 19:9</option>
                <option value="16:9">Tela 16:9</option>
              </select>
            </div>

            {/* Quick Voice Skill Teaching Action */}
            <button
              type="button"
              onClick={() =>
                startVoiceTeachSkillMode('Caminho de Botões no App')
              }
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-3 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>
                🎙️ Ensinar Caminho à IA (&ldquo;Buddy, ensinar caminho&rdquo;)
              </span>
            </button>
          </div>
        )}

        {/* 1. Navigable Item: Personalizar Alertas (±45%), Voz & Trigger */}
        <button
          type="button"
          onClick={() => setSubPage('PERSONALIZAR_ALERTAS_VOZ')}
          className="w-full py-3 px-4 flex justify-between items-center border-b border-zinc-800 text-left hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <span className="text-xs font-semibold text-zinc-100 flex items-center gap-2 min-w-0">
            <Sliders className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              Voz &amp; Trigger (&ldquo;
              {voiceActivationConfig.customTriggerWord || 'Buddy'}&rdquo;),
              Alertas (±45%) &amp; Mensagens
            </span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-200">
              {alertPopupPrefs.sizeVh.replace('VH', '%')} • &ldquo;
              {voiceActivationConfig.customTriggerWord || 'Buddy'}&rdquo;
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </div>
        </button>

        {/* 2. Raio do Mapa (km) & Região Ativa (Moved from Mapa to Ajustes) */}
        <button
          type="button"
          onClick={() => setSubPage('RAIO_MAPA')}
          className="w-full py-3 px-4 flex justify-between items-center border-b border-zinc-800 text-left hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <span className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
            <Compass className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span>Raio do Mapa (km) &amp; Região</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-200">
              {selectedRegionName} • {mapRadiusKm} km
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </div>
        </button>

        {/* 4. Arquivo de Provas (Moved from Mapa to Ajustes) */}
        <button
          type="button"
          onClick={() => setSubPage('ARQUIVO_PROVAS')}
          className="w-full py-3 px-4 flex justify-between items-center border-b border-zinc-800 text-left hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <span className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
            <FileCheck2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span>Arquivo de Provas (Dossiê 5 Categorias)</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-200">
              {evidentiaryVaultRecords.length} Provas
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </div>
        </button>

        {/* 5. Acordos de Zona (Renamed from Pactos & Moved from Mapa to Ajustes) */}
        <button
          type="button"
          onClick={() => setSubPage('ACORDOS_ZONA')}
          className="w-full py-3 px-4 flex justify-between items-center border-b border-zinc-800 text-left hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <span className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
            <Handshake className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span>Acordos de Zona (Piso Mínimo Coletivo)</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-200">
              {zonePacts.filter((p) => p.joinedByUser).length}/
              {zonePacts.length} Ativos
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </div>
        </button>

        {/* 6. Perigos na Via (Moved from Mapa to Ajustes) */}
        <button
          type="button"
          onClick={() => setSubPage('PERIGOS_VIA')}
          className="w-full py-3 px-4 flex justify-between items-center border-b border-zinc-800 text-left hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <span className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span>Perigos na Via (Amarante 25 km)</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-200">
              {roadHazards.filter((h) => !h.resolved).length} Alertas
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </div>
        </button>

        {/* 7. Theme Mode Row: Modo Claro (Solar) vs Modo Escuro Suave */}
        <button
          type="button"
          onClick={toggleThemeMode}
          className="w-full py-3 px-4 flex justify-between items-center border-b border-zinc-800 text-left hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <span className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
            {themeMode === 'DAYLIGHT' ? (
              <Sun className="h-3.5 w-3.5 text-zinc-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-zinc-400" />
            )}
            <span>Tema Visual (Legibilidade ao Sol)</span>
          </span>
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-200">
            {themeMode === 'DAYLIGHT'
              ? 'Modo Claro (Solar)'
              : 'Modo Escuro Suave'}
          </span>
        </button>

        {/* 8. Estado do Turno (Pausa / Anónimo / Voz) */}
        <button
          type="button"
          onClick={() => setIsShiftDrawerOpen((prev) => !prev)}
          className="w-full py-3 px-4 flex justify-between items-center border-b border-zinc-800 text-left hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <span className="text-xs font-semibold text-zinc-100">
            Estado do Turno (Pausa / Anónimo / Voz)
          </span>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 shrink-0">
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-200">
              {shiftBadge}
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </div>
        </button>

        {isShiftDrawerOpen && (
          <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 grid grid-cols-3 gap-1.5">
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

        {/* 9. Árvore de Comandos de Voz & Calibrador %X/%Y */}
        <button
          type="button"
          onClick={() => setActiveTab('voz_suporte')}
          className="w-full py-3 px-4 flex justify-between items-center border-b border-zinc-800 text-left hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <span className="text-xs font-semibold text-zinc-100">
            Árvore de Comandos de Voz &amp; Calibrador %X/%Y
          </span>
          <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
        </button>

        {/* 10. Predefinições & Fiscal (Critérios de Aceitação, Veículo & Impostos) */}
        <button
          type="button"
          onClick={() => setActiveTab('calculadora')}
          className="w-full py-3 px-4 flex justify-between items-center border-b border-zinc-800 text-left hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <span className="text-xs font-semibold text-zinc-100">
            Predefinições &amp; Fiscal (Veículo, Critérios &amp; Impostos)
          </span>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 shrink-0">
            <span className="text-[11px] font-mono text-zinc-400">
              &gt;= {userPrefs.minGrossOrderValueEur.toFixed(2)} €
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </div>
        </button>

        {/* 11. Rotas Proibidas & Reclamações */}
        <button
          type="button"
          onClick={() => setActiveTab('reclamacoes')}
          className="w-full py-3 px-4 flex justify-between items-center border-b border-zinc-800 text-left hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <span className="text-xs font-semibold text-zinc-100">
            Rotas Proibidas &amp; Reclamações
          </span>
          <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
        </button>

        {/* 12. Testar Cenários (Simulador) */}
        <button
          type="button"
          onClick={() => setIsSimulatorOpen((prev) => !prev)}
          className="w-full py-3 px-4 flex justify-between items-center border-b border-zinc-800 text-left hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <span className="text-xs font-semibold text-zinc-100">
            Testar Cenários (Simulador de Ofertas)
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
              Plataformas Ativas ({activePlatforms.length})
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </div>
        </button>

        {isSimulatorOpen && (
          <div className="p-3.5 bg-zinc-950 border-b border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                <FlaskConical className="h-3.5 w-3.5" />
                <span>Simular Oferta no Início</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                Peso: {totalAuditedWeightKg.toFixed(1)} kg
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1">
              {SCANNER_OFFER_PRESETS.filter((preset) =>
                activePlatforms.includes(preset.platform)
              ).map((preset) => {
                const selected = activeScannedOffer.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePickPreset(preset)}
                    className={`rounded-lg py-1.5 px-2.5 text-left text-xs flex items-center justify-between cursor-pointer ${
                      selected
                        ? 'bg-white text-zinc-950 font-semibold'
                        : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <span className="truncate">{preset.presetBadge}</span>
                    <span className="text-[10px] font-mono opacity-80 ml-2 shrink-0">
                      {preset.appAnnouncedKm.toFixed(1)}km
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handlePickSubMinimum}
                className="rounded-lg py-1.5 px-2.5 text-left text-xs flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
              >
                <span>6. Corrida Curta Abaixo Mín (3,00 €)</span>
                <span className="text-[10px] font-mono text-zinc-500">
                  1.5km
                </span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => simulateSpeedAlert(68, 'URBANO')}
                className="rounded-lg py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 cursor-pointer"
              >
                Excesso 68km/h
              </button>
              <button
                type="button"
                onClick={simulatePhoneMisuseInMotion}
                className="rounded-lg py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 cursor-pointer"
              >
                Toque &gt;8s
              </button>
              <button
                type="button"
                onClick={clearSafetyAlerts}
                className="rounded-lg py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 cursor-pointer"
              >
                Normalizar
              </button>
            </div>
          </div>
        )}

        {/* 13. Guia Rápido */}
        <button
          type="button"
          onClick={openWelcomeTour}
          className="w-full py-3 px-4 flex justify-between items-center border-b border-zinc-800 text-left hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <span className="text-xs font-semibold text-zinc-100">
            Guia Rápido (4 Passos)
          </span>
          <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
        </button>

        {/* 14. Consola do Proprietário (Moved from Top Bar to Ajustes) */}
        <button
          type="button"
          onClick={() => setViewMode('PAINEL_ADMIN')}
          className="w-full py-3 px-4 flex justify-between items-center text-left hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <span className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-zinc-400" />
            <span>Consola do Proprietário (Admin Isolado)</span>
          </span>
          <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
        </button>
      </div>

      {/* Discrete Session Footer */}
      <div className="flex items-center justify-between px-1 pt-1">
        <button
          type="button"
          onClick={resetAllToSeed}
          className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Repor Dados</span>
        </button>
        <button
          type="button"
          onClick={() => {
            logoutSession();
            switchOrCreateNewCourierProfileOnDevice();
          }}
          className="rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:text-rose-200 flex items-center gap-1 cursor-pointer transition"
        >
          <LogOut className="h-3 w-3" />
          <span>Terminar Sessão / Trocar Conta</span>
        </button>
      </div>
    </div>
  );
};
