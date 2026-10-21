import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Navigation,
  MapPin,
  AlertTriangle,
  Users,
  Plus,
  X,
  Check,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapRadiusOptionKm,
  OnlineDirectoryCourier,
  RoadHazardType,
} from '../types/models';
import { useEstafetas } from '../context/EstafetasContext';
import {
  AmaranteCrosswalkPoint,
  AmaranteLearnedPath,
  computeBearingDegrees,
  computeHaversineMeters,
  deleteCrosswalkById,
  deleteLatestCrosswalk,
  fetchAmaranteCrosswalksFromOverpass,
  getAllAmaranteCrosswalks,
  getAngleDifferenceDeg,
  loadLearnedAmarantePaths,
  recordLiveSpeedSampleForDelivery,
  resolveRoadSpeedLimitAtCoords,
  saveCustomTaughtCrosswalk,
  saveLearnedAmarantePath,
} from '../utils/amaranteCopilotTelemetry';
import { playBuddyOpenChime } from '../services/voiceEngine';
import {
  CloudApprovalRequest,
  computeSameLocationPinOffset,
  loadCloudSharedState,
  publishLearnedPathToCloud,
  publishTaughtCrosswalkToCloud,
  removeCrosswalkFromCloud,
  subscribeToCloudSharedState,
} from '../services/cloudSync';

const AMARANTE_HUB_CENTER = {
  lat: 41.2704,
  lng: -8.0818,
};

const AMARANTE_35KM_RADIUS_METERS = 35000;
const AMARANTE_35KM_BOUNDS: [[number, number], [number, number]] = [
  [AMARANTE_HUB_CENTER.lat - 0.315, AMARANTE_HUB_CENTER.lng - 0.42],
  [AMARANTE_HUB_CENTER.lat + 0.315, AMARANTE_HUB_CENTER.lng + 0.42],
];

