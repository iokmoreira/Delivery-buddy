import React, { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Plus,
  FileCheck2,
  MapPin,
  Clock,
  Users,
  ShieldAlert,
  FileText,
  X,
} from 'lucide-react';
import {
  CourierRegistrationTag,
  EvidentiaryVaultCategory,
  EvidentiaryVaultRecord,
  PlatformName,
} from '../types/models';
import { useEstafetas } from '../context/EstafetasContext';

const VAULT_CATEGORY_TABS: {
  id: EvidentiaryVaultCategory;
  shortLabel: string;
  fullTitle: string;
  targetAuthority: string;
}[] = [
  {
    id: 'AUTORIDADES_VIA_PUBLICA',
    shortLabel: '1. Via Pública',
    fullTitle: 'Autoridades / Via Pública (Descaso Governamental)',
    targetAuthority: 'Câmara Municipal / Infraestruturas Rodoviárias',
  },
  {
    id: 'PLATAFORMAS_ABUSO',
    shortLabel: '2. Plataformas',
    fullTitle: 'Plataformas (Abuso Algorítmico / Descaso Suporte)',
    targetAuthority: 'Suporte Jurídico Uber Eats, Glovo, Bolt / ACT',
  },
  {
    id: 'ENTREGADORES_CONDUTA',
    shortLabel: '3. Entregadores',
    fullTitle: 'Entregadores (Registados ou Externos Não Registados)',
    targetAuthority: 'Auditoria Comunitária & Segurança de Balcão',
  },
  {
    id: 'ESTABELECIMENTOS',
    shortLabel: '4. Lojas',
    fullTitle: 'Estabelecimentos (Espera Crónica >20m / Maus-Tratos)',
    targetAuthority: 'Gestão de Parceiros & Inspeção Laboral',
  },
  {
    id: 'LOCAIS_CLIENTES_ZERO_PII',
    shortLabel: '5. Locais (Zero-PII)',
    fullTitle: 'Locais / Clientes (Má Conduta Recorrente — Zero PII)',
    targetAuthority: 'Segurança Operacional RGPD (Apenas Rua + Cód. Pedido)',
  },
];

