import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  CaeCirsPresetOption,
  IvaRegimeType,
  VehicleType,
} from '../types/models';
import { useEstafetas } from '../context/EstafetasContext';
import { ActivePlatformsSelectorGroup } from './InteractiveManualAndHelpDrawer';

export const CalculatorAndCostsModule: React.FC = () => {
  const {
    setActiveTab,
    vehicleProfile,
    updateVehicleProfile,
    totalCostPerKm,
    userPrefs,
    updateUserPreferences,
    personalBlacklist,
    addEstablishmentToBlacklist,
    removeEstablishmentFromBlacklist,
    taxAndFleetConfig,
    updateTaxAndFleetConfig,
    toggleRookieInvoiceItem,
    activePlatforms,
    toggleActivePlatform,
  } = useEstafetas();

  const [subTab, setSubTab] = useState<'ACEITACAO' | 'VEICULO' | 'FISCAL'>(
    'ACEITACAO'
  );
  const [newBlockedInput, setNewBlockedInput] = useState<string>('');

  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedInput.trim()) return;
    addEstablishmentToBlacklist(newBlockedInput.trim());
    setNewBlockedInput('');
  };

  return (
    <div className="space-y-2.5">
      {/* Top Bar with Back to Menu + 3-Tab Segmented Switcher */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('menu_mais')}
          className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Menu</span>
        </button>
        <span className="text-xs font-semibold text-zinc-400">
          Predefinições &amp; Fiscal
        </span>
      </div>

      {/* Prominent Multi-Select Active Platforms Toggle Group */}
      <ActivePlatformsSelectorGroup
        selectedPlatforms={activePlatforms}
        onTogglePlatform={toggleActivePlatform}
      />

      <div className="bg-zinc-900 p-1 rounded-lg grid grid-cols-3 gap-1 border border-zinc-800/80">
        <button
          type="button"
          onClick={() => setSubTab('ACEITACAO')}
          className={`rounded-md py-1.5 text-xs transition cursor-pointer ${
            subTab === 'ACEITACAO'
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          Aceitação &amp; Lista
        </button>
        <button
          type="button"
          onClick={() => setSubTab('VEICULO')}
          className={`rounded-md py-1.5 text-xs transition cursor-pointer ${
            subTab === 'VEICULO'
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          Veículo ({totalCostPerKm.toFixed(2)}€/km)
        </button>
        <button
          type="button"
          onClick={() => setSubTab('FISCAL')}
          className={`rounded-md py-1.5 text-xs transition cursor-pointer ${
            subTab === 'FISCAL'
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          CAE &amp; Impostos
        </button>
      </div>

      {/* =====================================================================
          VIEW 1: CRITÉRIOS DE ACEITAÇÃO & LISTA NEGRA
          ===================================================================== */}
      {subTab === 'ACEITACAO' && (
        <div className="space-y-2.5">
          <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">
                  Valor Mínimo Bruto (€)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="2.50"
                  value={userPrefs.minGrossOrderValueEur}
                  onChange={(e) =>
                    updateUserPreferences({
                      minGrossOrderValueEur: Math.max(
                        2,
                        parseFloat(e.target.value) || 4.0
                      ),
                    })
                  }
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">
                  Lucro Mínimo Líquido (€/km)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.50"
                  value={userPrefs.minNetProfitPerKmEur}
                  onChange={(e) =>
                    updateUserPreferences({
                      minNetProfitPerKmEur: Math.max(
                        0.4,
                        parseFloat(e.target.value) || 1.0
                      ),
                    })
                  }
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  updateUserPreferences({
                    autoAcceptEnabled: !userPrefs.autoAcceptEnabled,
                  })
                }
                className={`rounded-lg py-2 px-2.5 text-xs font-semibold cursor-pointer ${
                  userPrefs.autoAcceptEnabled
                    ? 'bg-white text-zinc-950'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                }`}
              >
                Auto-Aceitar: {userPrefs.autoAcceptEnabled ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() =>
                  updateUserPreferences({
                    autoDeclineEnabled: !userPrefs.autoDeclineEnabled,
                  })
                }
                className={`rounded-lg py-2 px-2.5 text-xs font-semibold cursor-pointer ${
                  userPrefs.autoDeclineEnabled
                    ? 'bg-white text-zinc-950'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                }`}
              >
                Auto-Recusar: {userPrefs.autoDeclineEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </section>

          {/* Personal Establishment Blacklist */}
          <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-2.5">
            <span className="text-xs font-semibold text-zinc-100 block">
              Lista Negra de Estabelecimentos ({personalBlacklist.length})
            </span>

            <form onSubmit={handleAddBlacklist} className="flex gap-1.5">
              <input
                type="text"
                value={newBlockedInput}
                onChange={(e) => setNewBlockedInput(e.target.value)}
                placeholder="Nome do restaurante..."
                className="flex-1 rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100"
              />
              <button
                type="submit"
                className="rounded-lg bg-white text-zinc-950 px-3 py-1.5 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Bloquear</span>
              </button>
            </form>

            <div className="space-y-1.5">
              {personalBlacklist.map((name) => (
                <div
                  key={name}
                  className="rounded-lg bg-zinc-950 border border-zinc-800/80 px-3 py-2 flex items-center justify-between gap-2 text-xs"
                >
                  <span className="text-zinc-200 truncate">{name}</span>
                  <button
                    type="button"
                    onClick={() => removeEstablishmentFromBlacklist(name)}
                    className="text-zinc-500 hover:text-zinc-200 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: VEÍCULO & CUSTOS POR KM
          ===================================================================== */}
      {subTab === 'VEICULO' && (
        <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-3">
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">
              Tipo de Viatura
            </label>
            <select
              value={vehicleProfile.vehicleType}
              onChange={(e) =>
                updateVehicleProfile({
                  vehicleType: e.target.value as VehicleType,
                })
              }
              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-100"
            >
              <option value="Mota Combustão 125cc">Mota Combustão 125cc</option>
              <option value="Mota Elétrica">Mota Elétrica</option>
              <option value="Bicicleta Elétrica (E-Bike)">
                Bicicleta Elétrica (E-Bike)
              </option>
              <option value="Automóvel Ligeiro">Automóvel Ligeiro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">
                Combustível / Energia (€/km)
              </label>
              <input
                type="number"
                step="0.01"
                value={vehicleProfile.fuelOrEnergyPerKm}
                onChange={(e) =>
                  updateVehicleProfile({
                    fuelOrEnergyPerKm: Math.max(
                      0,
                      parseFloat(e.target.value) || 0.08
                    ),
                  })
                }
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">
                Desgaste &amp; Pneus (€/km)
              </label>
              <input
                type="number"
                step="0.01"
                value={vehicleProfile.maintenanceAndTiresPerKm}
                onChange={(e) =>
                  updateVehicleProfile({
                    maintenanceAndTiresPerKm: Math.max(
                      0,
                      parseFloat(e.target.value) || 0.05
                    ),
                  })
                }
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100"
              />
            </div>
          </div>

          <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              Custo Real Operacional / KM:
            </span>
            <span className="text-sm font-semibold text-zinc-100">
              {totalCostPerKm.toFixed(2)} €/km
            </span>
          </div>
        </section>
      )}

      {/* =====================================================================
          VIEW 3: CAE, IMPOSTOS & RECIBOS VERDES
          ===================================================================== */}
      {subTab === 'FISCAL' && (
        <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-3">
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">
              Código CAE / CIRS (Portal das Finanças)
            </label>
            <select
              value={taxAndFleetConfig.caeCirsPreset}
              onChange={(e) =>
                updateTaxAndFleetConfig({
                  caeCirsPreset: e.target.value as CaeCirsPresetOption,
                })
              }
              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-100"
            >
              <option value="CAE 53200 - Outras atividades postais e de courier">
                CAE 53200 - Courier / Estafeta
              </option>
              <option value="CIRS 1519 - Outros prestadores de serviços">
                CIRS 1519 - Prestadores de Serviços
              </option>
              <option value="Outro CAE Personalizado">
                Outro CAE Personalizado
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">
              Regime de IVA
            </label>
            <select
              value={taxAndFleetConfig.ivaRegime}
              onChange={(e) =>
                updateTaxAndFleetConfig({
                  ivaRegime: e.target.value as IvaRegimeType,
                })
              }
              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100"
            >
              <option value="ISENTO_ART_53">
                Isento Art.º 53.º (&lt; 14.500€/ano)
              </option>
              <option value="TAXA_23">
                Regime Normal de IVA (23% Trimestral)
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">
                Comissão Frota (%)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={taxAndFleetConfig.customFleetCommissionPct}
                onChange={(e) =>
                  updateTaxAndFleetConfig({
                    customFleetCommissionPct: Math.max(
                      0,
                      parseFloat(e.target.value) || 0
                    ),
                  })
                }
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">
                Segurança Social (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={taxAndFleetConfig.socialSecurityRatePct}
                onChange={(e) =>
                  updateTaxAndFleetConfig({
                    socialSecurityRatePct: Math.max(
                      0,
                      parseFloat(e.target.value) || 21.4
                    ),
                  })
                }
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
              />
            </div>
          </div>

          {/* Rookie Checklist */}
          <div className="space-y-1.5 pt-1">
            {(
              [
                {
                  key: 'emitirReciboVerde5DiaUtil',
                  label: 'Emitir Recibo Verde até ao 5.º dia útil',
                },
                {
                  key: 'validarNifPlataformasIntracomunitario',
                  label: 'NIF Intracomunitário (VIES) ativo p/ Uber/Glovo',
                },
                {
                  key: 'confirmarDeclaracaoTrimestralSs',
                  label: 'Declaração Trimestral Segurança Social em dia',
                },
              ] as const
            ).map((item) => {
              const checked = taxAndFleetConfig.invoiceChecklist[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleRookieInvoiceItem(item.key)}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800/80 px-2.5 py-2 flex items-center gap-2 text-left text-xs text-zinc-200 cursor-pointer"
                >
                  {checked ? (
                    <CheckSquare className="h-3.5 w-3.5 text-white shrink-0" />
                  ) : (
                    <Square className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  )}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
