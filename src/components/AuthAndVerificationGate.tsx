import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  LogIn,
  HelpCircle,
} from 'lucide-react';
import { useEstafetas } from '../context/EstafetasContext';
import {
  AmaranteBaseZoneOption,
  CourierRegistrationVehicle,
  PlatformName,
} from '../types/models';
import { findExistingCourierByNameInSupabaseRest } from '../services/geminiAgent';
import {
  cancelBuddySpeechNow,
  DEFAULT_BUDDY_VOICE_PITCH,
  getSavedBuddyVoiceRate,
  playBuddyConfirmationChime,
  selectBestGeminiLikePtVoice,
} from '../services/voiceEngine';

export const LOGIN_INTRO_VOICE_RATE = 1.05;

export const BUDDY_LOGIN_INTRO_SENTENCES: string[] = [
  'Olá! Sou o Buddy, o seu robozinho e copiloto inteligente de rua, criado para organizar a tua rotina, proteger-te no trânsito e aumentar os teus ganhos reais.',
  'Enquanto trabalhas na Glovo, Uber ou Bolt, eu fico flutuando na tua tela. Tocou pedido? Eu leio na hora e desconto combustível, desgaste do veículo e impostos. Faço toda a tua gestão financeira automática, acompanhando as tuas metas e projeções diárias, semanais e mensais para saberes ao cêntimo o teu lucro por quilómetro e por hora.',
  'Comigo tens acesso a um banco de dados completo da tua região: vês o clima em tempo real, acordos de piso mínimo, alertas de perigos na via e todo o registo de rotas proibidas, problemas e reclamações para evitares atrasos e ciladas.',
  'Os teus dados pessoais, a tua localização e toda a tua contabilidade são cem por cento privados, protegidos por criptografia avançada segundo a lei europeia de proteção de dados e nunca são partilhados com as plataformas de entrega ou terceiros.',
  'Além disso, comunicas com outros Buddys pelo chat, walkie-talkie, blog e tradutor simultâneo com Libras, comandas tudo por voz sem tirar a mão da direção e contas com deteção automática de queda e alerta SOS. Faz login ou cria a tua conta aqui embaixo e vamos trabalhar. Boas entregas e conduza com segurança!',
];

export interface SavedLocalAccountRecord {
  username: string;
  emailOrPhone?: string;
  pinOrPassword: string;
  vehicle: CourierRegistrationVehicle;
  platforms: PlatformName[];
  zone: AmaranteBaseZoneOption;
  status?: 'APROVADO' | 'PENDENTE' | 'BLOQUEADO';
}

export interface SupportChatMessage {
  id: string;
  sender: 'USER' | 'SUPPORT';
  text: string;
  timestamp: string;
  topicBadge?: string;
}

export const SAVED_ACCOUNTS_STORAGE_KEY = 'buddy_saved_accounts_v1';
export const SUPPORT_CHAT_STORAGE_KEY = 'buddy_realtime_support_chat_v1';

export function loadSavedAccounts(): SavedLocalAccountRecord[] {
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
      (a) =>
        a.username.toLowerCase() !== record.username.toLowerCase() &&
        (!record.emailOrPhone ||
          (a.emailOrPhone || '').toLowerCase() !==
            record.emailOrPhone.toLowerCase())
    );
    localStorage.setItem(
      SAVED_ACCOUNTS_STORAGE_KEY,
      JSON.stringify([record, ...existing])
    );
  } catch {
    // ignore
  }
}