export const EvidentiaryArchiveVaultSection: React.FC = () => {
  const {
    evidentiaryVaultRecords,
    addEvidentiaryVaultRecord,
    confirmEvidentiaryVaultRecord,
    generateFormalEvidentiaryReportText,
  } = useEstafetas();

  const [selectedCategory, setSelectedCategory] =
    useState<EvidentiaryVaultCategory>('AUTORIDADES_VIA_PUBLICA');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formalPreviewReport, setFormalPreviewReport] = useState<string | null>(
    null
  );
  const [isNewFormOpen, setIsNewFormOpen] = useState<boolean>(false);

  // Form states for creating a new Evidentiary Record
  const [newTitle, setNewTitle] = useState<string>('');
  const [newStreetGps, setNewStreetGps] = useState<string>('');
  const [newDaysUnresolved, setNewDaysUnresolved] = useState<number>(15);
  const [newRecurrence, setNewRecurrence] = useState<string>(
    '2.ª Reincidência documentada na mesma zona'
  );
  const [newDescription, setNewDescription] = useState<string>('');
  const [newLegalImpact, setNewLegalImpact] = useState<string>(
    'Risco à integridade física e prejuízo operacional documentado.'
  );
  const [newPlatform, setNewPlatform] = useState<PlatformName>('Glovo');
  const [newOrderCode, setNewOrderCode] = useState<string>('#4829');
  const [newCourierRegTag, setNewCourierRegTag] =
    useState<CourierRegistrationTag>('EXTERNO_NAO_REGISTADO');
  const [newExternalCourierDesc, setNewExternalCourierDesc] = useState<string>(
    'Mota escura s/ identificação + Mochila térmica preta desgastada'
  );
  const [newEstablishmentName, setNewEstablishmentName] = useState<string>('');

  const filteredRecords = evidentiaryVaultRecords.filter(
    (r) => r.category === selectedCategory
  );

  const activeCategoryMeta =
    VAULT_CATEGORY_TABS.find((c) => c.id === selectedCategory) ||
    VAULT_CATEGORY_TABS[0];

  const handleExportDossier = async (
    idKey: string,
    target: EvidentiaryVaultRecord | EvidentiaryVaultRecord[]
  ) => {
    const formalText = generateFormalEvidentiaryReportText(target);
    setFormalPreviewReport(formalText);
    try {
      await navigator.clipboard.writeText(formalText);
    } catch {
      // fallback
    }
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleAddEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStreetGps.trim()) return;

    addEvidentiaryVaultRecord({
      category: selectedCategory,
      title: newTitle.trim(),
      streetOrZoneGps: newStreetGps.trim(),
      daysUnresolved: Math.max(1, newDaysUnresolved),
      recurrenceHistory:
        newRecurrence.trim() || 'Ocorrência recorrente confirmada na via.',
      description:
        newDescription.trim() ||
        'Registo probatório arquivado pelo estafeta em turno.',
      legalImpactSummary:
        newLegalImpact.trim() ||
        'Prova documental para reclamação formal e apuramento de responsabilidade.',
      platformName:
        selectedCategory === 'PLATAFORMAS_ABUSO' ||
        selectedCategory === 'ESTABELECIMENTOS'
          ? newPlatform
          : undefined,
      orderCodeRef:
        selectedCategory === 'PLATAFORMAS_ABUSO' ||
        selectedCategory === 'LOCAIS_CLIENTES_ZERO_PII'
          ? newOrderCode.trim() || '#4829'
          : undefined,
      courierRegistrationStatus:
        selectedCategory === 'ENTREGADORES_CONDUTA'
          ? newCourierRegTag
          : undefined,
      externalCourierDescriptor:
        selectedCategory === 'ENTREGADORES_CONDUTA'
          ? newExternalCourierDesc.trim()
          : undefined,
      establishmentName:
        selectedCategory === 'ESTABELECIMENTOS'
          ? newEstablishmentName.trim() || 'Estabelecimento Parceiro'
          : undefined,
    });

    setNewTitle('');
    setNewStreetGps('');
    setNewDescription('');
    setIsNewFormOpen(false);
  };

  return (
    <section
      aria-label="Arquivo de Provas (Dossiê de Evidências)"
      className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5 space-y-3 shadow-sm"
    >
      {/* Top Header + 1-Tap Category Export & "+ Nova Prova" */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <FileCheck2 className="h-4 w-4 text-zinc-200 shrink-0" />
            <h2 className="text-xs font-bold text-zinc-100 truncate">
              Arquivo de Provas (Dossiê Legal &amp; Reincidência)
            </h2>
          </div>
          <p className="text-[10px] text-zinc-400 truncate mt-0.5">
            {activeCategoryMeta.fullTitle}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsNewFormOpen((prev) => !prev)}
            className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-2.5 py-1.5 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>+ Prova</span>
          </button>
          <button
            type="button"
            onClick={() =>
              handleExportDossier(
                `CAT-${selectedCategory}`,
                filteredRecords.length > 0
                  ? filteredRecords
                  : evidentiaryVaultRecords
              )
            }
            className="rounded-lg bg-white text-zinc-950 px-2.5 py-1.5 text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
          >
            {copiedId === `CAT-${selectedCategory}` ? (
              <>
                <Check className="h-3 w-3" />
                <span>Dossiê Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Exportar Dossiê ({filteredRecords.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5 Target Category Filter Pills */}
      <div className="grid grid-cols-5 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
        {VAULT_CATEGORY_TABS.map((tab) => {
          const active = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedCategory(tab.id);
                setFormalPreviewReport(null);
              }}
              className={`rounded-lg py-1.5 px-1 text-[10px] font-semibold transition cursor-pointer truncate ${
                active
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {tab.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Optional Add New Evidentiary Record Drawer */}
      {isNewFormOpen && (
        <form
          onSubmit={handleAddEvidenceSubmit}
          className="rounded-xl bg-zinc-950 border border-zinc-700 p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-100">
              Novo Registo em: {activeCategoryMeta.shortLabel}
            </span>
            <button
              type="button"
              onClick={() => setIsNewFormOpen(false)}
              className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título da Prova (ex: Buraco recorrente s/ reparo há semanas)..."
            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
          />

          <div className="grid grid-cols-3 gap-1.5">
            <input
              type="text"
              required
              value={newStreetGps}
              onChange={(e) => setNewStreetGps(e.target.value)}
              placeholder="Rua / Zona / Coordenadas GPS"
              className="col-span-2 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
            />
            <label className="flex items-center justify-between rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
              <span>Dias s/ sol.:</span>
              <input
                type="number"
                min={1}
                max={365}
                value={newDaysUnresolved}
                onChange={(e) =>
                  setNewDaysUnresolved(parseInt(e.target.value, 10) || 1)
                }
                className="w-10 bg-transparent text-right font-mono font-bold text-zinc-100 focus:outline-none"
              />
            </label>
          </div>

          {/* Conditional Fields by Category */}
          {selectedCategory === 'ENTREGADORES_CONDUTA' && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setNewCourierRegTag('EXTERNO_NAO_REGISTADO')}
                  className={`rounded-lg py-1.5 px-2 text-[10px] font-semibold border cursor-pointer ${
                    newCourierRegTag === 'EXTERNO_NAO_REGISTADO'
                      ? 'bg-white text-zinc-950 border-white'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                  }`}
                >
                  Estafeta Externo (Não Registado)
                </button>
                <button
                  type="button"
                  onClick={() => setNewCourierRegTag('REGISTADO_APP')}
                  className={`rounded-lg py-1.5 px-2 text-[10px] font-semibold border cursor-pointer ${
                    newCourierRegTag === 'REGISTADO_APP'
                      ? 'bg-white text-zinc-950 border-white'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                  }`}
                >
                  Usuário Registado no App
                </button>
              </div>
              <input
                type="text"
                value={newExternalCourierDesc}
                onChange={(e) => setNewExternalCourierDesc(e.target.value)}
                placeholder="Descrição veículo/mochila ou ID (ex: Mota preta + Mala verde)..."
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
              />
            </div>
          )}

          {(selectedCategory === 'PLATAFORMAS_ABUSO' ||
            selectedCategory === 'ESTABELECIMENTOS') && (
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value as PlatformName)}
                className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
              >
                <option value="Glovo">Glovo</option>
                <option value="Uber Eats">Uber Eats</option>
                <option value="Bolt Food">Bolt Food</option>
              </select>
              {selectedCategory === 'ESTABELECIMENTOS' ? (
                <input
                  type="text"
                  value={newEstablishmentName}
                  onChange={(e) => setNewEstablishmentName(e.target.value)}
                  placeholder="Nome do Estabelecimento"
                  className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
                />
              ) : (
                <input
                  type="text"
                  value={newOrderCode}
                  onChange={(e) => setNewOrderCode(e.target.value)}
                  placeholder="Código Pedido (#4829)"
                  className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs font-mono text-zinc-100"
                />
              )}
            </div>
          )}

          {selectedCategory === 'LOCAIS_CLIENTES_ZERO_PII' && (
            <input
              type="text"
              value={newOrderCode}
              onChange={(e) => setNewOrderCode(e.target.value)}
              placeholder="Apenas Código do Pedido (#4829) — Proibido Nomes Pessoais (Zero-PII)"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs font-mono text-zinc-100"
            />
          )}

          <input
            type="text"
            value={newRecurrence}
            onChange={(e) => setNewRecurrence(e.target.value)}
            placeholder="Histórico de Reincidência (ex: 3x reportado este mês sem reparo)..."
            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
          />

          <textarea
            rows={2}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Descrição detalhada do facto para o Dossiê de Prova..."
            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
          />

          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsNewFormOpen(false)}
              className="rounded-lg bg-zinc-800 text-zinc-300 px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-white text-zinc-950 px-3.5 py-1.5 text-xs font-bold cursor-pointer"
            >
              Arquivar Prova Oficial
            </button>
          </div>
        </form>
      )}

      {/* Archived Evidence Records List */}
      <div className="space-y-2">
        {filteredRecords.length === 0 ? (
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 text-center space-y-1">
            <span className="text-xs font-bold text-zinc-100 block">
              Modo Produção Real Ativo • 0 provas arquivadas nesta categoria
            </span>
            <span className="text-[11px] text-zinc-400 block">
              Os registos de demonstração foram ocultados. Clique em &quot;+ Prova&quot; acima para arquivar uma evidência real.
            </span>
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const isCopied = copiedId === rec.id;
            return (
              <div
                key={rec.id}
                className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-2"
              >
                {/* Protocol Badge + Unresolved Days + Confirmations Count */}
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-200">
                    {rec.protocolId} • 1.º Registo: {rec.firstReportedDate}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-100 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-zinc-400" />
                      <span>Há {rec.daysUnresolved} dias sem solução</span>
                    </span>
                    <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300 flex items-center gap-1">
                      <Users className="h-3 w-3 text-zinc-400" />
                      <span>{rec.confirmationsCount} conf.</span>
                    </span>
                  </div>
                </div>

                {/* Title & Street/GPS */}
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-zinc-100 leading-snug">
                    {rec.title}
                  </h3>
                  <p className="text-[11px] text-zinc-300 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
                    <span className="truncate">{rec.streetOrZoneGps}</span>
                  </p>
                </div>

                {/* Category-Specific Tagging (External Courier vs Registered, Platform, Zero-PII Order Code) */}
                {(rec.courierRegistrationStatus ||
                  rec.platformName ||
                  rec.orderCodeRef ||
                  rec.establishmentName) && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {rec.courierRegistrationStatus && (
                      <span className="rounded-md bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[10px] font-semibold text-zinc-200">
                        {rec.courierRegistrationStatus ===
                        'EXTERNO_NAO_REGISTADO'
                          ? 'Estafeta Externo (Não Registado no App)'
                          : 'Usuário Registado no App'}{' '}
                        • {rec.externalCourierDescriptor}
                      </span>
                    )}
                    {rec.platformName && (
                      <span className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-200">
                        Plataforma: {rec.platformName}
                      </span>
                    )}
                    {rec.establishmentName && (
                      <span className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-200">
                        Loja: {rec.establishmentName}
                      </span>
                    )}
                    {rec.orderCodeRef && (
                      <span className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                        Pedido {rec.orderCodeRef} (Zero-PII)
                      </span>
                    )}
                  </div>
                )}

                {/* Recurrence History & Description */}
                <div className="rounded-lg bg-zinc-900/90 border border-zinc-800/80 p-2 space-y-1 text-[11px]">
                  <div className="text-zinc-200">
                    <strong className="text-zinc-400">
                      Histórico de Reincidência:{' '}
                    </strong>
                    {rec.recurrenceHistory}
                  </div>
                  <p className="text-zinc-300 leading-snug">
                    {rec.description}
                  </p>
                  <div className="text-[10px] text-zinc-400 flex items-start gap-1 pt-0.5">
                    <ShieldAlert className="h-3 w-3 text-zinc-400 shrink-0 mt-0.5" />
                    <span>{rec.legalImpactSummary}</span>
                  </div>
                </div>

                {/* Action Buttons: +1 Confirmar Reincidência & 1-Tap Exportar Dossiê de Prova */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => confirmEvidentiaryVaultRecord(rec.id)}
                    className="rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 cursor-pointer"
                  >
                    +1 Confirmar Prova ({rec.confirmationsCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportDossier(rec.id, rec)}
                    className="rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Relatório Formal Copiado</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-3.5 w-3.5" />
                        <span>Exportar Dossiê de Prova (Relatório Formal)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Live Preview of Exported Formal Evidentiary Report */}
      {formalPreviewReport && (
        <div className="rounded-xl bg-zinc-950 border border-zinc-700 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-100">
              Dossiê Formal Gerado (Copiado para a Área de Transferência)
            </span>
            <button
              type="button"
              onClick={() => setFormalPreviewReport(null)}
              className="text-[10px] text-zinc-400 hover:text-zinc-100 cursor-pointer"
            >
              Fechar Pré-visualização
            </button>
          </div>
          <pre className="text-[10px] font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
            {formalPreviewReport}
          </pre>
        </div>
      )}
    </section>
  );
};

export const ComplaintsAndRouteTrapsModule: React.FC = () => {
  const { setActiveTab } = useEstafetas();

  return (
    <div className="space-y-2.5">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('menu_mais')}
          className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar a Ajustes</span>
        </button>
        <span className="text-xs font-semibold text-zinc-400">
          Arquivo de Provas &amp; Reclamações Formais
        </span>
      </div>

      {/* Audited Evidentiary Archive Vault */}
      <EvidentiaryArchiveVaultSection />
    </div>
  );
};
