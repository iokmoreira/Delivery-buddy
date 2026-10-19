import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  Sparkles,
  CheckCircle2,
  Bike,
  Upload,
  KeyRound,
  Cpu,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useEstafetas } from '../context/EstafetasContext';
import {
  CourierContractModel,
  PlatformName,
  VerificationMethodType,
} from '../types/models';

const ALL_PLATFORMS: PlatformName[] = ['Uber Eats', 'Glovo', 'Bolt Food'];

export const AuthAndVerificationGate: React.FC = () => {
  const {
    loginWithDemoAccount,
    loginWithCredentials,
    completeAiMultiAppRegistration,
  } = useEstafetas();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER_AI'>('LOGIN');

  // Login State
  const [emailOrPhone, setEmailOrPhone] = useState(
    'tiago.rocha.estafeta@pt-couriers.pt'
  );
  const [password, setPassword] = useState('••••••••••••');
  const [keepConnected, setKeepConnected] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Registration & AI Verification State
  const [courierName, setCourierName] = useState('Tiago Rocha');
  const [regEmailOrPhone, setRegEmailOrPhone] = useState('+351 914 820 391');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformName[]>([
    'Uber Eats',
    'Glovo',
    'Bolt Food',
  ]);
  const [contractModel, setContractModel] = useState<CourierContractModel>(
    'Recibos Verdes / Independente'
  );
  const [verificationMethod, setVerificationMethod] =
    useState<VerificationMethodType>('IA_SCREENSHOT_FACIAL');
  const [sponsorInviteCode, setSponsorInviteCode] = useState('BUDDY-PT-884');
  const [regKeepConnected, setRegKeepConnected] = useState(true);

  const [aiStep, setAiStep] = useState<number>(0);
  const [uploadedScreenshotsCount, setUploadedScreenshotsCount] =
    useState<number>(3);

  const togglePlatform = (platform: PlatformName) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== platform);
      }
      return [...prev, platform];
    });
  };

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password.trim()) {
      setLoginError('Introduza o seu Email/Telemóvel e Palavra-passe.');
      return;
    }
    setLoginError('');
    loginWithCredentials(emailOrPhone, keepConnected);
  };

  const handleRunAiVerification = () => {
    if (aiStep > 0 && aiStep < 4) return;
    setAiStep(1);
    setTimeout(() => {
      setAiStep(2);
    }, 850);
    setTimeout(() => {
      setAiStep(3);
    }, 1700);
    setTimeout(() => {
      setAiStep(4);
      completeAiMultiAppRegistration({
        courierName: courierName.trim() || 'Estafeta Verificado PT',
        emailOrPhone: regEmailOrPhone.trim() || '+351 910 000 000',
        connectedPlatforms: selectedPlatforms,
        contractModel,
        verificationMethod,
        keepLoggedInShift: regKeepConnected,
      });
    }, 2600);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 select-none">
      <div className="max-w-sm w-full mx-auto my-auto space-y-3">
        {/* Monochrome Brand Header Card */}
        <div className="border border-zinc-800/80 bg-zinc-900/90 rounded-xl p-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 bg-zinc-800 text-zinc-200 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-200" />
              Rede Exclusiva Verificada
            </span>
            <span className="text-[10px] font-mono font-semibold text-zinc-400 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded">
              KYC IA
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
              <Bike className="w-6 h-6 text-zinc-100" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-100">
                Delivery Buddy
              </h1>
              <p className="text-xs text-zinc-400">
                O Copiloto Tático dos Estafetas em Portugal
              </p>
            </div>
          </div>

          {/* 2-Tab Segmented Switcher */}
          <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80 mt-3.5">
            <button
              type="button"
              onClick={() => setActiveTab('LOGIN')}
              className={`py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'LOGIN'
                  ? 'bg-white text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REGISTER_AI')}
              className={`py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'REGISTER_AI'
                  ? 'bg-white text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Registo IA</span>
            </button>
          </div>
        </div>

        {/* TAB 1: LOGIN VIEW */}
        {activeTab === 'LOGIN' && (
          <div className="border border-zinc-800/80 bg-zinc-900/90 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-zinc-300" />
                <span>Autenticação de Estafeta</span>
              </h2>
            </div>

            {/* 1-Tap Quick Demo Login Button */}
            <button
              type="button"
              onClick={() => loginWithDemoAccount(keepConnected)}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Login Rápido (Demo Estafeta Verificado)</span>
            </button>

            <form onSubmit={handleStandardLogin} className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
                  Email ou Telemóvel
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="estafeta@email.pt"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
                  Palavra-Passe
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-100 outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepConnected}
                  onChange={(e) => setKeepConnected(e.target.checked)}
                  className="w-3.5 h-3.5 accent-zinc-100 rounded cursor-pointer"
                />
                <span className="text-xs font-medium text-zinc-300">
                  Manter-se conectado (Turno Contínuo)
                </span>
              </label>

              {loginError && (
                <p className="text-xs font-semibold text-zinc-200 bg-zinc-800 rounded-lg px-3 py-2">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Iniciar Turno Autenticado</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: AI MULTI-APP OWNERSHIP VERIFICATION FLOW */}
        {activeTab === 'REGISTER_AI' && (
          <div className="border border-zinc-800/80 bg-zinc-900/90 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-zinc-300" />
                <span>Validação IA Multi-App</span>
              </h2>
              <span className="text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                1 PINO = 1 ESTAFETA
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium uppercase text-zinc-400 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium uppercase text-zinc-400 mb-1">
                  Telemóvel
                </label>
                <input
                  type="text"
                  value={regEmailOrPhone}
                  onChange={(e) => setRegEmailOrPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-medium uppercase text-zinc-400 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>1. Plataformas Ativas</span>
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {ALL_PLATFORMS.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                        isSelected
                          ? 'bg-white text-zinc-950 border-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {platform}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-medium uppercase text-zinc-400 block">
                2. Modelo Contratual
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    'Recibos Verdes / Independente',
                    'Frota Parceira',
                  ] as CourierContractModel[]
                ).map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setContractModel(model)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                      contractModel === model
                        ? 'bg-white text-zinc-950 border-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setVerificationMethod('IA_SCREENSHOT_FACIAL')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1 cursor-pointer ${
                    verificationMethod === 'IA_SCREENSHOT_FACIAL'
                      ? 'bg-white text-zinc-950 border-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Prints + IA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationMethod('CODIGO_PADRINHO')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1 cursor-pointer ${
                    verificationMethod === 'CODIGO_PADRINHO'
                      ? 'bg-white text-zinc-950 border-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Código Padrinho</span>
                </button>
              </div>

              {verificationMethod === 'IA_SCREENSHOT_FACIAL' ? (
                <div className="flex items-center justify-between text-[11px] bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2">
                  <span className="text-zinc-400">
                    Capturas prontas: {uploadedScreenshotsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setUploadedScreenshotsCount(selectedPlatforms.length)
                    }
                    className="text-zinc-100 font-semibold underline cursor-pointer"
                  >
                    Carregar Prints
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={sponsorInviteCode}
                  onChange={(e) => setSponsorInviteCode(e.target.value)}
                  placeholder="Código Padrinho (Ex: BUDDY-PT-884)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-100"
                />
              )}

              {aiStep > 0 && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 space-y-1 text-[11px] font-mono text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-100 shrink-0" />
                    <span>Passo {Math.min(3, aiStep)}/3: Validação IA ativa...</span>
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={regKeepConnected}
                onChange={(e) => setRegKeepConnected(e.target.checked)}
                className="w-3.5 h-3.5 accent-zinc-100 rounded"
              />
              <span>Manter-se conectado no turno</span>
            </label>

            <button
              type="button"
              onClick={handleRunAiVerification}
              disabled={aiStep > 0 && aiStep < 4}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-60 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {aiStep === 0
                  ? 'Validar por IA & Entrar'
                  : 'A Validar Titularidade...'}
              </span>
            </button>
          </div>
        )}
      </div>

      <footer className="max-w-sm w-full mx-auto text-center pt-3 pb-1 text-[10px] text-zinc-500">
        Delivery Buddy PT
      </footer>
    </div>
  );
};