export function loadSupportChatMessages(): SupportChatMessage[] {
  try {
    const raw = localStorage.getItem(SUPPORT_CHAT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  const nowStr = new Date().toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return [
    {
      id: 'SUP-WELCOME-1',
      sender: 'SUPPORT',
      text: 'Olá! Bem-vindo ao Suporte Técnico Delivery Buddy em Tempo Real (Amarante 25 km). Seleciona um tópico rápido abaixo ou escreve a tua dúvida para assistência imediata.',
      timestamp: nowStr,
      topicBadge: 'Equipa Técnica Online',
    },
  ];
}

const QUICK_SUPPORT_TOPICS: Array<{
  id: string;
  label: string;
  emoji: string;
  autoReply: string;
}> = [
  {
    id: 'LOGIN',
    label: 'Problema no Login',
    emoji: '🔑',
    autoReply:
      'Para recuperar ou entrar na tua conta: se já criaste conta noutro telemóvel, escreve o teu Nome ou Email no separador "Fazer Login" que o Delivery Buddy sincroniza o teu perfil a partir do Supabase. Se quiseres criar um novo acesso, usa o separador "Criar Conta".',
  },
  {
    id: 'GPS',
    label: 'Erro no GPS/Mapa',
    emoji: '📍',
    autoReply:
      'Se o GPS demorar em espaços interiores: ativa a Localização de Alta Precisão no Android. O Delivery Buddy usa posicionamento duplo (Rede Wi-Fi/4G instantânea em <1s + Satélite GPS contínuo) e mapas gratuitos OpenStreetMap sem chave de API.',
  },
  {
    id: 'CALCULOS',
    label: 'Dúvida nos Cálculos',
    emoji: '💶',
    autoReply:
      'O Lucro Líquido desconta automaticamente o custo real por km do teu veículo (combustível/energia + desgaste) e avalia se o €/km líquido supera a tua meta mínima definida para Amarante.',
  },
  {
    id: 'BUG',
    label: 'Reportar Bug',
    emoji: '🛠️',
    autoReply:
      'Registo de diagnóstico técnico aberto! Descreve abaixo o comportamento observado (ecrã, comando de voz ou deteção de pedido) — o teu relatório fica guardado e é enviado à equipa técnica Delivery Buddy.',
  },
];

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

export const RealTimeSupportPanel: React.FC<{
  onBack?: () => void;
  isDaylight?: boolean;
}> = ({ onBack, isDaylight = false }) => {
  const [messages, setMessages] = useState<SupportChatMessage[]>(() =>
    loadSupportChatMessages()
  );
  const [draftText, setDraftText] = useState<string>('');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SUPPORT_CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectQuickTopic = (topic: (typeof QUICK_SUPPORT_TOPICS)[0]) => {
    const nowStr = new Date().toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setActiveTopic(topic.label);
    const userMsg: SupportChatMessage = {
      id: `USR-${Date.now()}`,
      sender: 'USER',
      text: `${topic.emoji} Tópico selecionado: ${topic.label}`,
      timestamp: nowStr,
    };
    const replyMsg: SupportChatMessage = {
      id: `SUP-${Date.now() + 1}`,
      sender: 'SUPPORT',
      text: topic.autoReply,
      timestamp: nowStr,
      topicBadge: topic.label,
    };
    setMessages((prev) => [...prev, userMsg, replyMsg]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draftText.trim();
    if (!clean) return;
    const nowStr = new Date().toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const userMsg: SupportChatMessage = {
      id: `USR-${Date.now()}`,
      sender: 'USER',
      text: clean,
      timestamp: nowStr,
    };
    setDraftText('');

    const lower = clean.toLowerCase();
    let replyText =
      'Mensagem recebida pelo Suporte Técnico Delivery Buddy! O teu ticket (#DB-' +
      Date.now().toString().slice(-4) +
      ') foi registado em tempo real. Podes continuar a utilizar a aplicação normalmente.';
    if (lower.includes('login') || lower.includes('senha') || lower.includes('pin') || lower.includes('conta')) {
      replyText =
        'Dica de Conta: Podes criar uma nova conta imediatamente no separador "Criar Conta" ou entrar com o teu Nome/Email e um PIN de pelo menos 3 caracteres.';
    } else if (lower.includes('gps') || lower.includes('mapa')) {
      replyText =
        'Verificação GPS: O mapa OpenStreetMap centra automaticamente no teu sinal de rede/GPS assim que o Android fornece a coordenada.';
    }

    const replyMsg: SupportChatMessage = {
      id: `SUP-${Date.now() + 1}`,
      sender: 'SUPPORT',
      text: replyText,
      timestamp: nowStr,
      topicBadge: activeTopic || 'Atendimento em Tempo Real',
    };
    setMessages((prev) => [...prev, userMsg, replyMsg]);
  };

  return (
    <div className="space-y-3.5">
      {/* Header with Status Indicator & Back Button */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={`rounded-xl p-2 border cursor-pointer transition ${
                isDaylight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
              }`}
              title="Voltar ao Login / Registo"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                Suporte em Tempo Real • Online
              </span>
            </div>
            <h2
              className={`text-sm font-black ${
                isDaylight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Central de Apoio ao Estafeta
            </h2>
          </div>
        </div>
        <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 text-[10px] font-bold text-emerald-400">
          24/7 Ativo
        </span>
      </div>

      {/* Quick Issue Topics (4 Topics) */}
      <div>
        <span
          className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${
            isDaylight ? 'text-slate-500' : 'text-zinc-400'
          }`}
        >
          Tópicos Rápidos de Ajuda:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_SUPPORT_TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => handleSelectQuickTopic(topic)}
              className={`rounded-xl border px-2.5 py-2 text-left text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                activeTopic === topic.label
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-sm'
                  : isDaylight
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-200'
              }`}
            >
              <span>{topic.emoji}</span>
              <span className="truncate">{topic.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Viewport */}
      <div
        className={`rounded-2xl border p-3 h-56 overflow-y-auto space-y-2.5 ${
          isDaylight
            ? 'bg-slate-50 border-slate-200'
            : 'bg-zinc-950 border-zinc-800'
        }`}
      >
        {messages.map((m) => {
          const isUser = m.sender === 'USER';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${
                isUser ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white font-semibold rounded-br-xs'
                    : isDaylight
                      ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-xs'
                }`}
              >
                {m.topicBadge && !isUser && (
                  <span className="inline-block rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-emerald-400 mb-1">
                    {m.topicBadge}
                  </span>
                )}
                <p>{m.text}</p>
              </div>
              <span className="text-[9px] text-zinc-500 mt-0.5 px-1">
                {isUser ? 'Tu' : 'Suporte Buddy'} • {m.timestamp}
              </span>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <input
          type="text"
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder="Escreve a tua mensagem para o suporte..."
          className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold focus:outline-none ${
            isDaylight
              ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'
              : 'bg-zinc-950 border-zinc-700 text-white focus:border-emerald-500'
          }`}
        />
        <button
          type="submit"
          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 text-xs font-extrabold flex items-center gap-1 cursor-pointer transition shrink-0 shadow"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Enviar</span>
        </button>
      </form>
    </div>
  );
};

export const AuthAndVerificationGate: React.FC = () => {
  const {
    saveAndRegisterRealCourierProfile,
    aiAgentConfig,
    themeMode,
    buddyMascotImages,
  } = useEstafetas();

  const isDay = themeMode === 'DAYLIGHT';
  const [authMode, setAuthMode] = useState<
    'ENTRAR' | 'CRIAR_CONTA' | 'SUPORTE'
  >('ENTRAR');
  const [username, setUsername] = useState<string>('');
  const [emailOrPhone, setEmailOrPhone] = useState<string>('');
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

  // Interactive 3D Buddy Voice Introduction & Synchronized Live Subtitles State
  const [isIntroSpeaking, setIsIntroSpeaking] = useState<boolean>(false);
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number>(0);
  const introSessionIdRef = useRef<number>(0);
  const sentenceTimerRef = useRef<number | null>(null);
  const waitingForGestureRef = useRef<boolean>(false);
  const userStoppedOrTypedRef = useRef<boolean>(false);

  const clearIntroTimers = useCallback(() => {
    if (sentenceTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(sentenceTimerRef.current);
      sentenceTimerRef.current = null;
    }
  }, []);

  const stopBuddyIntroPresentation = useCallback(
    (markUserStopped = true) => {
      if (markUserStopped) {
        userStoppedOrTypedRef.current = true;
        waitingForGestureRef.current = false;
      }
      introSessionIdRef.current += 1;
      clearIntroTimers();
      setIsIntroSpeaking(false);
      cancelBuddySpeechNow();
      if (typeof window !== 'undefined') {
        try {
          window.speechSynthesis?.cancel();
        } catch {
          // ignore
        }
        try {
          const winAny = window as unknown as {
            BuddyNativeOverlay?: {
              stopSpeaking?: () => void;
              stopNativeTts?: () => void;
              setSpeechRate?: (rateVal: number) => void;
            };
          };
          winAny.BuddyNativeOverlay?.stopSpeaking?.();
          winAny.BuddyNativeOverlay?.stopNativeTts?.();
          winAny.BuddyNativeOverlay?.setSpeechRate?.(getSavedBuddyVoiceRate());
        } catch {
          // ignore
        }
      }
    },
    [clearIntroTimers]
  );

  const speakSentenceAtIndex = useCallback(
    (idx: number, sessionId: number) => {
      if (
        typeof window === 'undefined' ||
        introSessionIdRef.current !== sessionId
      ) {
        return;
      }

      if (idx >= BUDDY_LOGIN_INTRO_SENTENCES.length) {
        clearIntroTimers();
        setIsIntroSpeaking(false);
        setActiveSentenceIdx(0);
        try {
          const winAny = window as unknown as {
            BuddyNativeOverlay?: {
              setSpeechRate?: (rateVal: number) => void;
            };
          };
          winAny.BuddyNativeOverlay?.setSpeechRate?.(getSavedBuddyVoiceRate());
        } catch {
          // ignore
        }
        return;
      }

      const sentence = BUDDY_LOGIN_INTRO_SENTENCES[idx];
      setActiveSentenceIdx(idx);
      setIsIntroSpeaking(true);
      clearIntroTimers();

      const winAny = window as unknown as {
        BuddyNativeOverlay?: {
          speakText?: (spokenText: string) => void;
          speakNativeTts?: (spokenText: string) => void;
          setSpeechRate?: (rateVal: number) => void;
        };
      };

      const nativeSpeakFn =
        winAny.BuddyNativeOverlay?.speakText ||
        winAny.BuddyNativeOverlay?.speakNativeTts;

      // Engine 1: Native Android APK TextToSpeech Bridge (pt-BR Male @ 1.05x for Login Intro)
      if (typeof nativeSpeakFn === 'function') {
        try {
          winAny.BuddyNativeOverlay?.setSpeechRate?.(LOGIN_INTRO_VOICE_RATE);
        } catch {
          // ignore
        }
        try {
          nativeSpeakFn.call(winAny.BuddyNativeOverlay, sentence);
          const estimatedDurationMs = Math.max(
            5200,
            Math.round(sentence.length * 66) + 750
          );
          sentenceTimerRef.current = window.setTimeout(() => {
            if (introSessionIdRef.current !== sessionId) return;
            speakSentenceAtIndex(idx + 1, sessionId);
          }, estimatedDurationMs);
          return;
        } catch {
          // fallback to Web SpeechSynthesis below
        }
      }

      // Engine 2: Web SpeechSynthesis (strictly pt-BR Male @ 1.05x, pitch 0.95)
      if ('speechSynthesis' in window) {
        try {
          if (idx === 0) {
            window.speechSynthesis.cancel();
          }
          window.speechSynthesis.resume?.();

          const utterance = new SpeechSynthesisUtterance(sentence);
          utterance.lang = 'pt-BR';
          utterance.rate = LOGIN_INTRO_VOICE_RATE;
          utterance.pitch = DEFAULT_BUDDY_VOICE_PITCH;
          utterance.volume = 1.0;

          const voices = window.speechSynthesis.getVoices();
          const chosenVoice = selectBestGeminiLikePtVoice(voices);
          if (chosenVoice) {
            utterance.voice = chosenVoice;
          }

          let advanced = false;
          const advanceNext = () => {
            if (advanced || introSessionIdRef.current !== sessionId) return;
            advanced = true;
            clearIntroTimers();
            speakSentenceAtIndex(idx + 1, sessionId);
          };

          utterance.onstart = () => {
            if (introSessionIdRef.current !== sessionId) return;
            waitingForGestureRef.current = false;
            setActiveSentenceIdx(idx);
            setIsIntroSpeaking(true);
          };

          utterance.onend = () => {
            advanceNext();
          };

          utterance.onerror = (ev) => {
            if (introSessionIdRef.current !== sessionId) return;
            if (ev?.error === 'not-allowed' || ev?.error === 'audio-busy') {
              waitingForGestureRef.current = true;
              clearIntroTimers();
              setIsIntroSpeaking(false);
              return;
            }
            if (ev?.error !== 'canceled' && ev?.error !== 'interrupted') {
              advanceNext();
            }
          };

          // Safety timer in case mobile WebView/browser skips onend
          const fallbackMs = Math.max(
            6000,
            Math.round(sentence.length * 72) + 1200
          );
          sentenceTimerRef.current = window.setTimeout(() => {
            advanceNext();
          }, fallbackMs);

          window.speechSynthesis.speak(utterance);
          return;
        } catch {
          // ignore
        }
      }

      // If no speech engine is available, still cycle subtitles gracefully
      sentenceTimerRef.current = window.setTimeout(() => {
        if (introSessionIdRef.current !== sessionId) return;
        speakSentenceAtIndex(idx + 1, sessionId);
      }, Math.max(4800, Math.round(sentence.length * 60)));
    },
    [clearIntroTimers]
  );

  const startBuddyIntroPresentation = useCallback(
    (startIdx = 0) => {
      userStoppedOrTypedRef.current = false;
      waitingForGestureRef.current = false;
      stopBuddyIntroPresentation(false);
      const nextSession = introSessionIdRef.current + 1;
      introSessionIdRef.current = nextSession;
      playBuddyConfirmationChime();
      speakSentenceAtIndex(startIdx, nextSession);
    },
    [speakSentenceAtIndex, stopBuddyIntroPresentation]
  );

  // Auto-start the voice introduction when the Login screen opens
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Warm up Web Speech voices list if needed
    try {
      window.speechSynthesis?.getVoices?.();
    } catch {
      // ignore
    }

    const autoStartTimer = window.setTimeout(() => {
      if (!userStoppedOrTypedRef.current) {
        startBuddyIntroPresentation(0);
      }
    }, 520);

    const handleFirstInteractionFallback = (ev: Event) => {
      if (userStoppedOrTypedRef.current || !waitingForGestureRef.current) {
        return;
      }
      const target = ev.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.closest('[data-buddy-audio-pill="true"]') ||
          target.closest('[data-buddy-stop-intro="true"]'))
      ) {
        return;
      }
      waitingForGestureRef.current = false;
      startBuddyIntroPresentation(0);
    };

    window.addEventListener('pointerdown', handleFirstInteractionFallback, {
      passive: true,
    });

    return () => {
      window.clearTimeout(autoStartTimer);
      window.removeEventListener('pointerdown', handleFirstInteractionFallback);
      stopBuddyIntroPresentation(true);
    };
  }, [startBuddyIntroPresentation, stopBuddyIntroPresentation]);

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
    stopBuddyIntroPresentation(true);
    setErrorMsg(null);
    const cleanName = username.trim();
    const cleanContact = emailOrPhone.trim();
    const cleanPin = pinOrPassword.trim();

    if (!cleanName) {
      setErrorMsg(
        authMode === 'ENTRAR'
          ? 'Introduza o seu Email ou Nome de Utilizador.'
          : 'Introduza o seu Nome Completo ou Alcunha.'
      );
      return;
    }
    if (authMode === 'CRIAR_CONTA' && !cleanContact) {
      setErrorMsg('Introduza o seu Email ou Número de Telemóvel.');
      return;
    }
    if (cleanPin.length < 3) {
      setErrorMsg('Introduza a sua Palavra-passe ou PIN (mín. 3 caracteres).');
      return;
    }

    setIsSubmitting(true);
    try {
      let resolvedName = cleanName;
      let resolvedVehicle: CourierRegistrationVehicle = selectedVehicle;
      let resolvedPlatforms: PlatformName[] =
        selectedPlatforms.length > 0
          ? selectedPlatforms
          : ['Uber Eats', 'Glovo'];
      let resolvedZone: AmaranteBaseZoneOption = selectedZone;

      if (authMode === 'ENTRAR') {
        const localSaved = loadSavedAccounts().find(
          (a) =>
            a.username.toLowerCase() === cleanName.toLowerCase() ||
            (a.emailOrPhone &&
              a.emailOrPhone.toLowerCase() === cleanName.toLowerCase())
        );
        if (
          localSaved &&
          localSaved.pinOrPassword &&
          localSaved.pinOrPassword !== cleanPin
        ) {
          setErrorMsg(
            'Palavra-passe / PIN incorreto para esta conta neste telemóvel.'
          );
          setIsSubmitting(false);
          return;
        }
        if (localSaved) {
          resolvedName = localSaved.username;
          resolvedVehicle = localSaved.vehicle;
          resolvedPlatforms = localSaved.platforms;
          resolvedZone = localSaved.zone;
        } else {
          const remoteRow = await findExistingCourierByNameInSupabaseRest({
            supabaseUrl: aiAgentConfig.supabaseUrl,
            supabaseAnonKey: aiAgentConfig.supabaseAnonKey,
            nameOrUsername: cleanName,
          });
          if (remoteRow) {
            resolvedName = remoteRow.name || cleanName;
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
        username: resolvedName,
        emailOrPhone: cleanContact || cleanName,
        pinOrPassword: cleanPin,
        vehicle: resolvedVehicle,
        platforms: resolvedPlatforms,
        zone: resolvedZone,
      });

      await saveAndRegisterRealCourierProfile({
        name: resolvedName,
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
      className={`min-h-screen flex flex-col justify-center px-3.5 py-2.5 ${
        isDay ? 'bg-slate-100 text-slate-950' : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      <div
        className={`max-w-md w-full mx-auto rounded-3xl border px-4 py-3.5 sm:p-5 shadow-2xl space-y-3 ${
          isDay
            ? 'bg-white border-slate-300 shadow-slate-300/50'
            : 'bg-zinc-900 border-zinc-800 shadow-black/70'
        }`}
      >
        {/* Top: Large Transparent 3D Buddy Hero (176px, no dark background circle) + Compact 36x36 Speaker Button at Foot + Delivery Buddy Title */}
        <div className="flex flex-col items-center text-center space-y-1.5">
          <div className="relative flex items-center justify-center">
            {isIntroSpeaking && (
              <>
                <span className="absolute -inset-2 rounded-full border-2 border-[#00E5FF]/60 animate-ping pointer-events-none" />
                <span className="absolute -inset-1 rounded-full bg-[#00E5FF]/25 blur-xl animate-pulse pointer-events-none" />
              </>
            )}
            {!isIntroSpeaking && (
              <span className="absolute -inset-1 rounded-full bg-[#00E5FF]/15 blur-md pointer-events-none" />
            )}

            <div
              onClick={() => {
                if (isIntroSpeaking) {
                  stopBuddyIntroPresentation(true);
                } else {
                  startBuddyIntroPresentation(0);
                }
              }}
              title={
                isIntroSpeaking
                  ? 'Toca para parar a apresentação de voz'
                  : 'Toca para ouvir a apresentação do Buddy'
              }
              className={`relative h-[176px] w-[176px] bg-transparent flex items-center justify-center cursor-pointer transition-transform duration-300 ${
                isIntroSpeaking
                  ? 'scale-[1.03] drop-shadow-[0_0_24px_rgba(0,229,255,0.75)]'
                  : 'hover:scale-[1.02] drop-shadow-[0_0_14px_rgba(0,229,255,0.38)]'
              }`}
            >
              <img
                src={buddyMascotImages.mascotActive}
                alt="Mascote 3D Delivery Buddy"
                className="h-full w-full object-contain select-none pointer-events-none"
              />

              {/* Compact 36x36 Circular Speaker Icon Button Tucked Right at Buddy's Foot */}
              <button
                type="button"
                data-buddy-audio-pill="true"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isIntroSpeaking) {
                    stopBuddyIntroPresentation(true);
                  } else {
                    startBuddyIntroPresentation(0);
                  }
                }}
                aria-label={
                  isIntroSpeaking
                    ? 'Calar apresentação de voz do Buddy'
                    : 'Ouvir apresentação de voz do Buddy'
                }
                title={
                  isIntroSpeaking
                    ? 'Parar voz do Buddy'
                    : 'Ouvir apresentação do Buddy'
                }
                className={`absolute bottom-1 right-1 h-9 w-9 rounded-full flex items-center justify-center text-base border-2 transition-all cursor-pointer z-10 ${
                  isIntroSpeaking
                    ? 'bg-[#00E5FF]/25 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_16px_rgba(0,229,255,0.9)] animate-pulse'
                    : 'bg-zinc-950/90 hover:bg-zinc-900 border-[#00E5FF]/80 text-[#00E5FF] shadow-md'
                }`}
              >
                <span className="leading-none select-none">
                  {isIntroSpeaking ? '🔇' : '🔊'}
                </span>
              </button>
            </div>
          </div>

          {/* Synchronized Live Subtitles (Legendas) while speaking */}
          {isIntroSpeaking && (
            <div
              onClick={() => stopBuddyIntroPresentation(true)}
              data-buddy-stop-intro="true"
              className={`w-full rounded-2xl border px-3 py-2 text-left transition-all cursor-pointer ${
                isDay
                  ? 'bg-emerald-50/90 border-emerald-400 text-slate-900 shadow-sm'
                  : 'bg-emerald-950/40 border-[#00E5FF]/50 text-emerald-100 shadow-[0_0_20px_rgba(0,229,255,0.22)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#00E5FF]">
                  <span className="h-2 w-2 rounded-full bg-[#00E5FF] animate-ping" />
                  Legenda ao Vivo • Parte {activeSentenceIdx + 1}/
                  {BUDDY_LOGIN_INTRO_SENTENCES.length}
                </span>
                <div className="flex items-center gap-1">
                  {BUDDY_LOGIN_INTRO_SENTENCES.map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === activeSentenceIdx
                          ? 'w-4 bg-[#00E5FF]'
                          : idx < activeSentenceIdx
                            ? 'w-1.5 bg-[#00E5FF]/60'
                            : 'w-1.5 bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p
                className={`text-xs font-bold leading-snug ${
                  isDay ? 'text-slate-900' : 'text-zinc-100'
                }`}
              >
                “{BUDDY_LOGIN_INTRO_SENTENCES[activeSentenceIdx]}”
              </p>
            </div>
          )}

          <div className="pt-0.5">
            <h1 className="text-3xl sm:text-[32px] font-extrabold tracking-tight leading-tight">
              Delivery Buddy
            </h1>
            <p
              className={`text-xs font-semibold mt-0.5 ${
                isDay ? 'text-slate-600' : 'text-zinc-400'
              }`}
            >
              Inicia sessão, cria a tua conta ou fala com o suporte técnico
            </p>
          </div>
        </div>

        {/* 3-Option Navigation Switcher: 1. Fazer Login | 2. Criar Conta | 3. Suporte */}
        <div
          className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl border ${
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
            className={`py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
              authMode === 'ENTRAR'
                ? 'bg-emerald-600 text-white shadow'
                : isDay
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LogIn className="h-3.5 w-3.5 shrink-0" />
            <span>Entrar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('CRIAR_CONTA');
              setErrorMsg(null);
            }}
            className={`py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
              authMode === 'CRIAR_CONTA'
                ? 'bg-emerald-600 text-white shadow'
                : isDay
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5 shrink-0" />
            <span>Criar Conta</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopBuddyIntroPresentation(true);
              setAuthMode('SUPORTE');
              setErrorMsg(null);
            }}
            className={`py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
              authMode === 'SUPORTE'
                ? 'bg-emerald-600 text-white shadow'
                : isDay
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Suporte</span>
          </button>
        </div>

        {/* OPTION 3 VIEW: ACESSAR O SUPORTE EM TEMPO REAL */}
        {authMode === 'SUPORTE' ? (
          <RealTimeSupportPanel
            onBack={() => setAuthMode('ENTRAR')}
            isDaylight={isDay}
          />
        ) : (
          /* OPTION 1 (LOGIN) & OPTION 2 (CRIAR CONTA) FORM */
          <form onSubmit={handleAuthSubmit} className="space-y-2.5">
            <div>
              <label
                className={`block text-[11px] font-black uppercase tracking-wider mb-1 ${
                  isDay ? 'text-slate-700' : 'text-zinc-300'
                }`}
              >
                {authMode === 'ENTRAR'
                  ? 'Email ou Nome de Utilizador'
                  : 'Nome do Estafeta'}
              </label>
              <input
                type="text"
                value={username}
                onFocus={() => stopBuddyIntroPresentation(true)}
                onChange={(e) => {
                  stopBuddyIntroPresentation(true);
                  setUsername(e.target.value);
                }}
                placeholder={
                  authMode === 'ENTRAR'
                    ? 'Ex: Caio Moreira ou email@exemplo.pt'
                    : 'Ex: Caio Moreira'
                }
                autoComplete="username"
                className={`w-full rounded-xl border px-3.5 py-2 text-sm font-bold focus:outline-none ${
                  isDay
                    ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-emerald-600'
                    : 'bg-zinc-950 border-zinc-700 text-white focus:border-emerald-500'
                }`}
              />
            </div>

            {authMode === 'CRIAR_CONTA' && (
              <div>
                <label
                  className={`block text-[11px] font-black uppercase tracking-wider mb-1 ${
                    isDay ? 'text-slate-700' : 'text-zinc-300'
                  }`}
                >
                  Email ou Telemóvel
                </label>
                <input
                  type="text"
                  value={emailOrPhone}
                  onFocus={() => stopBuddyIntroPresentation(true)}
                  onChange={(e) => {
                    stopBuddyIntroPresentation(true);
                    setEmailOrPhone(e.target.value);
                  }}
                  placeholder="Ex: 912 345 678 ou estafeta@email.pt"
                  autoComplete="email"
                  className={`w-full rounded-xl border px-3.5 py-2 text-sm font-bold focus:outline-none ${
                    isDay
                      ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-emerald-600'
                      : 'bg-zinc-950 border-zinc-700 text-white focus:border-emerald-500'
                  }`}
                />
              </div>
            )}

            <div>
              <label
                className={`block text-[11px] font-black uppercase tracking-wider mb-1 ${
                  isDay ? 'text-slate-700' : 'text-zinc-300'
                }`}
              >
                Palavra-passe ou PIN
              </label>
              <input
                type="password"
                value={pinOrPassword}
                onFocus={() => stopBuddyIntroPresentation(true)}
                onChange={(e) => {
                  stopBuddyIntroPresentation(true);
                  setPinOrPassword(e.target.value);
                }}
                placeholder="••••"
                autoComplete={
                  authMode === 'ENTRAR' ? 'current-password' : 'new-password'
                }
                className={`w-full rounded-xl border px-3.5 py-2 text-sm font-bold focus:outline-none ${
                  isDay
                    ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-emerald-600'
                    : 'bg-zinc-950 border-zinc-700 text-white focus:border-emerald-500'
                }`}
              />
            </div>

            {authMode === 'CRIAR_CONTA' && (
              <>
                <div>
                  <label
                    className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 ${
                      isDay ? 'text-slate-700' : 'text-zinc-300'
                    }`}
                  >
                    Plataformas (Uber Eats / Glovo / Bolt Food)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PLATFORM_OPTIONS.map((plat) => {
                      const active = selectedPlatforms.includes(plat);
                      return (
                        <button
                          key={plat}
                          type="button"
                          onClick={() => togglePlatform(plat)}
                          className={`py-2 px-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${
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
                    Veículo Principal
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {VEHICLE_OPTIONS.map((v) => {
                      const active = selectedVehicle === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVehicle(v.id)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
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
                    className={`block text-[11px] font-black uppercase tracking-wider mb-1 ${
                      isDay ? 'text-slate-700' : 'text-zinc-300'
                    }`}
                  >
                    Zona Principal (Amarante — Raio 35 km)
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
                    <option value="Marco de Canaveses">
                      Marco de Canaveses
                    </option>
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
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? 'A autenticar conta...'
                  : authMode === 'ENTRAR'
                    ? 'Entrar na Conta'
                    : 'Criar Conta e Entrar'}
              </span>
            </button>

            {/* Prominent Option 3 Button at the bottom of Login/Register */}
            <div className="pt-1.5 border-t border-zinc-800/70">
              <button
                type="button"
                onClick={() => {
                  stopBuddyIntroPresentation(true);
                  setAuthMode('SUPORTE');
                  setErrorMsg(null);
                }}
                className={`w-full py-2.5 px-4 rounded-2xl border font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                  isDay
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-zinc-950 hover:bg-zinc-800 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <MessageSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>💬 Acessar Suporte em Tempo Real</span>
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 pt-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span>
            Autenticação Segura v2 • Podes terminar sessão a qualquer momento em Ajustes
          </span>
        </div>
      </div>
    </div>
  );
};
