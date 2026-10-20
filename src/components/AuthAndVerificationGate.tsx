import React, { useState } from 'react';
import { useEstafetas } from '../context/EstafetasContext';
import {
  AmaranteBaseZoneOption,
  CourierRegistrationVehicle,
  PlatformName,
} from '../types/models';
import { findExistingCourierByNameInSupabaseRest } from '../services/geminiAgent';

interface SavedLocalAccountRecord {
  username: string;
  pinOrPassword: string;
  vehicle: CourierRegistrationVehicle;
  platforms: PlatformName[];
  zone: AmaranteBaseZoneOption;
}

const SAVED_ACCOUNTS_STORAGE_KEY = 'buddy_saved_accounts_v1';

function loadSavedAccounts(): SavedLocalAccountRecord[] {
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccountLocally(record: SavedLocalAccountRecord) {
  try {
    const existing = loadSavedAccounts().filter(
      (a) => a.username.toLowerCase() !== record.username.toLowerCase()
    );
    localStorage.setItem(
      SAVED_ACCOUNTS_STORAGE_KEY,
      JSON.stringify([record, ...existing])
    );
  } catch {
    // ignore
  }
}

const VEHICLE_OPTIONS: Array<{
  id: CourierRegistrationVehicle;
  label: string;
  emoji: string;
}> = [
  { id: 'Mota 125cc', label: 'Mota 125cc', emoji: '🛵' },
  { id: 'Scooter Elétrica', label: 'Scooter Elétrica', emoji: '⚡' },
  { id: 'Bicicleta Elétrica', label: 'Bicicleta Elétrica', emoji: '🚲' },
  { id: 'Carro', label: 'Carro', emoji: '🚗' },
];

const PLATFORM_OPTIONS: PlatformName[] = ['Uber Eats', 'Glovo', 'Bolt Food'];

export const AuthAndVerificationGate: React.FC = () => {
  const {
    saveAndRegisterRealCourierProfile,
    aiAgentConfig,
    themeMode,
  } = useEstafetas();

  const isDay = themeMode === 'DAYLIGHT';
  const [authMode, setAuthMode] = useState<'ENTRAR' | 'CRIAR_CONTA'>('ENTRAR');
  const [username, setUsername] = useState<string>('');
  const [pinOrPassword, setPinOrPassword] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] =
    useState<CourierRegistrationVehicle>('Mota 125cc');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformName[]>([
    'Uber Eats',
    'Glovo',
  ]);
  const [selectedZone, setSelectedZone] = useState<AmaranteBaseZoneOption>(
    'Amarante Centro / São Gonçalo'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const togglePlatform = (plat: PlatformName) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(plat)) {
        if (prev.length <= 1) return prev;
        return prev.filter((p) => p !== plat);
      }
      return [...prev, plat];
    });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanName = username.trim();
    const cleanPin = pinOrPassword.trim();

    if (!cleanName) {
      setErrorMsg('Introduza o seu Nome ou Utilizador.');
      return;
    }
    if (cleanPin.length < 3) {
      setErrorMsg('Introduza a sua Palavra-passe ou PIN (mín. 3 caracteres).');
      return;
    }

    setIsSubmitting(true);
    try {
      let resolvedVehicle: CourierRegistrationVehicle = selectedVehicle;
      let resolvedPlatforms: PlatformName[] =
        selectedPlatforms.length > 0 ? selectedPlatforms : ['Uber Eats', 'Glovo'];
      let resolvedZone: AmaranteBaseZoneOption = selectedZone;

      if (authMode === 'ENTRAR') {
        const localSaved = loadSavedAccounts().find(
          (a) => a.username.toLowerCase() === cleanName.toLowerCase()
        );
        if (
          localSaved &&
          localSaved.pinOrPassword &&
          localSaved.pinOrPassword !== cleanPin
        ) {
          setErrorMsg('PIN / Palavra-passe incorreta para esta conta neste dispositivo.');
          setIsSubmitting(false);
          return;
        }
        if (localSaved) {
          resolvedVehicle = localSaved.vehicle;
          resolvedPlatforms = localSaved.platforms;
          resolvedZone = localSaved.zone;
        } else {
          // Check Supabase public.couriers for existing courier profile
          const remoteRow = await findExistingCourierByNameInSupabaseRest({
            supabaseUrl: aiAgentConfig.supabaseUrl,
            supabaseAnonKey: aiAgentConfig.supabaseAnonKey,
            nameOrUsername: cleanName,
          });
          if (remoteRow) {
            if (
              [
                'Mota 125cc',
                'Scooter Elétrica',
                'Carro',
                'Bicicleta Elétrica',
              ].includes(remoteRow.vehicle)
            ) {
              resolvedVehicle = remoteRow.vehicle as CourierRegistrationVehicle;
            }
            if (
              remoteRow.active_platforms &&
              remoteRow.active_platforms.length > 0
            ) {
              resolvedPlatforms = remoteRow.active_platforms;
            }
          }
        }
      }

      saveAccountLocally({
        username: cleanName,
        pinOrPassword: cleanPin,
        vehicle: resolvedVehicle,
        platforms: resolvedPlatforms,
        zone: resolvedZone,
      });

      await saveAndRegisterRealCourierProfile({
        name: cleanName,
        vehicle: resolvedVehicle,
        zone: resolvedZone,
        active_platforms: resolvedPlatforms,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-center px-4 py-8 ${
        isDay ? 'bg-slate-100 text-slate-950' : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      <div
        className={`max-w-md w-full mx-auto rounded-3xl border p-6 shadow-2xl ${
          isDay
            ? 'bg-white border-slate-300 shadow-slate-300/50'
            : 'bg-zinc-900 border-zinc-800 shadow-black/70'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
            DB
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">
              Delivery Buddy
            </h1>
            <p
              className={`text-xs font-semibold ${
                isDay ? 'text-slate-600' : 'text-zinc-400'
              }`}
            >
              Copiloto de Turno • Amarante (25 km)
            </p>
          </div>
        </div>

        {/* Mode Switcher: Entrar vs Criar Conta */}
        <div
          className={`grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl border mb-5 ${
            isDay
              ? 'bg-slate-100 border-slate-200'
              : 'bg-zinc-950 border-zinc-800'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setAuthMode('ENTRAR');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              authMode === 'ENTRAR'
                ? 'bg-emerald-600 text-white shadow'
                : isDay
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-zinc-400 hover:text-white'
            }`}
          >
            🔑 Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('CRIAR_CONTA');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              authMode === 'CRIAR_CONTA'
                ? 'bg-emerald-600 text-white shadow'
                : isDay
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-zinc-400 hover:text-white'
            }`}
          >
            ✨ Criar Conta
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {/* Username / Callsign */}
          <div>
            <label
              className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 ${
                isDay ? 'text-slate-700' : 'text-zinc-300'
              }`}
            >
              Nome ou Utilizador
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: Caio Moreira"
              autoComplete="username"
              className={`w-full rounded-xl border px-3.5 py-3 text-sm font-bold focus:outline-none ${
                isDay
                  ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-emerald-600'
                  : 'bg-zinc-950 border-zinc-700 text-white focus:border-emerald-500'
              }`}
            />
          </div>

          {/* PIN / Password */}
          <div>
            <label
              className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 ${
                isDay ? 'text-slate-700' : 'text-zinc-300'
              }`}
            >
              PIN ou Palavra-passe
            </label>
            <input
              type="password"
              value={pinOrPassword}
              onChange={(e) => setPinOrPassword(e.target.value)}
              placeholder="••••"
              autoComplete={
                authMode === 'ENTRAR' ? 'current-password' : 'new-password'
              }
              className={`w-full rounded-xl border px-3.5 py-3 text-sm font-bold focus:outline-none ${
                isDay
                  ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-emerald-600'
                  : 'bg-zinc-950 border-zinc-700 text-white focus:border-emerald-500'
              }`}
            />
          </div>

          {/* Registration extra fields (Vehicle & Platforms) */}
          {authMode === 'CRIAR_CONTA' && (
            <>
              <div>
                <label
                  className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 ${
                    isDay ? 'text-slate-700' : 'text-zinc-300'
                  }`}
                >
                  Plataformas Ativas
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORM_OPTIONS.map((plat) => {
                    const active = selectedPlatforms.includes(plat);
                    return (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => togglePlatform(plat)}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                          active
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                            : isDay
                              ? 'bg-slate-50 border-slate-300 text-slate-700'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {active ? '✓ ' : ''}
                        {plat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 ${
                    isDay ? 'text-slate-700' : 'text-zinc-300'
                  }`}
                >
                  O Teu Veículo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_OPTIONS.map((v) => {
                    const active = selectedVehicle === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVehicle(v.id)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          active
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                            : isDay
                              ? 'bg-slate-50 border-slate-300 text-slate-700'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <span>{v.emoji}</span>
                        <span className="truncate">{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 ${
                    isDay ? 'text-slate-700' : 'text-zinc-300'
                  }`}
                >
                  Zona Principal (Amarante 25 km)
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) =>
                    setSelectedZone(e.target.value as AmaranteBaseZoneOption)
                  }
                  className={`w-full rounded-xl border px-3 py-2.5 text-xs font-bold focus:outline-none ${
                    isDay
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-zinc-950 border-zinc-700 text-white'
                  }`}
                >
                  <option value="Amarante Centro / São Gonçalo">
                    Amarante Centro / São Gonçalo
                  </option>
                  <option value="Freixo de Cima / Baixo">
                    Freixo de Cima / Baixo
                  </option>
                  <option value="Vila Meã">Vila Meã</option>
                  <option value="Lixa / Felgueiras">Lixa / Felgueiras</option>
                  <option value="Marco de Canaveses">Marco de Canaveses</option>
                </select>
              </div>
            </>
          )}

          {errorMsg && (
            <div className="rounded-xl bg-red-600/15 border border-red-500/40 px-3.5 py-2.5 text-xs font-bold text-red-500">
              ⚠️ {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-sm uppercase tracking-wider shadow-lg transition-all cursor-pointer"
          >
            {isSubmitting
              ? 'A iniciar sessão...'
              : authMode === 'ENTRAR'
                ? 'Entrar no Turno'
                : 'Criar Conta e Entrar'}
          </button>
        </form>

        <p
          className={`mt-4 text-center text-[11px] font-medium ${
            isDay ? 'text-slate-500' : 'text-zinc-500'
          }`}
        >
          A tua sessão fica guardada automaticamente neste telemóvel. Podes editar o perfil ou terminar sessão em Ajustes.
        </p>
      </div>
    </div>
  );
};
