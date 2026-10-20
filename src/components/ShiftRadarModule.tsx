import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Navigation,
  Compass,
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
  computeBearingDegrees,
  computeHaversineMeters,
  fetchAmaranteCrosswalksFromOverpass,
  getAllAmaranteCrosswalks,
  getAngleDifferenceDeg,
  recordLiveSpeedSampleForDelivery,
  resolveRoadSpeedLimitAtCoords,
  saveCustomTaughtCrosswalk,
} from '../utils/amaranteCopilotTelemetry';
import { playBuddyOpenChime } from '../services/voiceEngine';

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
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-100 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-zinc-300" />
            <span>Reportar Perigo na Via em 1 Toque (Amarante 35 km)</span>
          </span>
          <span className="text-base text-emerald-500 font-bold">
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
              className="rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 py-2 px-1.5 text-xs font-semibold cursor-pointer transition text-center"
            >
              {h.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-2.5">
        <span className="text-xs font-semibold text-zinc-100 block">
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
                className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-zinc-100 block truncate">
                    {pin.hazardType}
                  </span>
                  <span className="text-[11px] text-zinc-400 block truncate">
                    <MapPin className="inline h-3 w-3 mr-0.5 text-zinc-500" />
                    {pin.streetLocation} ({pin.confirmations} conf.)
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => confirmRoadHazardPin(pin.id)}
                    className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 text-[10px] font-medium cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveRoadHazardPin(pin.id)}
                    className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-2.5 py-1 text-[10px] cursor-pointer"
                  >
                    Limpo
                  </button>
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
  const [isHubSelectorModalOpen, setIsHubSelectorModalOpen] =
    useState<boolean>(false);
  const [isAutoFollowActive, setIsAutoFollowActive] = useState<boolean>(true);
  const [liveAccuracyMeters, setLiveAccuracyMeters] = useState<number>(12);
  const [localLiveCoords, setLocalLiveCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(() => {
    if (
      realCourierProfile?.gpsSource === 'LIVE_GPS' &&
      Number.isFinite(realCourierProfile.lat) &&
      Number.isFinite(realCourierProfile.lng)
    ) {
      return {
        lat: realCourierProfile.lat,
        lng: realCourierProfile.lng,
      };
    }
    return null;
  });

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

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const selfMarkerRef = useRef<L.Marker | null>(null);
  const selfAccuracyCircleRef = useRef<L.Circle | null>(null);
  const peerMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const crosswalksLayerRef = useRef<L.LayerGroup | null>(null);
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
        const dtSec = Math.max(0.5, (nowMs - lastFixTimestampMsRef.current) / 1000);

        if (distMeters >= 3 && dtSec <= 25) {
          computedDeltaKmh = Math.min(135, Math.round((distMeters / dtSec) * 3.6));
          if (computedBearing === null) {
            computedBearing = Math.round(
              computeBearingDegrees(prev.lat, prev.lng, lat, lng)
            );
          }
        }

        // 6-meter minimum movement filter (deadband) to prevent stationary pin jitter
        if (!forceAccept && distMeters < 6) {
          if (
            typeof rawSpeedMetersPerSec === 'number' &&
            Number.isFinite(rawSpeedMetersPerSec) &&
            rawSpeedMetersPerSec >= 0
          ) {
            const gpsKmh = Math.round(rawSpeedMetersPerSec * 3.6);
            currentSpeedRef.current = gpsKmh < 3 ? 0 : gpsKmh;
            setCurrentSpeedKmh(currentSpeedRef.current);
          }
          return null;
        }
      }

      lastFixTimestampMsRef.current = nowMs;

      const resolvedSpeedKmh =
        typeof rawSpeedMetersPerSec === 'number' &&
        Number.isFinite(rawSpeedMetersPerSec) &&
        rawSpeedMetersPerSec >= 0
          ? Math.round(rawSpeedMetersPerSec * 3.6)
          : computedDeltaKmh !== null
            ? computedDeltaKmh
            : currentSpeedRef.current;

      const cleanSpeedKmh = resolvedSpeedKmh < 3 ? 0 : resolvedSpeedKmh;
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

      // Query dynamic road speed limit (Overpass maxspeed + Amarante urban/EN15 heuristic)
      void resolveRoadSpeedLimitAtCoords(nextCoords.lat, nextCoords.lng).then(
        (res) => {
          roadLimitRef.current = res.limit;
          setRoadLimitKmh(res.limit);
          setRoadNameLabel(res.roadName);
        }
      );

      // Evaluate crosswalk proximity (<= 45m & > 28 km/h)
      evaluateCrosswalkProximity(
        nextCoords.lat,
        nextCoords.lng,
        cleanSpeedKmh,
        computedBearing
      );

      return nextCoords;
    },
    [animateMarkerGlideTo, evaluateCrosswalkProximity]
  );

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

  // 1-Tap & Voice Command Handler: Teach / Mark New Pedestrian Crosswalk at Current Location
  const handleTeachCrosswalkHere = useCallback(() => {
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
    setAmaranteCrosswalks(getAllAmaranteCrosswalks());
    addRoadHazardPin(
      'Obras na Via / Desvio',
      `🚸 Passadeira Ensinada: ${label}`,
      'Amarante — Centro / São Gonçalo'
    );
    awardBuddyRewardTask('ALERTAR_ANOMALIA_MAPA_15');

    setCrosswalkFeedbackBanner(
      `🚸 Passadeira marcada em ${roadNameLabel} (+15 Coins • Sincronizada com Buddys)`
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

  useEffect(() => {
    const onVoiceMarkCrosswalk = () => {
      handleTeachCrosswalkHere();
    };
    window.addEventListener(
      'buddy-voice-mark-crosswalk',
      onVoiceMarkCrosswalk
    );
    return () => {
      window.removeEventListener(
        'buddy-voice-mark-crosswalk',
        onVoiceMarkCrosswalk
      );
    };
  }, [handleTeachCrosswalkHere]);

  // Strict 20-Second Continuous Over-Speed Monitor (> roadLimit + 10 km/h)
  // Resets immediately to 0s if speed drops below roadLimit + 10 km/h (freedom for overtakes)
  useEffect(() => {
    const ticker = window.setInterval(() => {
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

  // Sync from context when real device GPS updates (through 10m deadband filter)
  useEffect(() => {
    if (
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

  // Only show active peer couriers (within last 5 minutes, excluding self and ghost rows)
  const activePeerCouriers = useMemo(() => {
    const nowMs = Date.now();
    const myId = realCourierProfile?.id || '';
    const myNameLower = (realCourierProfile?.name || '').trim().toLowerCase();

    return onlineDirectoryCouriers.filter((c) => {
      if (c.isSelfProfile || (myId && c.id === myId)) return false;
      const callsignLower = (c.callsign || '').trim().toLowerCase();
      if (
        !callsignLower ||
        callsignLower === 'caio m.' ||
        callsignLower === 'caio' ||
        callsignLower === 'cm' ||
        (myNameLower && callsignLower === myNameLower)
      ) {
        return false;
      }
      if (!c.updatedAtIso) return false;
      const updatedMs = Date.parse(c.updatedAtIso);
      if (!Number.isFinite(updatedMs) || nowMs - updatedMs > 5 * 60 * 1000) {
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
  }, [onlineDirectoryCouriers, realCourierProfile?.id, realCourierProfile?.name]);

  const totalOnlineCouriersCount = useMemo(() => {
    const selfCount = !isAppPaused ? 1 : 0;
    return selfCount + activePeerCouriers.length;
  }, [isAppPaused, activePeerCouriers.length]);

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

    const initialTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileLayer = L.tileLayer(initialTileUrl, {
      minZoom: 10,
      maxZoom: 19,
      subdomains: 'abc',
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
    const peerLayer = L.layerGroup().addTo(map);

    // Immediately pause auto-follow on any user touch/drag/zoom so the map NEVER snaps back while panning
    const disableAutoFollowOnUserGesture = () => {
      if (isAutoFollowRef.current) {
        isAutoFollowRef.current = false;
        setIsAutoFollowActive(false);
      }
    };

    map.on('dragstart', disableAutoFollowOnUserGesture);
    map.on('mousedown', disableAutoFollowOnUserGesture);
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
    peerMarkersLayerRef.current = peerLayer;

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
      map.remove();
      leafletMapRef.current = null;
      tileLayerRef.current = null;
      selfMarkerRef.current = null;
      selfAccuracyCircleRef.current = null;
      crosswalksLayerRef.current = null;
      peerMarkersLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch between High-Contrast Neon Map ("MAPA_NEON"), Google Live Traffic ("TRANSITO_GOOGLE"), and Satellite ("SATELITE")
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
        'https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}'
      );
    } else if (mapStyleMode === 'SATELITE') {
      containerEl.classList.add('buddy-map-satellite');
      tileLayer.setUrl(
        'https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}'
      );
    } else {
      containerEl.classList.add(
        isDaylight ? 'buddy-map-neon-light' : 'buddy-map-neon-dark'
      );
      tileLayer.setUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    }
  }, [mapStyleMode, isDaylight]);

  // Render Amarante Pedestrian Crosswalks (Seed + Overpass + Courier-Taught) on Map
  useEffect(() => {
    const cwLayer = crosswalksLayerRef.current;
    if (!cwLayer) return;
    cwLayer.clearLayers();

    amaranteCrosswalks.forEach((cw) => {
      const isTaught = cw.source === 'COURIER_TAUGHT';
      const borderCol = isTaught ? '#00E5FF' : '#00B8D4';
      const cwIcon = L.divIcon({
        className: 'buddy-crosswalk-pin',
        html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">
          <div style="width:24px;height:24px;border-radius:8px;background:#0B0F17;border:2px solid ${borderCol};display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 2px 8px rgba(0,229,255,0.35);">
            🚸
          </div>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([cw.lat, cw.lng], { icon: cwIcon });
      marker.bindPopup(
        `<div style="font-family:Nunito,sans-serif;padding:2px;">
          <strong style="color:#00838F;font-size:13px;">🚸 Passadeira de Peões</strong><br/>
          <span style="font-size:12px;font-weight:700;">${cw.streetLabel}</span><br/>
          <span style="font-size:11px;color:#64748B;">${
            isTaught
              ? `Ensinada por ${cw.taughtByCallsign || 'Buddy'}`
              : 'Mapeada em Amarante (Alerta <45m)'
          }</span>
        </div>`
      );
      marker.addTo(cwLayer);
    });
  }, [amaranteCrosswalks]);

  // Update logged-in user's real GPS marker with the Dynamic 3-State Robot Mascot, Heading Cone & Gliding
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    // Never place the user's pin on a fake coordinate before real GPS arrives!
    if (!localLiveCoords) {
      if (selfMarkerRef.current) {
        selfMarkerRef.current.remove();
        selfMarkerRef.current = null;
      }
      if (selfAccuracyCircleRef.current) {
        selfAccuracyCircleRef.current.remove();
        selfAccuracyCircleRef.current = null;
      }
      return;
    }

    const posForInit = displayedGlidingCoordsRef.current || localLiveCoords;
    const latLng: [number, number] = [posForInit.lat, posForInit.lng];
    const selfCallsign = (realCourierProfile?.name || 'Tu').trim();
    const dotColor =
      currentMascotState === 'DELIVERY'
        ? '#00E5FF'
        : currentMascotState === 'INACTIVE'
          ? '#00B8D4'
          : '#00E5FF';

    // Update or create accuracy circle
    if (selfAccuracyCircleRef.current) {
      selfAccuracyCircleRef.current.setRadius(liveAccuracyMeters);
      selfAccuracyCircleRef.current.setStyle({
        color: dotColor,
        fillColor: dotColor,
      });
    } else {
      selfAccuracyCircleRef.current = L.circle(latLng, {
        radius: liveAccuracyMeters,
        color: dotColor,
        weight: 1.5,
        fillColor: dotColor,
        fillOpacity: 0.14,
        interactive: false,
      }).addTo(map);
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
      map.setView([localLiveCoords.lat, localLiveCoords.lng], 17, {
        animate: true,
      });
    } else if (isAutoFollowRef.current) {
      map.panTo([localLiveCoords.lat, localLiveCoords.lng], {
        animate: true,
        duration: 0.45,
      });
    }
  }, [
    localLiveCoords,
    liveAccuracyMeters,
    realCourierProfile?.name,
    isAppPaused,
    currentMascotState,
    currentMascotImageUrl,
    headingDeg,
  ]);

  // Render active peer couriers (within last 5 minutes only)
  useEffect(() => {
    const peerLayer = peerMarkersLayerRef.current;
    if (!peerLayer) return;
    peerLayer.clearLayers();

    activePeerCouriers.forEach((c) => {
      if (typeof c.lat !== 'number' || typeof c.lng !== 'number') return;
      const isFree = c.orderStatus === 'DISPONIVEL';
      const ringColor = isFree ? '#00E5FF' : '#f59e0b';

      const peerIcon = L.divIcon({
        className: 'buddy-clean-peer-pin',
        html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">
          <div style="width:26px;height:26px;border-radius:9999px;background:#18181b;color:#ffffff;border:2.5px solid ${ringColor};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;box-shadow:0 2px 8px rgba(0,0,0,0.5);">
            ${c.avatarInitials || c.callsign.slice(0, 2).toUpperCase()}
          </div>
          <span style="margin-top:2px;background:rgba(9,9,11,0.92);color:#ffffff;font-size:9px;font-weight:800;padding:1px 5px;border-radius:6px;border:1px solid ${ringColor};white-space:nowrap;">
            ${c.callsign}
          </span>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([c.lat, c.lng], { icon: peerIcon });
      marker.on('click', () => {
        handleOpenBuddyProfilePopup(c);
      });
      marker.addTo(peerLayer);
    });
  }, [activePeerCouriers, handleOpenBuddyProfilePopup]);

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

  return (
    <div className="space-y-2">
      {/* UNIFIED COMPACT MAP CONTROL TOOLBAR:
          Row 1: [📍 Amarante (Raio 35 km) | 🚸 Marcar Passadeira Aqui | Mudar Centro]
          Row 2: [Mapa Neon | Trânsito Google | Satélite] + [🎯 Centrar] */}
      <div
        style={{
          backgroundColor: isDaylight ? '#FFFFFF' : '#0B0F17',
          borderColor: isDaylight ? '#CBD5E1' : 'rgba(0, 229, 255, 0.35)',
          color: isDaylight ? '#090D16' : '#FFFFFF',
        }}
        className="w-full rounded-2xl border p-2.5 space-y-2 shadow-sm"
      >
        {/* Row 1: Hub Badge + 1-Tap Teach Crosswalk + Mudar Centro */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsHubSelectorModalOpen(true)}
            className="flex items-center gap-1.5 min-w-0 text-left cursor-pointer"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.85)] shrink-0" />
            <span
              style={{ color: isDaylight ? '#090D16' : '#FFFFFF' }}
              className="text-xs sm:text-sm font-extrabold whitespace-nowrap"
            >
              📍 Amarante (Raio 35 km)
            </span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleTeachCrosswalkHere}
              style={{
                backgroundColor: '#0B0F17',
                borderColor: '#00E5FF',
                color: '#00E5FF',
              }}
              title="Ensinar / Marcar uma Passadeira de Peões na tua posição GPS atual em Amarante"
              className="rounded-xl border px-2.5 py-1 text-xs font-extrabold shrink-0 whitespace-nowrap cursor-pointer transition hover:opacity-90 flex items-center gap-1 shadow-[0_0_10px_rgba(0,229,255,0.2)]"
            >
              <span>🚸 Marcar Passadeira Aqui</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHubSelectorModalOpen(true)}
              style={{
                backgroundColor: isDaylight ? '#F1F5F9' : '#111827',
                borderColor: isDaylight ? '#CBD5E1' : 'rgba(0, 229, 255, 0.35)',
                color: isDaylight ? '#090D16' : '#FFFFFF',
              }}
              className="rounded-xl border px-2.5 py-1 text-xs font-extrabold shrink-0 whitespace-nowrap cursor-pointer transition hover:opacity-90"
            >
              Mudar Centro
            </button>
          </div>
        </div>

        {/* Row 2: Layer Switcher [Mapa Neon | Trânsito Google | Satélite] + [🎯 Centrar] */}
        <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-zinc-800/40 flex-wrap">
          <div className="inline-flex items-center rounded-xl bg-zinc-950 border border-zinc-800 p-0.5">
            <button
              type="button"
              onClick={() => setMapStyleMode('MAPA_NEON')}
              style={
                mapStyleMode === 'MAPA_NEON'
                  ? {
                      backgroundColor: '#00E5FF',
                      color: '#090D16',
                    }
                  : undefined
              }
              className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                mapStyleMode === 'MAPA_NEON'
                  ? 'shadow-xs'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              ✨ Mapa Neon
            </button>
            <button
              type="button"
              onClick={() => setMapStyleMode('TRANSITO_GOOGLE')}
              style={
                mapStyleMode === 'TRANSITO_GOOGLE'
                  ? {
                      backgroundColor: '#00E5FF',
                      color: '#090D16',
                    }
                  : undefined
              }
              className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                mapStyleMode === 'TRANSITO_GOOGLE'
                  ? 'shadow-xs'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              🚦 Trânsito Google
            </button>
            <button
              type="button"
              onClick={() => setMapStyleMode('SATELITE')}
              style={
                mapStyleMode === 'SATELITE'
                  ? {
                      backgroundColor: '#00E5FF',
                      color: '#090D16',
                    }
                  : undefined
              }
              className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                mapStyleMode === 'SATELITE'
                  ? 'shadow-xs'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              🛰️ Satélite
            </button>
          </div>

          <button
            type="button"
            onClick={handleRecenterAndFollowGps}
            style={
              isAutoFollowActive && localLiveCoords
                ? {
                    backgroundColor: '#0B0F17',
                    borderColor: '#00E5FF',
                    color: '#00E5FF',
                  }
                : undefined
            }
            className={`rounded-xl border px-3 py-1.5 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shrink-0 ${
              isAutoFollowActive && localLiveCoords
                ? 'shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                : 'bg-zinc-950 border-zinc-700 text-zinc-100 hover:bg-zinc-900'
            }`}
          >
            <Compass className="h-3.5 w-3.5 shrink-0" />
            <span>🎯 Centrar</span>
          </button>
        </div>
      </div>

      {/* FULL INTERACTIVE LEAFLET MAP CONTAINER */}
      <div
        className={`relative rounded-2xl overflow-hidden border shadow-xl h-[calc(100vh-232px)] min-h-[430px] max-h-[720px] ${
          isDaylight
            ? 'border-slate-300 bg-slate-100'
            : 'border-zinc-800 bg-zinc-950'
        }`}
      >
        {/* Leaflet Map Canvas */}
        <div
          ref={mapContainerRef}
          className="absolute inset-0 z-0 h-full w-full"
        />

        {/* TOP HUD ALERTS: Crosswalk Proximity Heads-Up (<= 45m & > 28 km/h) or Taught Confirmation */}
        {(approachingCrosswalkAlert || crosswalkFeedbackBanner) && (
          <div className="absolute top-3 left-3 right-3 z-[450] flex flex-col items-center gap-1.5 pointer-events-none">
            {approachingCrosswalkAlert && (
              <div
                style={{
                  backgroundColor: '#0B0F17',
                  borderColor: '#00E5FF',
                  color: '#FFFFFF',
                }}
                className="pointer-events-auto rounded-2xl border-2 px-4 py-2 shadow-[0_0_20px_rgba(0,229,255,0.55)] flex items-center gap-2.5 animate-pulse"
              >
                <span className="text-lg">🚸</span>
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

        {/* WAZE-STYLE SPEEDOMETER & ROAD LIMIT HUD (Bottom-Left Corner Above Status Pill) */}
        <div className="absolute bottom-16 left-3 z-[420] flex items-center gap-2 pointer-events-none">
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
            className={`pointer-events-auto rounded-2xl border-2 px-3 py-2 flex items-center gap-3 transition-all ${
              isSpeedAlertPulsing ? 'animate-pulse' : ''
            }`}
          >
            {/* Current GPS Speed (km/h) */}
            <div className="text-center min-w-[48px]">
              <span
                style={{
                  color: isSpeedAlertPulsing
                    ? '#00E5FF'
                    : isDaylight
                      ? '#090D16'
                      : '#FFFFFF',
                }}
                className="text-2xl font-black leading-none block"
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
              className="h-11 w-11 rounded-full border-[3.5px] flex flex-col items-center justify-center shrink-0 shadow-sm"
            >
              <span
                style={{ color: '#090D16' }}
                className="text-sm font-black leading-none"
              >
                {roadLimitKmh}
              </span>
            </div>

            {/* Subtle 20s Over-Speed Progress / Road Label */}
            <div className="min-w-0 max-w-[135px]">
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
                  🚸 {amaranteCrosswalks.length} passadeiras
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CLEAN COMPACT BOTTOM STATUS PILL (No black drawer, no duplicate Disponível button) */}
        <div className="absolute bottom-3 left-3 right-3 z-[400] flex items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto rounded-xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800 px-3 py-2 shadow-lg flex items-center gap-2 min-w-0">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                !localLiveCoords
                  ? 'bg-amber-400 animate-pulse'
                  : isAppPaused
                    ? 'bg-zinc-400'
                    : 'bg-emerald-400 animate-ping'
              }`}
            />
            <span className="text-[11px] font-extrabold text-zinc-100 truncate">
              {localLiveCoords
                ? isAutoFollowActive
                  ? 'GPS HD Gliding (A seguir)'
                  : 'GPS Ativo (Toque 🎯 Centrar p/ seguir)'
                : 'A obter sinal GPS do telemóvel...'}
            </span>
            <span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-emerald-400 shrink-0">
              {totalOnlineCouriersCount} online
            </span>
          </div>

          {hasRealActiveDelivery && (
            <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenExternalNav('WAZE')}
                className="rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-3 py-2 text-base font-extrabold shadow-lg flex items-center gap-1 cursor-pointer"
              >
                <Navigation className="h-4 w-4" />
                <span>Waze</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenExternalNav('GMAPS')}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-base font-extrabold shadow-lg flex items-center gap-1 cursor-pointer"
              >
                <Navigation className="h-4 w-4" />
                <span>Maps</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <OperationalHubSelectorModal
        isOpen={isHubSelectorModalOpen}
        onClose={() => setIsHubSelectorModalOpen(false)}
      />
    </div>
  );
};