const getDistanceKmFromAmaranteHub = (lat: number, lng: number): number => {
  const dLatRad = ((lat - AMARANTE_HUB_CENTER.lat) * Math.PI) / 180;
  const dLngRad = ((lng - AMARANTE_HUB_CENTER.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
    Math.cos((AMARANTE_HUB_CENTER.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLngRad / 2) *
      Math.sin(dLngRad / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const OperationalHubSelectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const upcomingCenters = [
    { name: 'Porto & Grande Porto', radius: 'Raio 35 km' },
    { name: 'Guimarães / Braga', radius: 'Raio 35 km' },
    { name: 'Vila Real & Douro', radius: 'Raio 35 km' },
    { name: 'Viseu / Coimbra', radius: 'Raio 35 km' },
  ];

  return (
    <div
      className="fixed inset-0 z-[600] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-zinc-900 border-2 border-emerald-500/45 p-5 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 px-3 py-1 text-base font-bold text-emerald-300">
              📍 Raio Operacional Regional
            </span>
            <h3 className="text-xl font-extrabold text-white mt-2">
              Selecionar Centro Operacional (35 km)
            </h3>
            <p className="text-base font-medium text-zinc-400 mt-0.5">
              O mapa e os alertas ficam focados num raio de 35 km em redor da cidade ativa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 p-2 text-zinc-300 cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {/* Active Hub: Amarante */}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-emerald-500/15 border-2 border-emerald-500 p-4 text-left flex items-center justify-between gap-3 cursor-pointer shadow-md"
          >
            <div>
              <div className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>🔵 Amarante &amp; Tâmega</span>
              </div>
              <p className="text-base font-bold text-emerald-300 mt-0.5">
                Ativo — Raio 35 km (Bloqueio Regional)
              </p>
            </div>
            <span className="rounded-xl bg-emerald-500 text-zinc-950 px-3 py-1.5 text-base font-extrabold shrink-0">
              Ativo ✓
            </span>
          </button>

          {/* Future Centers */}
          {upcomingCenters.map((hub) => (
            <div
              key={hub.name}
              className="w-full rounded-2xl bg-zinc-950/90 border border-zinc-800 p-3.5 text-left flex items-center justify-between gap-3 opacity-80"
            >
              <div>
                <div className="text-lg font-bold text-zinc-200">
                  🔒 {hub.name}
                </div>
                <p className="text-base font-medium text-zinc-400">
                  {hub.radius} • Expansão Regional
                </p>
              </div>
              <span className="rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-1 text-base font-bold shrink-0">
                Em breve
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-lg cursor-pointer transition"
        >
          Confirmar Centro: Amarante (35 km)
        </button>
      </div>
    </div>
  );
};

export const DIRECT_APK_DOWNLOAD_URL =
  'https://iokmoreira.github.io/Delivery-buddy/Delivery-Buddy-Amarante.apk';

export const DirectApkShareModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!isOpen) return null;

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `🤖 Delivery Buddy (Amarante) — Clica aqui para baixar a App direta (.APK sem .ZIP) para Android: ${DIRECT_APK_DOWNLOAD_URL}`
  )}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(
    DIRECT_APK_DOWNLOAD_URL
  )}`;

  const handleCopyDirectLink = async () => {
    try {
      await navigator.clipboard.writeText(DIRECT_APK_DOWNLOAD_URL);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      setCopiedLink(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[700] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-zinc-900 border-2 border-emerald-500/50 p-5 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 px-3 py-1 text-base font-bold text-emerald-300">
              📲 Download Direto .APK (Sem .ZIP)
            </span>
            <h3 className="text-xl font-extrabold text-white mt-2">
              Enviar App a um Colega
            </h3>
            <p className="text-base font-medium text-zinc-400 mt-0.5">
              Aponte a câmara para o QR Code ou envie o link direto pelo WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 p-2 text-zinc-300 cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scannable QR Code Card */}
        <div className="qr-code-surface rounded-2xl bg-white p-4 flex flex-col items-center justify-center text-center shadow-lg">
          <img
            src={qrImageUrl}
            alt="QR Code Delivery-Buddy-Amarante.apk"
            className="w-48 h-48 object-contain rounded-xl"
          />
          <span
            style={{ color: '#090D16' }}
            className="text-base font-extrabold mt-2"
          >
            Delivery-Buddy-Amarante.apk
          </span>
          <span
            style={{ color: '#00838F' }}
            className="text-sm font-bold"
          >
            1 Toque → Baixar e Instalar Direto no Android
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#0B0F17',
              borderColor: '#00E5FF',
              color: '#00E5FF',
            }}
            className="w-full rounded-2xl border-2 py-3.5 px-4 text-lg font-extrabold flex items-center justify-center gap-2 shadow-lg cursor-pointer no-underline transition hover:opacity-95"
          >
            <span>📲 Enviar pelo WhatsApp</span>
          </a>

          <a
            href={DIRECT_APK_DOWNLOAD_URL}
            download="Delivery-Buddy-Amarante.apk"
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: '#0284c7', color: '#ffffff' }}
            className="w-full rounded-2xl py-3.5 px-4 text-lg font-extrabold flex items-center justify-center gap-2 shadow-lg cursor-pointer no-underline transition hover:opacity-95"
          >
            <span>⬇️ Baixar APK Direto (Sem .ZIP)</span>
          </a>

          <button
            type="button"
            onClick={() => void handleCopyDirectLink()}
            className="w-full rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white py-3.5 px-4 text-lg font-bold flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <span>
              {copiedLink
                ? '✅ Link Direto Copiado!'
                : '📋 Copiar Link Direto (.APK)'}
            </span>
          </button>
        </div>

        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-center">
          <span className="text-sm font-bold text-emerald-400 break-all block">
            {DIRECT_APK_DOWNLOAD_URL}
          </span>
        </div>
      </div>
    </div>
  );
};

export const MapRadiusSettingsSection: React.FC = () => {
  const { setMapRadiusKm } = useEstafetas();
  const [isHubModalOpen, setIsHubModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setMapRadiusKm(35 as MapRadiusOptionKm);
  }, [setMapRadiusKm]);

  return (
    <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-extrabold text-zinc-100">
            Centro Operacional &amp; Raio do Mapa
          </h3>
          <p className="text-base font-medium text-zinc-400">
            Mapa e alertas bloqueados num perímetro regional de 35 km
          </p>
        </div>
        <span className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3 py-1.5 text-base font-extrabold text-emerald-400 shrink-0">
          35 km
        </span>
      </div>

      <button
        type="button"
        onClick={() => setIsHubModalOpen(true)}
        className="w-full rounded-2xl bg-zinc-950 hover:bg-zinc-900 border-2 border-emerald-500/45 p-3.5 flex items-center justify-between gap-2 cursor-pointer transition"
      >
        <div className="text-left">
          <span className="text-lg font-extrabold text-white block">
            📍 Centro: Amarante (Raio 35 km)
          </span>
          <span className="text-base font-medium text-emerald-400 block mt-0.5">
            Toque para ver centros operacionais disponíveis
          </span>
        </div>
        <span className="rounded-xl bg-emerald-500 text-zinc-950 px-3 py-1.5 text-base font-extrabold shrink-0">
          Alterar
        </span>
      </button>

      <OperationalHubSelectorModal
        isOpen={isHubModalOpen}
        onClose={() => setIsHubModalOpen(false)}
      />
    </section>
  );
};

export const RoadHazardsSettingsSection: React.FC = () => {
  const {
    roadHazards,
    addRoadHazardPin,
    confirmRoadHazardPin,
    resolveRoadHazardPin,
    selectedRegionName,
    awardBuddyRewardTask,
  } = useEstafetas();

  const [streetInput, setStreetInput] = useState<string>('');

  const quickHazards: { label: string; type: RoadHazardType }[] = [
    { label: 'Buraco', type: 'Buraco Perigoso na Pista' },
    { label: 'Acidente', type: 'Acidente na Via' },
    { label: 'Obras', type: 'Obras na Via / Desvio' },
    { label: 'Óleo', type: 'Piso Escorregadio / Óleo' },
  ];

  const handleQuickHazardReport = (hazardType: RoadHazardType) => {
    addRoadHazardPin(
      hazardType,
      streetInput.trim() || `${selectedRegionName} (Ponto GPS)`,
      selectedRegionName
    );
    awardBuddyRewardTask('ALERTAR_ANOMALIA_MAPA_15');
    setStreetInput('');
  };

  const activeUnresolvedHazards = roadHazards.filter((h) => !h.resolved);

  return (
    <div className="space-y-3">
      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <AlertTriangle className="h-4 w-4 text-[#00E5FF] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-sm font-extrabold text-zinc-100 block leading-snug">
                Reportar Perigo na Via (Amarante 35 km)
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                Publique em 1 toque para alertar os colegas na zona
              </span>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-0.5 text-xs text-emerald-400 font-extrabold shrink-0">
            +15 Coins
          </span>
        </div>

        <input
          type="text"
          value={streetInput}
          onChange={(e) => setStreetInput(e.target.value)}
          placeholder="Rua ou referência em Amarante (ex: N15 / Ponte São Gonçalo)..."
          className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
        />

        <div className="grid grid-cols-4 gap-1.5">
          {quickHazards.map((h) => (
            <button
              key={h.label}
              type="button"
              onClick={() => handleQuickHazardReport(h.type)}
              className="rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 py-2 px-1.5 text-xs font-extrabold cursor-pointer transition text-center whitespace-nowrap"
            >
              {h.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-2.5">
        <span className="text-xs font-extrabold text-zinc-100 block">
          Alertas Ativos na Via ({activeUnresolvedHazards.length})
        </span>

        <div className="space-y-2">
          {activeUnresolvedHazards.length === 0 ? (
            <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3.5 text-center space-y-1">
              <span className="text-xs font-bold text-zinc-100 block">
                0 alertas na via reportados
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Toque num dos botões acima para reportar um perigo real em Amarante.
              </span>
            </div>
          ) : (
            activeUnresolvedHazards.map((pin) => (
              <div
                key={pin.id}
                className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="text-xs font-extrabold text-zinc-100 block leading-snug">
                      ⚠️ {pin.hazardType}
                    </span>
                    <span className="text-[11px] text-zinc-300 flex items-start gap-1 leading-snug">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#00E5FF]" />
                      <span>
                        {pin.streetLocation} •{' '}
                        <strong className="text-zinc-200">
                          {pin.confirmations} conf.
                        </strong>
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => confirmRoadHazardPin(pin.id)}
                      className="rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 px-2.5 py-1.5 text-xs font-extrabold cursor-pointer whitespace-nowrap"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveRoadHazardPin(pin.id)}
                      className="rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 px-2.5 py-1.5 text-xs font-extrabold cursor-pointer whitespace-nowrap"
                    >
                      ✓ Limpo
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export const ZoneAgreementsSettingsSection: React.FC = () => {
  const { zonePacts, toggleJoinZonePact, createZonePact, selectedRegionName } =
    useEstafetas();

  const [isAgreementModalOpen, setIsAgreementModalOpen] =
    useState<boolean>(false);
  const [newAgreementTitle, setNewAgreementTitle] = useState<string>('');
  const [newAgreementZone, setNewAgreementZone] = useState<string>(
    'Amarante — Centro / São Gonçalo'
  );
  const [newAgreementMinEur, setNewAgreementMinEur] = useState<number>(5.0);
  const [newAgreementMinPerKm, setNewAgreementMinPerKm] = useState<number>(1.2);

  const handleCreateAgreementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgreementTitle.trim()) return;
    createZonePact({
      title: newAgreementTitle.trim(),
      zoneName: newAgreementZone.trim() || selectedRegionName,
      minCollectiveOrderEur: Math.max(3.5, newAgreementMinEur),
      minCollectivePerKmEur: Math.max(0.8, newAgreementMinPerKm),
      durationHoursLabel: 'Das 19:00 às 22:00 (3h)',
    });
    setNewAgreementTitle('');
    setIsAgreementModalOpen(false);
  };

  return (
    <div className="space-y-3">
      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-zinc-300" />
            <span>Acordos Coletivos de Zona</span>
          </span>
          <button
            type="button"
            onClick={() => setIsAgreementModalOpen(true)}
            className="rounded-xl bg-white text-zinc-950 px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Novo Acordo</span>
          </button>
        </div>

        <div className="space-y-2">
          {zonePacts.length === 0 ? (
            <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3.5 text-center space-y-1">
              <span className="text-xs font-bold text-zinc-100 block">
                0 acordos de zona registados
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Clique em &quot;+ Novo Acordo&quot; para publicar um acordo real em Amarante.
              </span>
            </div>
          ) : (
            zonePacts.map((agreement) => (
              <div
                key={agreement.id}
                className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-zinc-100 block truncate">
                      {agreement.title}
                    </span>
                    <span className="text-[11px] text-zinc-400 block">
                      {agreement.zoneName} • {agreement.adheredCouriersCount}{' '}
                      estafetas aderiram
                    </span>
                  </div>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-200 shrink-0">
                    &gt;= {agreement.minCollectiveOrderEur.toFixed(2)} €
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-zinc-400">
                    Mínimo coletivo: {agreement.minCollectivePerKmEur.toFixed(2)}{' '}
                    €/km
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleJoinZonePact(agreement.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                      agreement.joinedByUser
                        ? 'bg-white text-zinc-950'
                        : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                    }`}
                  >
                    {agreement.joinedByUser && <Check className="h-3 w-3" />}
                    <span>
                      {agreement.joinedByUser ? 'Acordo Ativo' : 'Aderir Acordo'}
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {isAgreementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAgreementSubmit}
            className="w-full max-w-[380px] rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h3 className="text-sm font-semibold text-zinc-100">
                Criar Acordo de Zona
              </h3>
              <button
                type="button"
                onClick={() => setIsAgreementModalOpen(false)}
                className="p-1 rounded-lg bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Título do Acordo
                </label>
                <input
                  type="text"
                  required
                  value={newAgreementTitle}
                  onChange={(e) => setNewAgreementTitle(e.target.value)}
                  placeholder="Ex: Acordo Amarante Centro >= 5,00 €"
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Piso Mínimo (€)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={newAgreementMinEur}
                    onChange={(e) =>
                      setNewAgreementMinEur(parseFloat(e.target.value) || 5.0)
                    }
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Mínimo €/km
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={newAgreementMinPerKm}
                    onChange={(e) =>
                      setNewAgreementMinPerKm(parseFloat(e.target.value) || 1.2)
                    }
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Zona
                </label>
                <input
                  type="text"
                  value={newAgreementZone}
                  onChange={(e) => setNewAgreementZone(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl py-2.5 bg-white text-zinc-950 font-semibold text-xs cursor-pointer"
            >
              Publicar e Aderir ao Acordo
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const AMARANTE_INITIAL_VIEW_CENTER = {
  lat: 41.2704,
  lng: -8.0818,
};

export const ShiftRadarModule: React.FC = () => {
  const {
    themeMode,
    onlineDirectoryCouriers,
    setActiveBuddyPopupCourierId,
    realCourierProfile,
    refreshLiveGpsPosition,
    cleanupGhostDuplicatePinsNow,
    isAppPaused,
    activeDeliveryLifecycle,
    hasRealActiveDelivery,
    currentMascotState,
    currentMascotImageUrl,
    addRoadHazardPin,
    awardBuddyRewardTask,
    speakTextPt,
  } = useEstafetas();

  const isDaylight = themeMode === 'DAYLIGHT';

  const [mapStyleMode, setMapStyleMode] = useState<
    'MAPA_NEON' | 'TRANSITO_GOOGLE' | 'SATELITE'
  >('MAPA_NEON');
  const [isFullRoadView, setIsFullRoadView] = useState<boolean>(false);
  const [isHubSelectorModalOpen, setIsHubSelectorModalOpen] =
    useState<boolean>(false);
  const [isAutoFollowActive, setIsAutoFollowActive] = useState<boolean>(true);
  const [liveAccuracyMeters, setLiveAccuracyMeters] = useState<number>(12);
  const [localLiveCoords, setLocalLiveCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(() => {
    if (
      realCourierProfile &&
      Number.isFinite(realCourierProfile.lat) &&
      Number.isFinite(realCourierProfile.lng) &&
      (realCourierProfile.lat !== 0 || realCourierProfile.lng !== 0)
    ) {
      return {
        lat: realCourierProfile.lat,
        lng: realCourierProfile.lng,
      };
    }
    return {
      lat: AMARANTE_HUB_CENTER.lat,
      lng: AMARANTE_HUB_CENTER.lng,
    };
  });
  const [cloudApprovalRequests, setCloudApprovalRequests] = useState<
    CloudApprovalRequest[]
  >(() => loadCloudSharedState().approvalRequests || []);

  // Live Speedometer, Dynamic Road Limit (30/50/70/90), 20s Over-Speed Monitor & Crosswalk Proximity State
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(0);
  const [roadLimitKmh, setRoadLimitKmh] = useState<30 | 50 | 70 | 90>(50);
  const [roadNameLabel, setRoadNameLabel] = useState<string>(
    'Amarante Centro Urbano'
  );
  const [consecutiveOverSpeedSec, setConsecutiveOverSpeedSec] =
    useState<number>(0);
  const [isSpeedAlertPulsing, setIsSpeedAlertPulsing] =
    useState<boolean>(false);
  const [headingDeg, setHeadingDeg] = useState<number | null>(null);
  const [amaranteCrosswalks, setAmaranteCrosswalks] = useState<
    AmaranteCrosswalkPoint[]
  >(() => getAllAmaranteCrosswalks());
  const [approachingCrosswalkAlert, setApproachingCrosswalkAlert] = useState<{
    streetLabel: string;
    distanceMeters: number;
  } | null>(null);
  const [crosswalkFeedbackBanner, setCrosswalkFeedbackBanner] = useState<
    string | null
  >(null);
  const [mapZoom, setMapZoom] = useState<number>(localLiveCoords ? 16 : 14);
  const [isMarkMapModalOpen, setIsMarkMapModalOpen] = useState<boolean>(false);
  const [selectedCrosswalkForInspect, setSelectedCrosswalkForInspect] =
    useState<AmaranteCrosswalkPoint | null>(null);
  const [learnedPaths, setLearnedPaths] = useState<AmaranteLearnedPath[]>(() =>
    loadLearnedAmarantePaths()
  );
  const [isRecordingLearnedPath, setIsRecordingLearnedPath] =
    useState<boolean>(false);
  const isRecordingLearnedPathRef = useRef<boolean>(false);
  const [recordedPathBreadcrumbs, setRecordedPathBreadcrumbs] = useState<
    Array<{ lat: number; lng: number }>
  >([]);
  const [isSaveLearnedPathModalOpen, setIsSaveLearnedPathModalOpen] =
    useState<boolean>(false);
  const [learnedPathAddressInput, setLearnedPathAddressInput] =
    useState<string>('');
  const [learnedPathNoteInput, setLearnedPathNoteInput] = useState<string>(
    'Entrada pelo portão lateral junto ao Rio Tâmega'
  );
  const [selectedLearnedPathForInspect, setSelectedLearnedPathForInspect] =
    useState<AmaranteLearnedPath | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const selfMarkerRef = useRef<L.Marker | null>(null);
  const selfAccuracyCircleRef = useRef<L.Circle | null>(null);
  const peerMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const courierMarkersRef = useRef<
    Map<string, { marker: L.Marker; signature: string }>
  >(new Map());
  const crosswalksLayerRef = useRef<L.LayerGroup | null>(null);
  const learnedPathsLayerRef = useRef<L.LayerGroup | null>(null);
  const learnedPathAlertCooldownRef = useRef<Record<string, number>>({});
  const isAutoFollowRef = useRef<boolean>(true);
  const hasCenteredOnFirstFixRef = useRef<boolean>(false);
  const hasHighAccuracyFixRef = useRef<boolean>(false);
  const lastHighAccuracyFixMsRef = useRef<number>(0);
  const lastAcceptedCoordsRef = useRef<{ lat: number; lng: number } | null>(
    localLiveCoords
  );
  const lastFixTimestampMsRef = useRef<number>(Date.now());
  const glidingAnimFrameRef = useRef<number | null>(null);
  const displayedGlidingCoordsRef = useRef<{ lat: number; lng: number } | null>(
    localLiveCoords
  );
  const currentSpeedRef = useRef<number>(0);
  const lastMovingSpeedKmhRef = useRef<number>(0);
  const lastMovingSpeedAtMsRef = useRef<number>(0);
  const lastSpecificRoadNameRef = useRef<{ name: string; atMs: number }>({
    name: '',
    atMs: 0,
  });
  const roadLimitRef = useRef<30 | 50 | 70 | 90>(50);
  const consecutiveOverSecRef = useRef<number>(0);
  const lastSpeedVoiceAlertMsRef = useRef<number>(0);
  const crosswalkCooldownMapRef = useRef<Record<string, number>>({});
  const prevCrosswalkDistancesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    isAutoFollowRef.current = isAutoFollowActive;
  }, [isAutoFollowActive]);

  // Smooth Waze-style marker gliding interpolation helper (requestAnimationFrame)
  const animateMarkerGlideTo = useCallback(
    (targetLat: number, targetLng: number) => {
      const startPos = displayedGlidingCoordsRef.current;
      if (!startPos) {
        displayedGlidingCoordsRef.current = { lat: targetLat, lng: targetLng };
        if (selfMarkerRef.current) {
          selfMarkerRef.current.setLatLng([targetLat, targetLng]);
        }
        if (selfAccuracyCircleRef.current) {
          selfAccuracyCircleRef.current.setLatLng([targetLat, targetLng]);
        }
        return;
      }

      if (glidingAnimFrameRef.current !== null) {
        cancelAnimationFrame(glidingAnimFrameRef.current);
      }

      const startLat = startPos.lat;
      const startLng = startPos.lng;
      const durationMs = 420;
      const startTime = performance.now();

      const step = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const curLat = startLat + (targetLat - startLat) * eased;
        const curLng = startLng + (targetLng - startLng) * eased;
        displayedGlidingCoordsRef.current = { lat: curLat, lng: curLng };

        if (selfMarkerRef.current) {
          selfMarkerRef.current.setLatLng([curLat, curLng]);
        }
        if (selfAccuracyCircleRef.current) {
          selfAccuracyCircleRef.current.setLatLng([curLat, curLng]);
        }

        if (progress < 1) {
          glidingAnimFrameRef.current = requestAnimationFrame(step);
        } else {
          glidingAnimFrameRef.current = null;
        }
      };

      glidingAnimFrameRef.current = requestAnimationFrame(step);
    },
    []
  );

  // Check proximity to mapped or courier-taught Amarante crosswalks (<= 45m & > 28 km/h along heading)
  const evaluateCrosswalkProximity = useCallback(
    (
      lat: number,
      lng: number,
      speedKmh: number,
      riderHeading: number | null
    ) => {
      if (speedKmh <= 28) {
        setApproachingCrosswalkAlert(null);
        return;
      }

      const nowMs = Date.now();
      let closestMatch: {
        cw: AmaranteCrosswalkPoint;
        distMeters: number;
      } | null = null;

      for (const cw of amaranteCrosswalks) {
        const distMeters = computeHaversineMeters(lat, lng, cw.lat, cw.lng);
        const prevDist = prevCrosswalkDistancesRef.current[cw.id];
        prevCrosswalkDistancesRef.current[cw.id] = distMeters;

        if (distMeters <= 45) {
          const bearingToCw = computeBearingDegrees(lat, lng, cw.lat, cw.lng);
          const isAlongHeading =
            riderHeading !== null
              ? getAngleDifferenceDeg(riderHeading, bearingToCw) <= 68
              : prevDist === undefined || distMeters <= prevDist + 1.5;

          if (isAlongHeading) {
            if (!closestMatch || distMeters < closestMatch.distMeters) {
              closestMatch = { cw, distMeters: Math.round(distMeters) };
            }
          }
        }
      }

      if (closestMatch) {
        setApproachingCrosswalkAlert({
          streetLabel: closestMatch.cw.streetLabel,
          distanceMeters: Math.max(8, closestMatch.distMeters),
        });
        const lastAlerted =
          crosswalkCooldownMapRef.current[closestMatch.cw.id] || 0;
        if (nowMs - lastAlerted > 90000) {
          crosswalkCooldownMapRef.current[closestMatch.cw.id] = nowMs;
          playBuddyOpenChime();
          speakTextPt('Atenção: passadeira à frente.');
        }
      } else {
        setApproachingCrosswalkAlert(null);
      }
    },
    [amaranteCrosswalks, speakTextPt]
  );

  // Unified GPS Filter: Filters out coarse cell-tower jumps + computes live GPS speed (km/h), heading & road limit
  const applyFilteredGpsFix = useCallback(
    (
      lat: number,
      lng: number,
      accuracy?: number,
      forceAccept = false,
      rawSpeedMetersPerSec?: number | null,
      rawHeadingDeg?: number | null
    ): { lat: number; lng: number } | null => {
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        (lat === 0 && lng === 0)
      ) {
        return null;
      }

      const nowMs = Date.now();
      const isHighAcc =
        typeof accuracy === 'number' &&
        Number.isFinite(accuracy) &&
        accuracy > 0 &&
        accuracy <= 40;

      if (isHighAcc) {
        hasHighAccuracyFixRef.current = true;
        lastHighAccuracyFixMsRef.current = nowMs;
      } else if (
        !forceAccept &&
        hasHighAccuracyFixRef.current &&
        nowMs - lastHighAccuracyFixMsRef.current < 60000 &&
        typeof accuracy === 'number' &&
        accuracy > 45
      ) {
        // Ignore coarse cell-tower / network coordinate jumps once high-accuracy GPS is locked!
        return null;
      }

      const prev = lastAcceptedCoordsRef.current;
      let computedDeltaKmh: number | null = null;
      let computedBearing: number | null =
        typeof rawHeadingDeg === 'number' &&
        Number.isFinite(rawHeadingDeg) &&
        rawHeadingDeg >= 0
          ? Math.round(rawHeadingDeg)
          : null;

      if (prev) {
        const distMeters = computeHaversineMeters(
          prev.lat,
          prev.lng,
          lat,
          lng
        );
        const dtSec = Math.max(
          0.4,
          (nowMs - lastFixTimestampMsRef.current) / 1000
        );

        if (distMeters >= 2 && dtSec <= 25) {
          computedDeltaKmh = Math.min(
            135,
            Math.round((distMeters / dtSec) * 3.6)
          );
          if (computedBearing === null) {
            computedBearing = Math.round(
              computeBearingDegrees(prev.lat, prev.lng, lat, lng)
            );
          }
        }

        // Minimum movement deadband to prevent stationary pin jitter while preserving 4-second speed hold
        if (!forceAccept && distMeters < 4) {
          const rawGpsKmh =
            typeof rawSpeedMetersPerSec === 'number' &&
            Number.isFinite(rawSpeedMetersPerSec) &&
            rawSpeedMetersPerSec > 0
              ? Math.round(rawSpeedMetersPerSec * 3.6)
              : 0;
          if (rawGpsKmh >= 3) {
            const smoothed =
              lastMovingSpeedKmhRef.current > 3
                ? Math.round(
                    0.65 * rawGpsKmh + 0.35 * lastMovingSpeedKmhRef.current
                  )
                : rawGpsKmh;
            lastMovingSpeedKmhRef.current = smoothed;
            lastMovingSpeedAtMsRef.current = nowMs;
            currentSpeedRef.current = smoothed;
            setCurrentSpeedKmh(smoothed);
          } else if (nowMs - lastMovingSpeedAtMsRef.current < 4000) {
            // 4-Second Speed Hold: never drop to 0 KM/H on intermediate GPS ticks while driving!
            currentSpeedRef.current = lastMovingSpeedKmhRef.current;
            setCurrentSpeedKmh(lastMovingSpeedKmhRef.current);
          } else {
            currentSpeedRef.current = 0;
            setCurrentSpeedKmh(0);
          }
          return null;
        }
      }

      lastFixTimestampMsRef.current = nowMs;

      const rawSensorKmh =
        typeof rawSpeedMetersPerSec === 'number' &&
        Number.isFinite(rawSpeedMetersPerSec) &&
        rawSpeedMetersPerSec > 0
          ? Math.round(rawSpeedMetersPerSec * 3.6)
          : 0;

      // Combine native coords.speed with Haversine velocity fallback (distanceMeters / elapsedSeconds * 3.6)
      const candidateMovingKmh =
        rawSensorKmh >= 3
          ? computedDeltaKmh !== null && computedDeltaKmh > rawSensorKmh * 1.35
            ? Math.round(0.6 * rawSensorKmh + 0.4 * computedDeltaKmh)
            : rawSensorKmh
          : computedDeltaKmh !== null && computedDeltaKmh >= 3
            ? computedDeltaKmh
            : 0;

      let cleanSpeedKmh = 0;
      if (candidateMovingKmh >= 3) {
        cleanSpeedKmh =
          lastMovingSpeedKmhRef.current > 3 &&
          nowMs - lastMovingSpeedAtMsRef.current < 6000
            ? Math.round(
                0.7 * candidateMovingKmh + 0.3 * lastMovingSpeedKmhRef.current
              )
            : candidateMovingKmh;
        lastMovingSpeedKmhRef.current = cleanSpeedKmh;
        lastMovingSpeedAtMsRef.current = nowMs;
      } else if (
        lastMovingSpeedKmhRef.current > 3 &&
        nowMs - lastMovingSpeedAtMsRef.current < 4000
      ) {
        // Hold last moving speed for 4 full seconds before decaying to 0 KM/H
        cleanSpeedKmh = lastMovingSpeedKmhRef.current;
      } else {
        cleanSpeedKmh = 0;
      }

      currentSpeedRef.current = cleanSpeedKmh;
      setCurrentSpeedKmh(cleanSpeedKmh);

      if (computedBearing !== null) {
        setHeadingDeg(computedBearing);
      }

      const nextCoords = {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      };
      lastAcceptedCoordsRef.current = nextCoords;
      setLocalLiveCoords(nextCoords);
      animateMarkerGlideTo(nextCoords.lat, nextCoords.lng);

      if (
        typeof accuracy === 'number' &&
        Number.isFinite(accuracy) &&
        accuracy > 0
      ) {
        setLiveAccuracyMeters(Math.min(80, Math.max(6, accuracy)));
      }

      // Query dynamic road speed limit (Overpass maxspeed + Amarante urban/EN15/N312 heuristic)
      // Protect locked street name (e.g. EM 312 / N312) from generic fallback overwrites while driving
      void resolveRoadSpeedLimitAtCoords(nextCoords.lat, nextCoords.lng).then(
        (res) => {
          const isGenericFallback =
            !res.roadName ||
            res.roadName === 'Amarante Centro Urbano' ||
            res.roadName.startsWith('Amarante Centro');
          if (!isGenericFallback) {
            lastSpecificRoadNameRef.current = {
              name: res.roadName,
              atMs: Date.now(),
            };
            roadLimitRef.current = res.limit;
            setRoadLimitKmh(res.limit);
            setRoadNameLabel(res.roadName);
          } else if (
            lastSpecificRoadNameRef.current.name &&
            (currentSpeedRef.current > 5 ||
              Date.now() - lastSpecificRoadNameRef.current.atMs < 30000)
          ) {
            // Keep locked road name (e.g. EM 312 / N312) while moving
            setRoadNameLabel(lastSpecificRoadNameRef.current.name);
          } else {
            roadLimitRef.current = res.limit;
            setRoadLimitKmh(res.limit);
            setRoadNameLabel(res.roadName);
          }
        }
      );

      // Evaluate crosswalk proximity (<= 45m & > 28 km/h)
      evaluateCrosswalkProximity(
        nextCoords.lat,
        nextCoords.lng,
        cleanSpeedKmh,
        computedBearing
      );

      // If recording a learned GPS path ("Buddy, ensinar caminho"), append breadcrumb
      if (isRecordingLearnedPathRef.current) {
        setRecordedPathBreadcrumbs((prevCrumbs) => {
          const lastPt = prevCrumbs[prevCrumbs.length - 1];
          if (
            lastPt &&
            computeHaversineMeters(
              lastPt.lat,
              lastPt.lng,
              nextCoords.lat,
              nextCoords.lng
            ) < 4
          ) {
            return prevCrumbs;
          }
          return [...prevCrumbs.slice(-45), nextCoords];
        });
      }

      // Check proximity (<= 60m) to any learned entrance path in Amarante
      const nowPathMs = Date.now();
      for (const path of learnedPaths) {
        const pLat = path.entranceLat ?? path.doorLat ?? path.lat ?? 41.2689;
        const pLng = path.entranceLng ?? path.doorLng ?? path.lng ?? -8.0782;
        const pTitle =
          path.addressTitle ||
          path.addressLabel ||
          path.streetOrBuildingLabel ||
          'Morada Amarante';
        const distToDoor = computeHaversineMeters(
          nextCoords.lat,
          nextCoords.lng,
          pLat,
          pLng
        );
        if (distToDoor <= 60) {
          const lastSpoken = learnedPathAlertCooldownRef.current[path.id] || 0;
          if (nowPathMs - lastSpoken > 180000) {
            learnedPathAlertCooldownRef.current[path.id] = nowPathMs;
            setCrosswalkFeedbackBanner(
              `🚪 ${pTitle}: ${path.entranceNote}`
            );
            window.setTimeout(() => {
              setCrosswalkFeedbackBanner(null);
            }, 6500);
            speakTextPt(
              `Entrada ensinada para ${pTitle}: ${path.entranceNote}`
            );
          }
          break;
        }
      }

      return nextCoords;
    },
    [
      animateMarkerGlideTo,
      evaluateCrosswalkProximity,
      learnedPaths,
      speakTextPt,
    ]
  );

  const handleStartLearnedPathRecording = useCallback(() => {
    const startPt =
      lastAcceptedCoordsRef.current ||
      localLiveCoords || {
        lat: AMARANTE_INITIAL_VIEW_CENTER.lat,
        lng: AMARANTE_INITIAL_VIEW_CENTER.lng,
      };
    isRecordingLearnedPathRef.current = true;
    setIsRecordingLearnedPath(true);
    setRecordedPathBreadcrumbs([startPt]);
    setIsMarkMapModalOpen(false);
    setLearnedPathAddressInput(roadNameLabel || 'Amarante Centro');
    setLearnedPathNoteInput('Entrada pelo portão lateral junto ao Rio Tâmega');
    setCrosswalkFeedbackBanner(
      '🧭 A gravar caminho GPS até à porta... Conduz até à entrada e toca em Concluir!'
    );
  }, [localLiveCoords, roadNameLabel]);

  const handleOpenSaveLearnedPathModal = useCallback(() => {
    const endPt =
      lastAcceptedCoordsRef.current ||
      localLiveCoords || {
        lat: AMARANTE_INITIAL_VIEW_CENTER.lat,
        lng: AMARANTE_INITIAL_VIEW_CENTER.lng,
      };
    setRecordedPathBreadcrumbs((prev) =>
      prev.length > 0 ? [...prev, endPt] : [endPt]
    );
    if (!learnedPathAddressInput.trim()) {
      setLearnedPathAddressInput(roadNameLabel || 'Amarante Centro');
    }
    setIsSaveLearnedPathModalOpen(true);
  }, [learnedPathAddressInput, localLiveCoords, roadNameLabel]);

  const handleSaveLearnedPathNow = useCallback(() => {
    const endPt =
      lastAcceptedCoordsRef.current ||
      localLiveCoords || {
        lat: AMARANTE_INITIAL_VIEW_CENTER.lat,
        lng: AMARANTE_INITIAL_VIEW_CENTER.lng,
      };
    const courierName = (realCourierProfile?.name || 'Buddy Amarante').trim();
    const cleanTitle = (learnedPathAddressInput || roadNameLabel || 'Amarante')
      .trim();
    const cleanNote =
      learnedPathNoteInput.trim() ||
      'Entrada pelo portão lateral junto ao Rio Tâmega';

    const newPath: AmaranteLearnedPath = {
      id: `path-amarante-${Date.now()}`,
      addressTitle: cleanTitle,
      entranceNote: cleanNote,
      entranceLat: Number(endPt.lat.toFixed(6)),
      entranceLng: Number(endPt.lng.toFixed(6)),
      breadcrumbs:
        recordedPathBreadcrumbs.length > 0
          ? recordedPathBreadcrumbs
          : [
              {
                lat: Number((endPt.lat - 0.0003).toFixed(6)),
                lng: Number((endPt.lng - 0.0003).toFixed(6)),
              },
              {
                lat: Number(endPt.lat.toFixed(6)),
                lng: Number(endPt.lng.toFixed(6)),
              },
            ],
      taughtByCallsign: courierName,
      createdAtIso: new Date().toISOString(),
    };

    const updatedList = saveLearnedAmarantePath(newPath);
    setLearnedPaths(updatedList);
    void publishLearnedPathToCloud(newPath, realCourierProfile?.id || 'local');
    awardBuddyRewardTask('ALERTAR_ANOMALIA_MAPA_15');

    isRecordingLearnedPathRef.current = false;
    setIsRecordingLearnedPath(false);
    setIsSaveLearnedPathModalOpen(false);
    setCrosswalkFeedbackBanner(
      `✓ Caminho e entrada guardados: ${cleanTitle} (+15 Coins • Sincronizado na Cloud)`
    );
    window.setTimeout(() => {
      setCrosswalkFeedbackBanner(null);
    }, 5500);
    speakTextPt(
      `Caminho e entrada para ${cleanTitle} guardados e sincronizados com todos os Buddys de Amarante.`
    );
  }, [
    awardBuddyRewardTask,
    learnedPathAddressInput,
    learnedPathNoteInput,
    localLiveCoords,
    realCourierProfile?.id,
    realCourierProfile?.name,
    recordedPathBreadcrumbs,
    roadNameLabel,
    speakTextPt,
  ]);

  // Load Amarante crosswalks (Seed + Overpass API + Custom Taught)
  useEffect(() => {
    const syncCrosswalks = () => {
      setAmaranteCrosswalks(getAllAmaranteCrosswalks());
    };
    window.addEventListener('buddy-crosswalks-updated', syncCrosswalks);
    void fetchAmaranteCrosswalksFromOverpass().then((list) => {
      setAmaranteCrosswalks(list);
    });
    return () => {
      window.removeEventListener('buddy-crosswalks-updated', syncCrosswalks);
    };
  }, []);

  // Confirmed Handler: Teach / Mark New Pedestrian Crosswalk at Current Location
  const handleConfirmTeachCrosswalkHere = useCallback(() => {
    const targetCoords =
      lastAcceptedCoordsRef.current ||
      localLiveCoords || {
        lat: AMARANTE_INITIAL_VIEW_CENTER.lat,
        lng: AMARANTE_INITIAL_VIEW_CENTER.lng,
      };
    const courierName = (realCourierProfile?.name || 'Buddy Amarante').trim();
    const label = `${roadNameLabel} (Ensinada por ${courierName})`;

    const newCw: AmaranteCrosswalkPoint = {
      id: `cw-taught-${Date.now()}`,
      lat: Number(targetCoords.lat.toFixed(6)),
      lng: Number(targetCoords.lng.toFixed(6)),
      streetLabel: label,
      source: 'COURIER_TAUGHT',
      taughtByCallsign: courierName,
      createdAtIso: new Date().toISOString(),
    };

    saveCustomTaughtCrosswalk(newCw);
    void publishTaughtCrosswalkToCloud(newCw);
    setAmaranteCrosswalks(getAllAmaranteCrosswalks());
    addRoadHazardPin(
      'Obras na Via / Desvio',
      `Passadeira Ensinada: ${label}`,
      'Amarante — Centro / São Gonçalo'
    );
    awardBuddyRewardTask('ALERTAR_ANOMALIA_MAPA_15');
    setIsMarkMapModalOpen(false);

    setCrosswalkFeedbackBanner(
      `Passadeira confirmada em ${roadNameLabel} (+15 Coins • Sincronizada com Buddys)`
    );
    window.setTimeout(() => {
      setCrosswalkFeedbackBanner(null);
    }, 4500);

    speakTextPt(
      'Passadeira registada com sucesso em Amarante e sincronizada para todos os Buddys!'
    );
  }, [
    addRoadHazardPin,
    awardBuddyRewardTask,
    localLiveCoords,
    realCourierProfile?.name,
    roadNameLabel,
    speakTextPt,
  ]);

  const handleReportRoadHazardHere = useCallback(() => {
    const courierName = (realCourierProfile?.name || 'Buddy Amarante').trim();
    const label = `${roadNameLabel} (Reportado por ${courierName})`;
    addRoadHazardPin(
      'Obras na Via / Desvio',
      `Perigo na Via (Obras / Buraco / Acidente): ${label}`,
      'Amarante — Centro / São Gonçalo'
    );
    awardBuddyRewardTask('ALERTAR_ANOMALIA_MAPA_15');
    setIsMarkMapModalOpen(false);

    setCrosswalkFeedbackBanner(
      `⚠️ Perigo na via reportado em ${roadNameLabel} (+15 Coins)`
    );
    window.setTimeout(() => {
      setCrosswalkFeedbackBanner(null);
    }, 4500);

    speakTextPt('Alerta de perigo na via registado no mapa de Amarante.');
  }, [
    addRoadHazardPin,
    awardBuddyRewardTask,
    realCourierProfile?.name,
    roadNameLabel,
    speakTextPt,
  ]);

  const handleDeleteLatestCrosswalk = useCallback(() => {
    const removed = deleteLatestCrosswalk();
    if (removed) {
      removeCrosswalkFromCloud(removed.id);
      setAmaranteCrosswalks(getAllAmaranteCrosswalks());
      setIsMarkMapModalOpen(false);
      setCrosswalkFeedbackBanner(
        `🗑️ Passadeira removida: ${removed.streetLabel}`
      );
      window.setTimeout(() => {
        setCrosswalkFeedbackBanner(null);
      }, 4500);
      speakTextPt('Última passadeira apagada com sucesso.');
    } else {
      setIsMarkMapModalOpen(false);
    }
  }, [speakTextPt]);

  const handleRemoveCrosswalkById = useCallback(
    (cwId: string, streetLabel?: string) => {
      deleteCrosswalkById(cwId);
      removeCrosswalkFromCloud(cwId);
      setAmaranteCrosswalks(getAllAmaranteCrosswalks());
      setSelectedCrosswalkForInspect(null);
      setCrosswalkFeedbackBanner(
        `🗑️ Passadeira removida${streetLabel ? `: ${streetLabel}` : ''}`
      );
      window.setTimeout(() => {
        setCrosswalkFeedbackBanner(null);
      }, 4500);
      speakTextPt('Passadeira removida do mapa.');
    },
    [speakTextPt]
  );

  const handleCycleMapLayer = useCallback(() => {
    setMapStyleMode((prev) =>
      prev === 'MAPA_NEON'
        ? 'TRANSITO_GOOGLE'
        : prev === 'TRANSITO_GOOGLE'
          ? 'SATELITE'
          : 'MAPA_NEON'
    );
  }, []);

  useEffect(() => {
    const onVoiceMarkCrosswalk = () => {
      setIsMarkMapModalOpen(true);
    };
    const onStartLivePathTeaching = () => {
      handleStartLearnedPathRecording();
    };
    const onLearnedPathsSynced = () => {
      setLearnedPaths(loadLearnedAmarantePaths());
    };
    window.addEventListener(
      'buddy-voice-mark-crosswalk',
      onVoiceMarkCrosswalk
    );
    window.addEventListener(
      'buddy-start-live-path-teaching',
      onStartLivePathTeaching
    );
    window.addEventListener('buddy-learned-path-synced', onLearnedPathsSynced);
    window.addEventListener(
      'buddy-learned-paths-updated',
      onLearnedPathsSynced
    );
    return () => {
      window.removeEventListener(
        'buddy-voice-mark-crosswalk',
        onVoiceMarkCrosswalk
      );
      window.removeEventListener(
        'buddy-start-live-path-teaching',
        onStartLivePathTeaching
      );
      window.removeEventListener(
        'buddy-learned-path-synced',
        onLearnedPathsSynced
      );
      window.removeEventListener(
        'buddy-learned-paths-updated',
        onLearnedPathsSynced
      );
    };
  }, [handleStartLearnedPathRecording]);

  // Strict 20-Second Continuous Over-Speed Monitor (> roadLimit + 10 km/h) + 4-Second Stationary Speed Decay
  // Resets immediately to 0s if speed drops below roadLimit + 10 km/h (freedom for overtakes)
  useEffect(() => {
    const ticker = window.setInterval(() => {
      const nowMs = Date.now();
      // Decay speed to 0 KM/H ONLY after 4 full seconds (4000ms) with no movement (< 2m)
      if (
        currentSpeedRef.current > 0 &&
        lastMovingSpeedAtMsRef.current > 0 &&
        nowMs - lastMovingSpeedAtMsRef.current >= 4000
      ) {
        currentSpeedRef.current = 0;
        lastMovingSpeedKmhRef.current = 0;
        setCurrentSpeedKmh(0);
      }

      const spd = currentSpeedRef.current;
      const lim = roadLimitRef.current;

      if (spd > lim + 10) {
        consecutiveOverSecRef.current += 1;
        setConsecutiveOverSpeedSec(consecutiveOverSecRef.current);

        // Trigger calm reminder ONLY after 20 consecutive seconds at > roadLimit + 10 km/h (with 3-min cooldown)
        if (consecutiveOverSecRef.current >= 20) {
          setIsSpeedAlertPulsing(true);
          const nowMs = Date.now();
          if (nowMs - lastSpeedVoiceAlertMsRef.current >= 180000) {
            lastSpeedVoiceAlertMsRef.current = nowMs;
            speakTextPt(
              'Buddy: estás há vinte segundos acima do limite da via. Conduz com segurança.'
            );
          }
        }
      } else {
        if (consecutiveOverSecRef.current !== 0) {
          consecutiveOverSecRef.current = 0;
          setConsecutiveOverSpeedSec(0);
          setIsSpeedAlertPulsing(false);
        }
      }

      recordLiveSpeedSampleForDelivery(
        spd,
        lim,
        consecutiveOverSecRef.current
      );
    }, 1000);

    return () => {
      window.clearInterval(ticker);
    };
  }, [speakTextPt]);

  // Purge ghost/duplicate rows in Supabase on map mount (silently, no TTS)
  useEffect(() => {
    void cleanupGhostDuplicatePinsNow();
    void refreshLiveGpsPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seed initial position from context ONLY if no direct GPS fix has been accepted yet
  // (Never let context updates without speed overwrite live moving speed or road name!)
  useEffect(() => {
    if (
      !lastAcceptedCoordsRef.current &&
      realCourierProfile?.gpsSource === 'LIVE_GPS' &&
      Number.isFinite(realCourierProfile.lat) &&
      Number.isFinite(realCourierProfile.lng)
    ) {
      applyFilteredGpsFix(realCourierProfile.lat, realCourierProfile.lng);
    }
  }, [
    applyFilteredGpsFix,
    realCourierProfile?.gpsSource,
    realCourierProfile?.lat,
    realCourierProfile?.lng,
  ]);

  // Direct high-frequency GPS watcher inside Map tab (Native Android + Instant Initial Network + High-Accuracy GPS)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleNativeLocationEvent = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          lat: number;
          lng: number;
          accuracy?: number;
          speed?: number;
          heading?: number;
        }>
      ).detail;
      if (detail) {
        applyFilteredGpsFix(
          detail.lat,
          detail.lng,
          detail.accuracy,
          false,
          detail.speed,
          detail.heading
        );
      }
    };

    window.addEventListener(
      'buddy-native-location',
      handleNativeLocationEvent as EventListener
    );

    const winAny = window as unknown as {
      BuddyNativeOverlay?: {
        requestImmediateNativeGpsFix?: () => void;
      };
    };
    try {
      winAny.BuddyNativeOverlay?.requestImmediateNativeGpsFix?.();
    } catch {
      // ignore
    }

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      return () => {
        window.removeEventListener(
          'buddy-native-location',
          handleNativeLocationEvent as EventListener
        );
      };
    }

    let watchId: number | null = null;
    try {
      // 1. Use coarse Network/Wi-Fi Location ONLY for the very first initial center if no GPS fix exists yet
      if (!lastAcceptedCoordsRef.current) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!lastAcceptedCoordsRef.current) {
              applyFilteredGpsFix(
                pos.coords.latitude,
                pos.coords.longitude,
                pos.coords.accuracy,
                false,
                pos.coords.speed,
                pos.coords.heading
              );
            }
          },
          () => {
            // ignore and wait for watchPosition
          },
          {
            enableHighAccuracy: false,
            timeout: 3000,
            maximumAge: 60000,
          }
        );
      }

      // 2. Continuous High-Accuracy Satellite GPS Watch
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          applyFilteredGpsFix(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy,
            false,
            pos.coords.speed,
            pos.coords.heading
          );
        },
        () => {
          if (!lastAcceptedCoordsRef.current) {
            try {
              navigator.geolocation.getCurrentPosition(
                (netPos) => {
                  if (!lastAcceptedCoordsRef.current) {
                    applyFilteredGpsFix(
                      netPos.coords.latitude,
                      netPos.coords.longitude,
                      netPos.coords.accuracy,
                      false,
                      netPos.coords.speed,
                      netPos.coords.heading
                    );
                  }
                },
                () => {
                  // Keep waiting for GPS without placing fake pins
                },
                {
                  enableHighAccuracy: false,
                  timeout: 4000,
                  maximumAge: 60000,
                }
              );
            } catch {
              // ignore
            }
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1500,
          timeout: 10000,
        }
      );
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener(
        'buddy-native-location',
        handleNativeLocationEvent as EventListener
      );
      if (watchId !== null) {
        try {
          navigator.geolocation.clearWatch(watchId);
        } catch {
          // ignore
        }
      }
    };
  }, [applyFilteredGpsFix]);

  // Sync taught crosswalks & account approval status from Zero-Config Cloud Sync Relay
  useEffect(() => {
    const syncFromCloud = (cloudSnap = loadCloudSharedState()) => {
      setCloudApprovalRequests(cloudSnap.approvalRequests || []);
      if (cloudSnap.passadeiras && cloudSnap.passadeiras.length > 0) {
        cloudSnap.passadeiras.forEach((cw) => {
          saveCustomTaughtCrosswalk(cw);
        });
        setAmaranteCrosswalks(getAllAmaranteCrosswalks());
      }
    };
    syncFromCloud();
    const unsub = subscribeToCloudSharedState((nextCloud) => {
      syncFromCloud(nextCloud);
    });
    return () => {
      unsub();
    };
  }, []);

  // Show ONLY truly active online peer couriers (strict 90-second heartbeat TTL, never offline accounts)
  const activePeerCouriers = useMemo(() => {
    const nowMs = Date.now();
    const myId = realCourierProfile?.id || '';
    const cloudSnap = loadCloudSharedState();

    return onlineDirectoryCouriers.filter((c) => {
      if (c.isSelfProfile || (myId && c.id === myId)) return false;
      const callsignLower = (c.callsign || '').trim().toLowerCase();
      if (
        !callsignLower ||
        callsignLower === 'caio m.' ||
        callsignLower === 'caio m' ||
        callsignLower === 'cm'
      ) {
        return false;
      }
      const cloudEntry = cloudSnap.couriers?.[c.id];
      if (cloudEntry?.status === 'offline') {
        return false;
      }
      if (!c.updatedAtIso) return false;
      const updatedMs =
        typeof cloudEntry?.heartbeatAt === 'number' &&
        cloudEntry.heartbeatAt > 0
          ? cloudEntry.heartbeatAt
          : Date.parse(c.updatedAtIso);
      if (
        !Number.isFinite(updatedMs) ||
        updatedMs <= 0 ||
        nowMs - updatedMs > 90 * 1000
      ) {
        return false;
      }
      return (
        typeof c.lat === 'number' &&
        typeof c.lng === 'number' &&
        Number.isFinite(c.lat) &&
        Number.isFinite(c.lng) &&
        getDistanceKmFromAmaranteHub(c.lat, c.lng) <= 35
      );
    });
  }, [onlineDirectoryCouriers, realCourierProfile?.id, cloudApprovalRequests]);

  const totalOnlineCouriersCount = useMemo(() => {
    const selfCount = !isAppPaused ? 1 : 0;
    return selfCount + activePeerCouriers.length;
  }, [isAppPaused, activePeerCouriers.length]);

  const allMapPinPointsForOffset = useMemo(() => {
    const pts: Array<{ id: string; lat: number; lng: number }> = [];
    const selfPos = localLiveCoords || {
      lat: realCourierProfile?.lat || AMARANTE_HUB_CENTER.lat,
      lng: realCourierProfile?.lng || AMARANTE_HUB_CENTER.lng,
    };
    if (realCourierProfile?.id) {
      pts.push({
        id: realCourierProfile.id,
        lat: selfPos.lat,
        lng: selfPos.lng,
      });
    }
    activePeerCouriers.forEach((c) => {
      if (typeof c.lat === 'number' && typeof c.lng === 'number') {
        pts.push({ id: c.id, lat: c.lat, lng: c.lng });
      }
    });
    return pts;
  }, [
    localLiveCoords,
    realCourierProfile?.id,
    realCourierProfile?.lat,
    realCourierProfile?.lng,
    activePeerCouriers,
  ]);

  const handleOpenBuddyProfilePopup = useCallback(
    (courier: OnlineDirectoryCourier) => {
      setActiveBuddyPopupCourierId(courier.id);
    },
    [setActiveBuddyPopupCourierId]
  );

  // Initialize Leaflet Map once with High-Contrast Neon Tiles, Google Traffic & 35 km Regional Hub Lock
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    const initialCenter: [number, number] =
      localLiveCoords &&
      getDistanceKmFromAmaranteHub(localLiveCoords.lat, localLiveCoords.lng) <=
        35
        ? [localLiveCoords.lat, localLiveCoords.lng]
        : [AMARANTE_INITIAL_VIEW_CENTER.lat, AMARANTE_INITIAL_VIEW_CENTER.lng];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: localLiveCoords ? 16 : 14,
      minZoom: 10,
      maxZoom: 19,
      maxBounds: AMARANTE_35KM_BOUNDS,
      maxBoundsViscosity: 1.0,
      zoomControl: false,
      attributionControl: false,
    });

    const initialTileUrl =
      'https://mt1.google.com/vt/lyrs=m&hl=pt-PT&x={x}&y={y}&z={z}';
    const tileLayer = L.tileLayer(initialTileUrl, {
      minZoom: 10,
      maxZoom: 19,
    }).addTo(map);

    // Subtle Light Neon Blue (#00E5FF) 35 km regional perimeter circle around Amarante Hub
    L.circle([AMARANTE_HUB_CENTER.lat, AMARANTE_HUB_CENTER.lng], {
      radius: AMARANTE_35KM_RADIUS_METERS,
      color: '#00E5FF',
      weight: 2,
      dashArray: '8 6',
      fillColor: '#00E5FF',
      fillOpacity: 0.04,
      interactive: false,
    }).addTo(map);

    const crosswalksLayer = L.layerGroup().addTo(map);
    const learnedPathsLayer = L.layerGroup().addTo(map);
    const peerLayer = L.layerGroup().addTo(map);

    // Immediately pause auto-follow on any user touch/drag/zoom so the map NEVER snaps back while panning
    const disableAutoFollowOnUserGesture = () => {
      if (isAutoFollowRef.current) {
        isAutoFollowRef.current = false;
        setIsAutoFollowActive(false);
      }
    };

    const handleZoomChanged = () => {
      setMapZoom(map.getZoom());
    };

    map.on('dragstart', disableAutoFollowOnUserGesture);
    map.on('mousedown', disableAutoFollowOnUserGesture);
    map.on('zoomend', handleZoomChanged);
    const containerEl = mapContainerRef.current;
    if (containerEl) {
      containerEl.addEventListener(
        'touchstart',
        disableAutoFollowOnUserGesture,
        { passive: true }
      );
      containerEl.addEventListener(
        'pointerdown',
        disableAutoFollowOnUserGesture,
        { passive: true }
      );
    }

    leafletMapRef.current = map;
    tileLayerRef.current = tileLayer;
    crosswalksLayerRef.current = crosswalksLayer;
    learnedPathsLayerRef.current = learnedPathsLayer;
    peerMarkersLayerRef.current = peerLayer;
    setMapZoom(map.getZoom());

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      window.clearTimeout(timer);
      if (glidingAnimFrameRef.current !== null) {
        cancelAnimationFrame(glidingAnimFrameRef.current);
      }
      if (containerEl) {
        containerEl.removeEventListener(
          'touchstart',
          disableAutoFollowOnUserGesture
        );
        containerEl.removeEventListener(
          'pointerdown',
          disableAutoFollowOnUserGesture
        );
      }
      courierMarkersRef.current.clear();
      map.remove();
      leafletMapRef.current = null;
      tileLayerRef.current = null;
      selfMarkerRef.current = null;
      selfAccuracyCircleRef.current = null;
      crosswalksLayerRef.current = null;
      learnedPathsLayerRef.current = null;
      peerMarkersLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch between High-Contrast Clean Road Map ("MAPA_NEON"), Google Live Traffic ("TRANSITO_GOOGLE"), and Satellite ("SATELITE")
  useEffect(() => {
    const tileLayer = tileLayerRef.current;
    const containerEl = mapContainerRef.current;
    if (!tileLayer || !containerEl) return;

    containerEl.classList.remove(
      'buddy-map-neon-light',
      'buddy-map-neon-dark',
      'buddy-map-google-traffic',
      'buddy-map-satellite'
    );

    if (mapStyleMode === 'TRANSITO_GOOGLE') {
      containerEl.classList.add('buddy-map-google-traffic');
      tileLayer.setUrl(
        'https://mt1.google.com/vt/lyrs=m,traffic&hl=pt-PT&x={x}&y={y}&z={z}'
      );
    } else if (mapStyleMode === 'SATELITE') {
      containerEl.classList.add('buddy-map-satellite');
      tileLayer.setUrl(
        'https://mt1.google.com/vt/lyrs=s,h&hl=pt-PT&x={x}&y={y}&z={z}'
      );
    } else {
      containerEl.classList.add(
        isDaylight ? 'buddy-map-neon-light' : 'buddy-map-neon-dark'
      );
      tileLayer.setUrl(
        'https://mt1.google.com/vt/lyrs=m&hl=pt-PT&x={x}&y={y}&z={z}'
      );
    }
  }, [mapStyleMode, isDaylight]);

  // Render Amarante Pedestrian Crosswalks with Buddy-Styled Circular Badges + Smart Zoom Clustering (zoom >= 15 vs < 15)
  useEffect(() => {
    const cwLayer = crosswalksLayerRef.current;
    const map = leafletMapRef.current;
    if (!cwLayer) return;
    cwLayer.clearLayers();

    if (amaranteCrosswalks.length === 0) return;

    // When zoomed out (zoom < 15), show a single clean Buddy regional cluster badge instead of 52+ pins covering streets
    if (mapZoom < 15) {
      const clusterIcon = L.divIcon({
        className: 'buddy-crosswalk-cluster-pin',
        html: `<div style="display:flex;align-items:center;gap:5px;transform:translate(-50%,-50%);background:#090D16;color:#FFFFFF;border:1.5px solid #00E5FF;border-radius:9999px;padding:3px 9px;font-size:11px;font-weight:900;white-space:nowrap;box-shadow:0 0 12px rgba(0,229,255,0.45);cursor:pointer;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:9999px;background:#00E5FF;color:#090D16;font-size:10px;font-weight:900;">P</span>
          <span>${amaranteCrosswalks.length} Passadeiras (Zoom +)</span>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const clusterMarker = L.marker(
        [AMARANTE_INITIAL_VIEW_CENTER.lat, AMARANTE_INITIAL_VIEW_CENTER.lng],
        { icon: clusterIcon, zIndexOffset: 400 }
      );
      clusterMarker.on('click', () => {
        map?.setView(
          [AMARANTE_INITIAL_VIEW_CENTER.lat, AMARANTE_INITIAL_VIEW_CENTER.lng],
          16,
          { animate: true }
        );
      });
      clusterMarker.addTo(cwLayer);
      return;
    }

    // When zoomed in (zoom >= 15), render sleek circular Buddy-styled neon-blue & white crosswalk icons (24x24px)
    amaranteCrosswalks.forEach((cw) => {
      const isTaught = cw.source === 'COURIER_TAUGHT';
      const borderCol = isTaught ? '#00E5FF' : '#00B8D4';
      const cwIcon = L.divIcon({
        className: 'buddy-crosswalk-pin',
        html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">
          <div style="width:24px;height:24px;border-radius:9999px;background:#090D16;border:2px solid ${borderCol};display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(0,229,255,0.5);">
            <svg viewBox="0 0 24 24" style="width:14px;height:14px;" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="4.5" r="2" fill="#FFFFFF" />
              <path d="M9.5 13.5L11 9.5H13.5L15 13.5M10.5 13.5L9 17.5M13.5 13.5L15 17.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <line x1="4" y1="20.5" x2="8" y2="20.5" stroke="#00E5FF" stroke-width="2.2" stroke-linecap="round" />
              <line x1="10.2" y1="20.5" x2="13.8" y2="20.5" stroke="#00E5FF" stroke-width="2.2" stroke-linecap="round" />
              <line x1="16" y1="20.5" x2="20" y2="20.5" stroke="#00E5FF" stroke-width="2.2" stroke-linecap="round" />
            </svg>
          </div>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([cw.lat, cw.lng], { icon: cwIcon });
      marker.on('click', () => {
        setSelectedCrosswalkForInspect(cw);
      });
      marker.addTo(cwLayer);
    });
  }, [amaranteCrosswalks, mapZoom]);

  // Render Learned Amarante Shortcuts & Entrance Paths + Live Recording Breadcrumbs
  useEffect(() => {
    const lpLayer = learnedPathsLayerRef.current;
    if (!lpLayer) return;
    lpLayer.clearLayers();

    // Render live recording breadcrumbs if active
    if (isRecordingLearnedPath && recordedPathBreadcrumbs.length > 0) {
      if (recordedPathBreadcrumbs.length >= 2) {
        L.polyline(
          recordedPathBreadcrumbs.map((pt) => [pt.lat, pt.lng] as [number, number]),
          {
            color: '#00E5FF',
            weight: 4,
            dashArray: '6 4',
            opacity: 0.95,
          }
        ).addTo(lpLayer);
      }
      const latestPt = recordedPathBreadcrumbs[recordedPathBreadcrumbs.length - 1];
      const recIcon = L.divIcon({
        className: 'buddy-learned-rec-pin',
        html: `<div style="transform:translate(-50%,-50%);background:#090D16;color:#00E5FF;border:2px solid #00E5FF;border-radius:9999px;padding:2px 7px;font-size:10px;font-weight:900;white-space:nowrap;box-shadow:0 0 12px rgba(0,229,255,0.6);">🧭 A gravar (${recordedPathBreadcrumbs.length} pts)</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([latestPt.lat, latestPt.lng], { icon: recIcon }).addTo(lpLayer);
    }

    if (mapZoom < 15) return;

    learnedPaths.forEach((path) => {
      if (Array.isArray(path.breadcrumbs) && path.breadcrumbs.length >= 2) {
        L.polyline(
          path.breadcrumbs.map((pt) => [pt.lat, pt.lng] as [number, number]),
          {
            color: '#00B8D4',
            weight: 3,
            dashArray: '5 5',
            opacity: 0.85,
          }
        ).addTo(lpLayer);
      }

      const pLat = path.entranceLat ?? path.doorLat ?? path.lat ?? 41.2689;
      const pLng = path.entranceLng ?? path.doorLng ?? path.lng ?? -8.0782;
      const pLabel =
        path.addressLabel ||
        path.addressTitle ||
        path.streetOrBuildingLabel ||
        'Morada Ensinada';
      const pTeacher =
        path.taughtBy || path.taughtByCallsign || path.taughtByCourierName || 'Buddy';

      const pathIcon = L.divIcon({
        className: 'buddy-learned-path-pin',
        html: `<div title="${pLabel}: ${path.entranceNote}" style="display:flex;align-items:center;gap:4px;transform:translate(-50%,-50%);background:#090D16;color:#00E5FF;border:1.5px solid #00E5FF;border-radius:9999px;padding:2px 7px;font-size:10px;font-weight:900;white-space:nowrap;box-shadow:0 0 10px rgba(0,229,255,0.45);cursor:pointer;">
          <span>🧭</span>
          <span style="max-width:110px;overflow:hidden;text-overflow:ellipsis;">${pLabel}</span>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([pLat, pLng], { icon: pathIcon });
      marker.on('click', () => {
        setCrosswalkFeedbackBanner(
          `🧭 ${pLabel}: "${path.entranceNote}" (por ${pTeacher})`
        );
        speakTextPt(
          `Acesso ensinado em ${pLabel}: ${path.entranceNote}`
        );
      });
      marker.addTo(lpLayer);
    });
  }, [
    learnedPaths,
    mapZoom,
    isRecordingLearnedPath,
    recordedPathBreadcrumbs,
    speakTextPt,
  ]);

  // Update logged-in user's real GPS marker with the Dynamic 3-State Robot Mascot, Heading Cone & Gliding
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const effectiveSelfCoords = localLiveCoords || {
      lat: realCourierProfile?.lat || AMARANTE_HUB_CENTER.lat,
      lng: realCourierProfile?.lng || AMARANTE_HUB_CENTER.lng,
    };

    const posForInit = displayedGlidingCoordsRef.current || effectiveSelfCoords;
    const selfId = realCourierProfile?.id || 'self';
    const offsetSelfPos = computeSameLocationPinOffset(
      selfId,
      posForInit.lat,
      posForInit.lng,
      allMapPinPointsForOffset
    );
    const latLng: [number, number] = [offsetSelfPos.lat, offsetSelfPos.lng];
    const selfCallsign = (realCourierProfile?.name || 'Tu').trim();
    const dotColor =
      currentMascotState === 'DELIVERY'
        ? '#00E5FF'
        : currentMascotState === 'INACTIVE'
          ? '#00B8D4'
          : '#00E5FF';

    // Update or create accuracy circle
    if (selfAccuracyCircleRef.current) {
      selfAccuracyCircleRef.current.setLatLng([
        posForInit.lat,
        posForInit.lng,
      ]);
      selfAccuracyCircleRef.current.setRadius(liveAccuracyMeters);
      selfAccuracyCircleRef.current.setStyle({
        color: dotColor,
        fillColor: dotColor,
      });
    } else {
      selfAccuracyCircleRef.current = L.circle(
        [posForInit.lat, posForInit.lng],
        {
          radius: liveAccuracyMeters,
          color: dotColor,
          weight: 1.5,
          fillColor: dotColor,
          fillOpacity: 0.14,
          interactive: false,
        }
      ).addTo(map);
    }

    const headingArrowHtml =
      headingDeg !== null
        ? `<div style="position:absolute;inset:-8px;transform:rotate(${headingDeg}deg);pointer-events:none;display:flex;justify-content:center;align-items:flex-start;">
             <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid #00E5FF;filter:drop-shadow(0 0 6px #00E5FF);"></div>
           </div>`
        : '';

    // Dynamic 3-State Transparent Neon-Blue Robot Mascot GPS Pin for logged-in user
    const selfIcon = L.divIcon({
      className: 'buddy-clean-self-pin',
      html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);">
        <div style="position:relative;width:54px;height:54px;display:flex;align-items:center;justify-content:center;">
          ${headingArrowHtml}
          <span style="position:absolute;inset:-3px;border-radius:9999px;background:${dotColor};opacity:0.28;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
          <div style="width:52px;height:52px;border-radius:9999px;background:transparent;border:2.5px solid ${dotColor};display:flex;align-items:center;justify-content:center;padding:1px;">
            <img src="${currentMascotImageUrl}" alt="Buddy" style="width:100%;height:100%;object-fit:contain;" />
          </div>
        </div>
        <span style="margin-top:2px;background:#09090b;color:#ffffff;font-size:11px;font-weight:900;padding:2px 8px;border-radius:9999px;border:1.5px solid ${dotColor};white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.45);">
          ${selfCallsign}
        </span>
      </div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    if (selfMarkerRef.current) {
      selfMarkerRef.current.setLatLng(latLng);
      selfMarkerRef.current.setIcon(selfIcon);
    } else {
      selfMarkerRef.current = L.marker(latLng, {
        icon: selfIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    }

    // Smooth Auto-Follow Mode
    if (!hasCenteredOnFirstFixRef.current) {
      hasCenteredOnFirstFixRef.current = true;
      map.setView([effectiveSelfCoords.lat, effectiveSelfCoords.lng], 17, {
        animate: true,
      });
    } else if (isAutoFollowRef.current) {
      map.panTo([effectiveSelfCoords.lat, effectiveSelfCoords.lng], {
        animate: true,
        duration: 0.45,
      });
    }
  }, [
    localLiveCoords,
    liveAccuracyMeters,
    realCourierProfile?.id,
    realCourierProfile?.name,
    realCourierProfile?.lat,
    realCourierProfile?.lng,
    isAppPaused,
    currentMascotState,
    currentMascotImageUrl,
    headingDeg,
    allMapPinPointsForOffset,
  ]);

  // Render active peer couriers with persistent Map<string, L.Marker> (ZERO blinking/flickering on sync polls)
  useEffect(() => {
    const peerLayer = peerMarkersLayerRef.current;
    if (!peerLayer) return;

    const activeIds = new Set<string>();

    activePeerCouriers.forEach((c) => {
      if (typeof c.lat !== 'number' || typeof c.lng !== 'number') return;
      activeIds.add(c.id);

      const offsetPeerPos = computeSameLocationPinOffset(
        c.id,
        c.lat,
        c.lng,
        allMapPinPointsForOffset
      );
      const isFree = c.orderStatus === 'DISPONIVEL';
      const cloudReq = cloudApprovalRequests.find(
        (r) =>
          r.id === c.id ||
          r.username.trim().toLowerCase() === c.callsign.trim().toLowerCase()
      );
      const isPendingApproval =
        cloudReq?.approvalStatus === 'pending' &&
        !c.callsign.toLowerCase().includes('presidente');
      const ringColor = isPendingApproval
        ? '#f59e0b'
        : isFree
          ? '#00E5FF'
          : '#00B8D4';
      const statusBadgeLabel = isPendingApproval
        ? '⏳ Pendente'
        : isFree
          ? 'Online'
          : 'Em Entrega';

      const avatarSource = c.avatarPhotoUrl || currentMascotImageUrl;
      const signature = `${c.callsign}|${statusBadgeLabel}|${ringColor}|${avatarSource}`;

      const avatarInnerHtml = c.avatarPhotoUrl
        ? `<img src="${c.avatarPhotoUrl}" alt="${c.callsign}" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" />`
        : `<img src="${currentMascotImageUrl}" alt="${c.callsign}" style="width:100%;height:100%;object-fit:contain;" />`;

      const buildPeerIcon = () =>
        L.divIcon({
          className: 'buddy-clean-peer-pin',
          html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">
            <div style="position:relative;width:46px;height:46px;display:flex;align-items:center;justify-content:center;">
              <span style="position:absolute;inset:-2px;border-radius:9999px;background:${ringColor};opacity:0.22;box-shadow:0 0 12px ${ringColor};"></span>
              <div style="width:44px;height:44px;border-radius:9999px;background:#090D16;border:2px solid ${ringColor};display:flex;align-items:center;justify-content:center;padding:1px;box-shadow:0 2px 8px rgba(0,0,0,0.55);">
                ${avatarInnerHtml}
              </div>
            </div>
            <span style="margin-top:2px;background:rgba(9,13,22,0.95);color:#ffffff;font-size:10px;font-weight:900;padding:1.5px 7px;border-radius:9999px;border:1.5px solid ${ringColor};white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.5);">
              ${c.callsign} • <span style="color:${ringColor};font-size:9px;">${statusBadgeLabel}</span>
            </span>
          </div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

      const existingEntry = courierMarkersRef.current.get(c.id);
      if (existingEntry) {
        existingEntry.marker.setLatLng([offsetPeerPos.lat, offsetPeerPos.lng]);
        if (existingEntry.signature !== signature) {
          existingEntry.marker.setIcon(buildPeerIcon());
          existingEntry.signature = signature;
        }
        existingEntry.marker.off('click');
        existingEntry.marker.on('click', () => {
          handleOpenBuddyProfilePopup(c);
        });
      } else {
        const marker = L.marker([offsetPeerPos.lat, offsetPeerPos.lng], {
          icon: buildPeerIcon(),
          zIndexOffset: 900,
        });
        marker.on('click', () => {
          handleOpenBuddyProfilePopup(c);
        });
        marker.addTo(peerLayer);
        courierMarkersRef.current.set(c.id, { marker, signature });
      }
    });

    // Remove markers for couriers no longer active
    Array.from(courierMarkersRef.current.entries()).forEach(([id, entry]) => {
      if (!activeIds.has(id)) {
        peerLayer.removeLayer(entry.marker);
        courierMarkersRef.current.delete(id);
      }
    });
  }, [
    activePeerCouriers,
    allMapPinPointsForOffset,
    cloudApprovalRequests,
    currentMascotImageUrl,
    handleOpenBuddyProfilePopup,
  ]);

  const handleRecenterAndFollowGps = () => {
    isAutoFollowRef.current = true;
    setIsAutoFollowActive(true);
    void refreshLiveGpsPosition();

    const currentFix = lastAcceptedCoordsRef.current || localLiveCoords;
    if (currentFix && leafletMapRef.current) {
      leafletMapRef.current.flyTo([currentFix.lat, currentFix.lng], 17, {
        animate: true,
        duration: 0.5,
      });
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const accepted = applyFilteredGpsFix(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.accuracy,
              true,
              pos.coords.speed,
              pos.coords.heading
            );
            const target = accepted || lastAcceptedCoordsRef.current;
            if (target && leafletMapRef.current && isAutoFollowRef.current) {
              leafletMapRef.current.flyTo([target.lat, target.lng], 17, {
                animate: true,
                duration: 0.5,
              });
            }
          },
          () => {
            // ignore
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      } catch {
        // ignore
      }
    }
  };

  const handleToggleFullRoadView = useCallback(() => {
    setIsFullRoadView((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('buddy-map-fullscreen-state', {
            detail: { expanded: next },
          })
        );
      }
      window.setTimeout(() => {
        leafletMapRef.current?.invalidateSize();
      }, 60);
      window.setTimeout(() => {
        leafletMapRef.current?.invalidateSize();
      }, 220);
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('buddy-map-fullscreen-state', {
            detail: { expanded: false },
          })
        );
      }
    };
  }, []);

  const handleOpenExternalNav = (app: 'WAZE' | 'GMAPS') => {
    const destQuery =
      hasRealActiveDelivery && activeDeliveryLifecycle.destinationName
        ? encodeURIComponent(`${activeDeliveryLifecycle.destinationName}, Amarante`)
        : localLiveCoords
          ? `${localLiveCoords.lat},${localLiveCoords.lng}`
          : '41.2704,-8.0818';

    const url =
      app === 'WAZE'
        ? `https://waze.com/ul?q=${destQuery}&navigate=yes`
        : `https://www.google.com/maps/dir/?api=1&destination=${destQuery}&travelmode=two-wheeler`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getDockIconButtonStyle = (isActive = false): React.CSSProperties => {
    if (isActive) {
      return {
        backgroundColor: '#00E5FF',
        borderColor: '#00E5FF',
        color: '#090D16',
        boxShadow: '0 0 14px rgba(0, 229, 255, 0.55)',
      };
    }
    return {
      backgroundColor: isDaylight ? '#FFFFFF' : '#0B0F17',
      borderColor: '#00E5FF',
      color: isDaylight ? '#00B8D4' : '#00E5FF',
      boxShadow: isDaylight
        ? '0 4px 12px rgba(9, 13, 22, 0.14)'
        : '0 4px 14px rgba(0, 0, 0, 0.65)',
    };
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col overflow-hidden">
      {/* FULL-HEIGHT INTERACTIVE WAZE-STYLE LEAFLET MAP CONTAINER */}
      <div
        className={`relative flex-1 w-full h-full min-h-[440px] overflow-hidden shadow-xl ${
          isFullRoadView
            ? 'rounded-none border-0'
            : isDaylight
              ? 'rounded-2xl border border-slate-300 bg-slate-100'
              : 'rounded-2xl border border-zinc-800 bg-zinc-950'
        }`}
      >
        {/* Leaflet Map Canvas */}
        <div
          ref={mapContainerRef}
          className="absolute inset-0 z-0 h-full w-full"
        />

        {/* TOP-LEFT FLOATING STATUS CAPSULE: Pulsing GPS Radar + Amarante 35km • Online Count + Inline 📍⚙ Hub Button */}
        <div
          style={{
            top: '12px',
            left: '12px',
            backgroundColor: isDaylight
              ? 'rgba(255, 255, 255, 0.96)'
              : 'rgba(11, 15, 23, 0.94)',
            borderColor: '#00E5FF',
            color: isDaylight ? '#090D16' : '#FFFFFF',
            boxShadow: isDaylight
              ? '0 4px 14px rgba(9, 13, 22, 0.14)'
              : '0 4px 16px rgba(0, 0, 0, 0.65)',
          }}
          className="absolute z-[430] rounded-full border-1.5 pl-2.5 pr-1.5 py-1.5 flex items-center gap-2 backdrop-blur-md"
        >
          {/* Pulsing / Blinking Light Neon Blue (#00E5FF) GPS Satellite/Radar Indicator */}
          <div
            title={
              localLiveCoords
                ? 'Sinal GPS Ativo em Tempo Real'
                : 'A sincronizar satélite GPS...'
            }
            className="relative flex items-center justify-center h-5 w-5 shrink-0"
          >
            <span className="absolute inset-0 rounded-full bg-[#00E5FF]/35 animate-ping" />
            <svg
              viewBox="0 0 24 24"
              className="relative h-4 w-4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="8.5"
                stroke="#00E5FF"
                strokeWidth="1.8"
                strokeDasharray="3 2"
              />
              <circle cx="12" cy="12" r="3.5" fill="#00E5FF" />
            </svg>
          </div>

          <span
            style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
            className="text-xs font-black tracking-tight whitespace-nowrap"
          >
            Amarante 35km
          </span>

          <span
            style={{ color: isDaylight ? '#64748B' : '#94A3B8' }}
            className="text-xs font-black select-none"
          >
            •
          </span>

          <span
            style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
            className="text-xs font-extrabold whitespace-nowrap"
          >
            {totalOnlineCouriersCount} online
          </span>

          {/* Small Inline 📍⚙ Icon Button to Open Mudar Centro */}
          <button
            type="button"
            onClick={() => setIsHubSelectorModalOpen(true)}
            title="Mudar Centro Operacional (Raio 35 km)"
            aria-label="Mudar Centro Operacional"
            style={{
              backgroundColor: isDaylight ? '#F0F9FF' : '#111827',
              borderColor: '#00E5FF',
              color: isDaylight ? '#090D16' : '#00E5FF',
            }}
            className="h-7 w-7 rounded-full border flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 21C15.5 17.4 18 14.3 18 10.5C18 7.18629 15.3137 4.5 12 4.5C8.68629 4.5 6 7.18629 6 10.5C6 14.3 8.5 17.4 12 21Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="12" cy="10.5" r="2.2" fill="currentColor" />
            </svg>
          </button>
        </div>

        {/* TOP-RIGHT COMPACT 3-ICON MAP VIEW PILL (🎯 Centrar • 🗺️ Camada • ⛶ Ecrã) */}
        <div
          style={{
            top: '12px',
            right: '12px',
            backgroundColor: isDaylight
              ? 'rgba(255, 255, 255, 0.96)'
              : 'rgba(11, 15, 23, 0.94)',
            borderColor: '#00E5FF',
            boxShadow: isDaylight
              ? '0 4px 14px rgba(9, 13, 22, 0.14)'
              : '0 4px 16px rgba(0, 0, 0, 0.65)',
          }}
          className="absolute z-[430] rounded-2xl border-1.5 p-1 flex flex-col items-center gap-1.5 backdrop-blur-md"
        >
          {/* 1. 🎯 Centrar */}
          <button
            type="button"
            onClick={handleRecenterAndFollowGps}
            title="Centrar no meu GPS"
            aria-label="Centrar no meu GPS"
            style={getDockIconButtonStyle(
              Boolean(isAutoFollowActive && localLiveCoords)
            )}
            className="h-9 w-11 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              <line
                x1="12"
                y1="2"
                x2="12"
                y2="5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="19"
                x2="12"
                y2="22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="2"
                y1="12"
                x2="5"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="19"
                y1="12"
                x2="22"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* 2. 🗺️ Camada (Cycles: Mapa Limpo -> 🚦 Trânsito -> 🛰️ Satélite with tiny active label) */}
          <button
            type="button"
            onClick={handleCycleMapLayer}
            title="Alternar Camada do Mapa (Mapa Limpo / Trânsito / Satélite)"
            aria-label="Alternar Camada do Mapa"
            style={getDockIconButtonStyle(mapStyleMode !== 'MAPA_NEON')}
            className="h-11 w-11 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition active:scale-95 px-0.5"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3.5 6.5L9 4L15 6.5L20.5 4V17.5L15 20L9 17.5L3.5 20V6.5Z"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinejoin="round"
              />
              <line
                x1="9"
                y1="4"
                x2="9"
                y2="17.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <line
                x1="15"
                y1="6.5"
                x2="15"
                y2="20"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
            <span
              style={{ fontSize: '9px', lineHeight: 1.05 }}
              className="font-black tracking-tight mt-0.5 truncate max-w-full"
            >
              {mapStyleMode === 'MAPA_NEON'
                ? 'Limpo'
                : mapStyleMode === 'TRANSITO_GOOGLE'
                  ? 'Trânsito'
                  : 'Satélite'}
            </span>
          </button>

          {/* 3. ⛶ Ecrã (Fullscreen Toggle) */}
          <button
            type="button"
            onClick={handleToggleFullRoadView}
            title={
              isFullRoadView
                ? 'Sair do Ecrã Inteiro'
                : 'Ampliar Mapa em Ecrã Inteiro'
            }
            aria-label="Alternar Mapa em Ecrã Inteiro"
            style={getDockIconButtonStyle(isFullRoadView)}
            className="h-9 w-11 rounded-xl border flex items-center justify-center cursor-pointer transition active:scale-95"
          >
            {isFullRoadView ? (
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M9 4V9H4M15 4V9H20M9 20V15H4M15 20V15H20"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4 9V4H9M20 9V4H15M4 15V20H9M20 15V20H15"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        {/* BOTTOM-RIGHT DISTINCT "➕ Marcar" ACTION BUTTON (Separated safely away from map view controls) */}
        <div
          style={{
            bottom: hasRealActiveDelivery ? '68px' : '20px',
            right: '12px',
          }}
          className="absolute z-[430]"
        >
          <button
            type="button"
            onClick={() => setIsMarkMapModalOpen(true)}
            title="Ensinar Passadeira ou Reportar Perigo na Via"
            aria-label="Marcar no Mapa"
            style={{
              backgroundColor: '#090D16',
              borderColor: '#00E5FF',
              color: '#00E5FF',
              boxShadow: '0 4px 16px rgba(0, 229, 255, 0.38)',
            }}
            className="rounded-2xl border-2 px-3.5 py-2.5 flex items-center gap-1.5 font-black text-xs cursor-pointer transition active:scale-95"
          >
            <Plus className="h-4 w-4 text-[#00E5FF] stroke-[3]" />
            <span>Marcar</span>
          </button>
        </div>

        {/* TOP HUD ALERTS: Crosswalk Proximity Heads-Up (<= 45m & > 28 km/h) or Taught Confirmation */}
        {(approachingCrosswalkAlert || crosswalkFeedbackBanner) && (
          <div className="absolute top-14 left-3 right-16 z-[450] flex flex-col items-start gap-1.5 pointer-events-none">
            {approachingCrosswalkAlert && (
              <div
                style={{
                  backgroundColor: '#0B0F17',
                  borderColor: '#00E5FF',
                  color: '#FFFFFF',
                }}
                className="pointer-events-auto rounded-2xl border-2 px-3.5 py-2 shadow-[0_0_20px_rgba(0,229,255,0.55)] flex items-center gap-2.5 animate-pulse"
              >
                <div className="h-6 w-6 rounded-full bg-[#090D16] border border-[#00E5FF] flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-[#00E5FF]">P</span>
                </div>
                <div>
                  <span className="text-xs font-black text-[#00E5FF] block leading-tight">
                    Passadeira à frente ({approachingCrosswalkAlert.distanceMeters}m)
                  </span>
                  <span className="text-[11px] font-bold text-zinc-200 block leading-tight">
                    {approachingCrosswalkAlert.streetLabel}
                  </span>
                </div>
              </div>
            )}

            {crosswalkFeedbackBanner && (
              <div
                style={{
                  backgroundColor: '#0B0F17',
                  borderColor: '#00E5FF',
                  color: '#00E5FF',
                }}
                className="pointer-events-auto rounded-2xl border px-3.5 py-2 text-xs font-extrabold shadow-lg"
              >
                {crosswalkFeedbackBanner}
              </div>
            )}
          </div>
        )}

        {/* LIVE GPS PATH LEARNING RECORDING HUD BAR ("Buddy, ensinar caminho") */}
        {isRecordingLearnedPath && (
          <div className="absolute top-14 left-3 right-16 z-[460] flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-[#00E5FF] bg-[#090D16]/95 px-3.5 py-2.5 text-white shadow-[0_0_22px_rgba(0,229,255,0.55)]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00E5FF] animate-ping shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-black text-[#00E5FF] truncate">
                  🧭 A Gravar Caminho GPS ({recordedPathBreadcrumbs.length} pts)
                </p>
                <p className="text-[10px] font-bold text-zinc-300 truncate">
                  Conduz até à entrada certa e toca em Guardar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleOpenSaveLearnedPathModal}
                className="rounded-xl bg-[#00E5FF] text-[#090D16] px-3 py-1.5 text-[11px] font-black cursor-pointer shadow-md"
              >
                💾 Guardar Caminho
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRecordingLearnedPath(false);
                  setRecordedPathBreadcrumbs([]);
                }}
                className="rounded-xl border border-rose-500/60 bg-rose-950/60 text-rose-200 px-2.5 py-1.5 text-[11px] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* WAZE-STYLE SPEEDOMETER & ROAD LIMIT HUD (Positioned cleanly at bottom: 20px inside map container) */}
        <div
          style={{ bottom: '20px', left: '12px' }}
          className="absolute z-[420] flex items-center gap-2 pointer-events-none"
        >
          <div
            style={{
              backgroundColor: isDaylight
                ? 'rgba(255, 255, 255, 0.96)'
                : 'rgba(11, 15, 23, 0.95)',
              borderColor: isSpeedAlertPulsing
                ? '#00E5FF'
                : isDaylight
                  ? '#00B8D4'
                  : 'rgba(0, 229, 255, 0.45)',
              boxShadow: isSpeedAlertPulsing
                ? '0 0 22px rgba(0, 229, 255, 0.85)'
                : '0 4px 16px rgba(0, 0, 0, 0.45)',
            }}
            className={`pointer-events-auto rounded-2xl border-2 px-3 py-2 flex items-center gap-2.5 transition-all ${
              isSpeedAlertPulsing ? 'animate-pulse' : ''
            }`}
          >
            {/* Current GPS Speed (km/h) */}
            <div className="text-center min-w-[44px]">
              <span
                style={{
                  color: isSpeedAlertPulsing
                    ? '#00E5FF'
                    : isDaylight
                      ? '#090D16'
                      : '#FFFFFF',
                }}
                className="text-2xl font-black leading-none block tabular-nums"
              >
                {currentSpeedKmh}
              </span>
              <span
                style={{ color: isDaylight ? '#475569' : '#94A3B8' }}
                className="text-[10px] font-extrabold uppercase tracking-wider block mt-0.5"
              >
                km/h
              </span>
            </div>

            {/* Circular European Road Speed Limit Sign (30 / 50 / 70 / 90) */}
            <div
              title={`Limite da via (${roadNameLabel}): ${roadLimitKmh} km/h`}
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#EF4444',
                color: '#090D16',
              }}
              className="h-10 w-10 rounded-full border-[3.5px] flex flex-col items-center justify-center shrink-0 shadow-sm"
            >
              <span
                style={{ color: '#090D16' }}
                className="text-xs font-black leading-none"
              >
                {roadLimitKmh}
              </span>
            </div>

            {/* Subtle 20s Over-Speed Progress / Road Label & Crosswalk Count */}
            <div className="min-w-0 max-w-[128px]">
              <span
                style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                className="text-[11px] font-extrabold block truncate leading-tight"
              >
                {roadNameLabel}
              </span>
              {consecutiveOverSpeedSec > 0 ? (
                <span className="text-[10px] font-extrabold text-[#00E5FF] block leading-tight mt-0.5">
                  {consecutiveOverSpeedSec >= 20
                    ? '🔔 20s > Limite (Reduzir)'
                    : `Acima +10: ${consecutiveOverSpeedSec}s / 20s`}
                </span>
              ) : (
                <span
                  style={{ color: isDaylight ? '#00838F' : '#00E5FF' }}
                  className="text-[10px] font-bold block leading-tight mt-0.5"
                >
                  {amaranteCrosswalks.length} passadeiras
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Optional Active Delivery Quick External Navigation Buttons (Bottom-Right Corner Only When Active Order Exists) */}
        {hasRealActiveDelivery && (
          <div
            style={{ bottom: '20px', right: '12px' }}
            className="absolute z-[420] flex items-center gap-1.5"
          >
            <button
              type="button"
              onClick={() => handleOpenExternalNav('WAZE')}
              style={{
                backgroundColor: isDaylight ? '#FFFFFF' : '#0B0F17',
                borderColor: '#00E5FF',
                color: isDaylight ? '#090D16' : '#00E5FF',
              }}
              className="rounded-xl border-1.5 px-2.5 py-2 text-xs font-extrabold shadow-lg flex items-center gap-1 cursor-pointer"
            >
              <Navigation className="h-3.5 w-3.5 text-[#00E5FF]" />
              <span>Waze</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenExternalNav('GMAPS')}
              style={{
                backgroundColor: isDaylight ? '#FFFFFF' : '#0B0F17',
                borderColor: '#00E5FF',
                color: isDaylight ? '#090D16' : '#00E5FF',
              }}
              className="rounded-xl border-1.5 px-2.5 py-2 text-xs font-extrabold shadow-lg flex items-center gap-1 cursor-pointer"
            >
              <Navigation className="h-3.5 w-3.5 text-[#00E5FF]" />
              <span>Maps</span>
            </button>
          </div>
        )}

        {/* MANDATORY CONFIRMATION MODAL BEFORE ADDING CROSSWALKS / ALERTS + 1-TAP UNDO/DELETE */}
        {isMarkMapModalOpen && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
            onClick={() => setIsMarkMapModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: isDaylight ? '#FFFFFF' : '#0B0F17',
                borderColor: '#00E5FF',
                color: isDaylight ? '#090D16' : '#FFFFFF',
              }}
              className="w-full max-w-sm rounded-3xl border-2 p-5 shadow-2xl space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                    className="text-base font-black tracking-tight"
                  >
                    ➕ Ensinar / Marcar no Mapa
                  </h3>
                  <p
                    style={{ color: isDaylight ? '#475569' : '#94A3B8' }}
                    className="text-xs font-bold mt-0.5"
                  >
                    Via atual: <strong className="text-[#00B8D4]">{roadNameLabel}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMarkMapModalOpen(false)}
                  className="h-8 w-8 rounded-full border border-[#00E5FF]/40 flex items-center justify-center cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2.5 pt-1">
                {/* Option 1: Confirm New Crosswalk Here */}
                <button
                  type="button"
                  onClick={handleConfirmTeachCrosswalkHere}
                  style={{
                    backgroundColor: '#090D16',
                    borderColor: '#00E5FF',
                    color: '#00E5FF',
                  }}
                  className="w-full rounded-2xl border-2 px-4 py-3 text-left font-black text-xs flex items-center justify-between cursor-pointer transition active:scale-98"
                >
                  <span>🚸 Confirmar Nova Passadeira Aqui</span>
                  <span className="text-[11px] font-extrabold bg-[#00E5FF]/15 px-2 py-0.5 rounded-full">
                    +15 Coins
                  </span>
                </button>

                {/* Option 2: Live Route & Entrance Learning ("Buddy, ensinar caminho") */}
                <button
                  type="button"
                  onClick={handleStartLearnedPathRecording}
                  style={{
                    backgroundColor: isDaylight ? '#ECFEFF' : '#091520',
                    borderColor: '#00E5FF',
                    color: isDaylight ? '#090D16' : '#00E5FF',
                  }}
                  className="w-full rounded-2xl border-2 px-4 py-3 text-left font-black text-xs flex items-center justify-between cursor-pointer transition active:scale-98"
                >
                  <span>🧭 Ensinar Caminho / Entrada GPS (&quot;Buddy, ensinar caminho&quot;)</span>
                  <span className="text-[11px] font-extrabold bg-[#00E5FF]/20 px-2 py-0.5 rounded-full">
                    +25 Coins
                  </span>
                </button>

                {/* Option 3: Report Road Hazard */}
                <button
                  type="button"
                  onClick={handleReportRoadHazardHere}
                  style={{
                    backgroundColor: isDaylight ? '#F8FAFC' : '#111827',
                    borderColor: '#00B8D4',
                    color: isDaylight ? '#090D16' : '#FFFFFF',
                  }}
                  className="w-full rounded-2xl border px-4 py-3 text-left font-extrabold text-xs flex items-center justify-between cursor-pointer transition active:scale-98"
                >
                  <span>⚠️ Reportar Perigo na Via (Obras / Buraco / Acidente)</span>
                </button>

                {/* Option 4: Delete Last Crosswalk Marked by Mistake */}
                <button
                  type="button"
                  onClick={handleDeleteLatestCrosswalk}
                  style={{
                    backgroundColor: isDaylight ? '#FFF1F2' : '#1F1218',
                    borderColor: '#F43F5E',
                    color: isDaylight ? '#BE123C' : '#FDA4AF',
                  }}
                  className="w-full rounded-2xl border px-4 py-3 text-left font-extrabold text-xs flex items-center justify-between cursor-pointer transition active:scale-98"
                >
                  <span>🗑️ Apagar Última Passadeira Marcada por Engano</span>
                </button>

                {/* Option 5: Cancel */}
                <button
                  type="button"
                  onClick={() => setIsMarkMapModalOpen(false)}
                  style={{
                    backgroundColor: isDaylight ? '#F1F5F9' : '#1E293B',
                    color: isDaylight ? '#334155' : '#CBD5E1',
                  }}
                  className="w-full rounded-2xl py-2.5 text-center font-black text-xs cursor-pointer"
                >
                  ✕ Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SAVE LEARNED GPS PATH & ENTRANCE NOTE MODAL */}
        {isSaveLearnedPathModalOpen && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
            onClick={() => setIsSaveLearnedPathModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: isDaylight ? '#FFFFFF' : '#0B0F17',
                borderColor: '#00E5FF',
                color: isDaylight ? '#090D16' : '#FFFFFF',
              }}
              className="w-full max-w-sm rounded-3xl border-2 p-5 shadow-2xl space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                    className="text-base font-black tracking-tight"
                  >
                    🧭 Guardar Caminho & Entrada
                  </h3>
                  <p
                    style={{ color: isDaylight ? '#475569' : '#94A3B8' }}
                    className="text-xs font-bold mt-0.5"
                  >
                    Partilhado na Cloud com todos os estafetas de Amarante
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSaveLearnedPathModalOpen(false)}
                  className="h-8 w-8 rounded-full border border-[#00E5FF]/40 flex items-center justify-center cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#00B8D4] block mb-1">
                    Morada / Condomínio / Restaurante
                  </label>
                  <input
                    type="text"
                    value={learnedPathAddressInput}
                    onChange={(e) => setLearnedPathAddressInput(e.target.value)}
                    placeholder="Ex: Urb. Quinta de S. Gonçalo Bloco C"
                    style={{
                      backgroundColor: isDaylight ? '#F8FAFC' : '#090D16',
                      borderColor: '#00E5FF',
                      color: isDaylight ? '#090D16' : '#FFFFFF',
                    }}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#00B8D4] block mb-1">
                    Nota de Entrada / Atalho (Falada pelo Buddy)
                  </label>
                  <textarea
                    rows={2}
                    value={learnedPathNoteInput}
                    onChange={(e) => setLearnedPathNoteInput(e.target.value)}
                    placeholder="Ex: Entrada pelo portão lateral junto ao Rio Tâmega. Campainha à direita."
                    style={{
                      backgroundColor: isDaylight ? '#F8FAFC' : '#090D16',
                      borderColor: '#00E5FF',
                      color: isDaylight ? '#090D16' : '#FFFFFF',
                    }}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Entrada pelo portão lateral junto ao Rio Tâmega',
                    'Entrar pelas traseiras (rampa de garagem)',
                    'Subir escadas laterais para evitar rua bloqueada',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLearnedPathNoteInput(preset)}
                      className="rounded-lg border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-2 py-1 text-[10px] font-bold text-[#00B8D4] cursor-pointer text-left"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveLearnedPathNow}
                    className="flex-1 rounded-2xl bg-[#00E5FF] text-[#090D16] py-2.5 text-xs font-black cursor-pointer shadow-md"
                  >
                    💾 Guardar & Sincronizar (+25 Coins)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSaveLearnedPathModalOpen(false)}
                    style={{
                      backgroundColor: isDaylight ? '#F1F5F9' : '#1E293B',
                      color: isDaylight ? '#334155' : '#CBD5E1',
                    }}
                    className="rounded-2xl px-4 py-2.5 text-xs font-black cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CROSSWALK INSPECTION & 1-TAP REMOVAL MODAL (When tapping any crosswalk badge on the map) */}
        {selectedCrosswalkForInspect && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
            onClick={() => setSelectedCrosswalkForInspect(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: isDaylight ? '#FFFFFF' : '#0B0F17',
                borderColor: '#00E5FF',
                color: isDaylight ? '#090D16' : '#FFFFFF',
              }}
              className="w-full max-w-xs rounded-3xl border-2 p-4 shadow-2xl space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#00B8D4] block">
                    Passadeira Mapeada (Alerta &lt;45m)
                  </span>
                  <h4
                    style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
                    className="text-sm font-black mt-0.5"
                  >
                    {selectedCrosswalkForInspect.streetLabel}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCrosswalkForInspect(null)}
                  className="h-7 w-7 rounded-full border border-[#00E5FF]/40 flex items-center justify-center cursor-pointer shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleRemoveCrosswalkById(
                      selectedCrosswalkForInspect.id,
                      selectedCrosswalkForInspect.streetLabel
                    )
                  }
                  style={{
                    backgroundColor: isDaylight ? '#FFF1F2' : '#1F1218',
                    borderColor: '#F43F5E',
                    color: isDaylight ? '#BE123C' : '#FDA4AF',
                  }}
                  className="w-full rounded-xl border px-3 py-2.5 text-xs font-extrabold cursor-pointer text-center"
                >
                  🗑️ Remover se marcada por engano
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCrosswalkForInspect(null)}
                  style={{
                    backgroundColor: isDaylight ? '#F1F5F9' : '#1E293B',
                    color: isDaylight ? '#090D16' : '#FFFFFF',
                  }}
                  className="w-full rounded-xl py-2 text-xs font-bold cursor-pointer text-center"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <OperationalHubSelectorModal
        isOpen={isHubSelectorModalOpen}
        onClose={() => setIsHubSelectorModalOpen(false)}
      />
    </div>
  );
};
