import { PlatformName } from '../types/models';

export const BUDDY_VOICE_RATE_STORAGE_KEY = 'buddyVoiceRate_v2_130';
export const DEFAULT_BUDDY_VOICE_RATE = 1.3;
export const DEFAULT_BUDDY_VOICE_PITCH = 0.95;

let activeHtml5TtsAudio: HTMLAudioElement | null = null;
let activeNativeSpeechEndTimer: number | null = null;
let activeOnEndCallback: (() => void) | null = null;

export function getSavedBuddyVoiceRate(): number {
  if (typeof window === 'undefined') return DEFAULT_BUDDY_VOICE_RATE;
  try {
    const raw = localStorage.getItem(BUDDY_VOICE_RATE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        BUDDY_VOICE_RATE_STORAGE_KEY,
        String(DEFAULT_BUDDY_VOICE_RATE)
      );
      return DEFAULT_BUDDY_VOICE_RATE;
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 1.0 && parsed <= 1.5) {
      return Number(parsed.toFixed(2));
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_BUDDY_VOICE_RATE;
}

export function saveBuddyVoiceRate(rate: number): number {
  const clamped = Number(Math.max(1.0, Math.min(1.5, rate)).toFixed(2));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BUDDY_VOICE_RATE_STORAGE_KEY, String(clamped));
      const winAny = window as unknown as {
        BuddyNativeOverlay?: {
          setSpeechRate?: (r: number) => void;
        };
      };
      winAny.BuddyNativeOverlay?.setSpeechRate?.(clamped);
    } catch {
      // ignore storage errors
    }
  }
  return clamped;
}

export function selectBestGeminiLikePtVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined;

  // Strictly prioritize Brazilian Portuguese (pt-BR) voices so it never sounds like pt-PT female
  const ptBrVoices = voices.filter((v) => {
    const l = v.lang.toLowerCase();
    const n = v.name.toLowerCase();
    return (
      l.includes('pt-br') ||
      l.includes('pt_br') ||
      n.includes('brasil') ||
      n.includes('brazil')
    );
  });

  const ptVoices = voices.filter((v) => {
    const l = v.lang.toLowerCase();
    return l.includes('pt');
  });

  const candidatePool = ptBrVoices.length > 0 ? ptBrVoices : ptVoices;
  if (candidatePool.length === 0) return undefined;

  const knownFemaleTokens = [
    'francisca',
    'luciana',
    'thalita',
    'vitoria',
    'camila',
    'maria',
    'fernanda',
    'joana',
    'catarina',
    'raquel',
    'ines',
    'inês',
    'cristiano_female',
    'female',
    'ptc',
    'bmg',
  ];

  const nonFemalePool = candidatePool.filter((v) => {
    const lowerName = v.name.toLowerCase();
    return !knownFemaleTokens.some((tok) => lowerName.includes(tok));
  });

  const searchPool = nonFemalePool.length > 0 ? nonFemalePool : candidatePool;

  // Tier 1: Explicit Male Brazilian Portuguese (pt-BR) voices
  const maleKeywords = [
    'antonio',
    'antônio',
    'daniel',
    'fabio',
    'fábio',
    'ricardo',
    'nicolau',
    'pt-br-x-pte',
    'pt-br-x-afs',
    'pt-br-x-ptd',
    'pte',
    'afs',
    'ptd',
    'male',
    'google português do brasil',
    'google portugues do brasil',
  ];

  for (const kw of maleKeywords) {
    const match = searchPool.find((v) => v.name.toLowerCase().includes(kw));
    if (match) return match;
  }

  const tier2Keywords = ['google', 'natural', 'neural', 'microsoft'];
  for (const kw of tier2Keywords) {
    const match = searchPool.find((v) => v.name.toLowerCase().includes(kw));
    if (match) return match;
  }

  return searchPool[0];
}

export function stopBuddySpeech(): void {
  cancelBuddySpeechNow();
}

export function cancelBuddySpeechNow(): void {
  if (typeof window === 'undefined') return;
  if (activeNativeSpeechEndTimer !== null) {
    window.clearTimeout(activeNativeSpeechEndTimer);
    activeNativeSpeechEndTimer = null;
  }
  if (activeOnEndCallback) {
    const cb = activeOnEndCallback;
    activeOnEndCallback = null;
    try {
      cb();
    } catch {
      // ignore
    }
  }
  try {
    const winAny = window as unknown as {
      BuddyNativeOverlay?: {
        stopSpeaking?: () => void;
        stopNativeTts?: () => void;
      };
    };
    winAny.BuddyNativeOverlay?.stopSpeaking?.();
    winAny.BuddyNativeOverlay?.stopNativeTts?.();
  } catch {
    // ignore
  }
  try {
    if (activeHtml5TtsAudio) {
      activeHtml5TtsAudio.pause();
      activeHtml5TtsAudio.currentTime = 0;
      activeHtml5TtsAudio = null;
    }
  } catch {
    // ignore
  }
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}

let sharedChimeCtx: AudioContext | null = null;

export function playBuddyConfirmationChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedChimeCtx) {
      sharedChimeCtx = new AudioCtx();
    }
    if (sharedChimeCtx.state === 'suspended') {
      void sharedChimeCtx.resume();
    }
    const now = sharedChimeCtx.currentTime;
    const osc = sharedChimeCtx.createOscillator();
    const gain = sharedChimeCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.07); // A5
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.connect(gain);
    gain.connect(sharedChimeCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    // ignore audio chime errors
  }
}

/**
 * Crisp, pleasant futuristic ascending chime played when opening/maximizing
 * the app from the floating bubble (without speaking "Tela aberta").
 */
export function playBuddyOpenChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedChimeCtx) {
      sharedChimeCtx = new AudioCtx();
    }
    if (sharedChimeCtx.state === 'suspended') {
      void sharedChimeCtx.resume();
    }
    const now = sharedChimeCtx.currentTime;
    const notes = [523.25, 659.25, 1046.5]; // C5 -> E5 -> C6
    notes.forEach((freq, idx) => {
      if (!sharedChimeCtx) return;
      const osc = sharedChimeCtx.createOscillator();
      const gain = sharedChimeCtx.createGain();
      const startAt = now + idx * 0.065;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startAt);
      gain.gain.setValueAtTime(0.11, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.18);
      osc.connect(gain);
      gain.connect(sharedChimeCtx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.19);
    });
  } catch {
    // ignore audio chime errors
  }
}

if (typeof window !== 'undefined') {
  (
    window as unknown as { playBuddyOpenChime?: () => void }
  ).playBuddyOpenChime = playBuddyOpenChime;
}

function playHtml5StreamTtsFallback(
  text: string,
  rate: number,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return false;
  try {
    if (activeHtml5TtsAudio) {
      activeHtml5TtsAudio.pause();
      activeHtml5TtsAudio = null;
    }
    const cleanChunk = text.trim().slice(0, 190);
    const ttsUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=pt-BR&client=tw-ob&q=${encodeURIComponent(
      cleanChunk
    )}`;
    const audio = new Audio(ttsUrl);
    audio.setAttribute('referrerpolicy', 'no-referrer');
    audio.volume = 1.0;
    audio.playbackRate = Math.max(1.0, Math.min(1.5, rate || 1.3));
    activeHtml5TtsAudio = audio;
    audio.onplay = () => onStart?.();
    audio.onended = () => {
      activeHtml5TtsAudio = null;
      onEnd?.();
    };
    audio.onerror = () => {
      activeHtml5TtsAudio = null;
      onEnd?.();
    };
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        activeHtml5TtsAudio = null;
      });
    }
    return true;
  } catch {
    return false;
  }
}

export function speakBuddy(text: string): void {
  speakWithBuddyVoiceEngine({ text });
}

export interface SpeakBuddyVoiceOptions {
  text: string;
  rate?: number;
  pitch?: number;
  isPaused?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
  onVoiceResolved?: (voiceLabel: string) => void;
}

/**
 * Centralized Friendly Male Brazilian Portuguese (pt-BR) Companion Voice Engine (1.30x Default).
 * Runs strictly ONE engine at a time (canceling any previous audio first) so there is NEVER any echo.
 */
export function speakWithBuddyVoiceEngine(
  options: SpeakBuddyVoiceOptions
): void {
  const {
    text,
    rate,
    pitch = DEFAULT_BUDDY_VOICE_PITCH,
    isPaused = false,
    onStart,
    onEnd,
    onError,
    onVoiceResolved,
  } = options;

  if (isPaused || !text.trim() || typeof window === 'undefined') {
    return;
  }

  // Always cancel any ongoing speech across all engines first to prevent double audio / echo
  cancelBuddySpeechNow();
  activeOnEndCallback = onEnd || null;

  const activeRate =
    rate !== undefined && Number.isFinite(rate)
      ? Math.max(1.0, Math.min(1.5, rate))
      : getSavedBuddyVoiceRate();

  playBuddyConfirmationChime();

  const winAny = window as unknown as {
    BuddyNativeOverlay?: {
      speakText?: (spokenText: string) => void;
      speakNativeTts?: (spokenText: string) => void;
      setSpeechRate?: (rateVal: number) => void;
    };
  };

  // Engine 1 (Priority): Native Android APK TextToSpeech Bridge (pt-BR Male @ 1.30x)
  try {
    const nativeSpeakFn =
      winAny.BuddyNativeOverlay?.speakText ||
      winAny.BuddyNativeOverlay?.speakNativeTts;
    if (typeof nativeSpeakFn === 'function') {
      try {
        winAny.BuddyNativeOverlay?.setSpeechRate?.(activeRate);
      } catch {
        // ignore
      }
      onStart?.();
      nativeSpeakFn.call(winAny.BuddyNativeOverlay, text.trim());
      onVoiceResolved?.('Voz Masculina PT-BR (Android 1.30x)');
      activeNativeSpeechEndTimer = window.setTimeout(() => {
        activeNativeSpeechEndTimer = null;
        if (activeOnEndCallback) {
          const cb = activeOnEndCallback;
          activeOnEndCallback = null;
          cb();
        }
      }, Math.min(6000, Math.max(1300, Math.round(text.length * 46))));
      return;
    }
  } catch {
    // continue to Web SpeechSynthesis fallback
  }

  // Engine 2: Web SpeechSynthesis (strictly pt-BR Male at 1.30x rate, 0.95 pitch)
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume?.();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = 'pt-BR';
      utterance.rate = activeRate;
      utterance.pitch = pitch;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const chosenVoice = selectBestGeminiLikePtVoice(voices);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
        onVoiceResolved?.(`${chosenVoice.name} (${chosenVoice.lang})`);
      } else {
        onVoiceResolved?.('Português do Brasil Masculino (pt-BR)');
      }

      if (onStart) utterance.onstart = onStart;
      if (onEnd) {
        utterance.onend = () => {
          activeOnEndCallback = null;
          onEnd();
        };
      }
      utterance.onerror = (ev) => {
        activeOnEndCallback = null;
        if (ev?.error !== 'canceled' && ev?.error !== 'interrupted') {
          playHtml5StreamTtsFallback(text, activeRate, onStart, onEnd);
        }
        onError?.();
      };

      window.speechSynthesis.speak(utterance);
      return;
    } catch {
      // fall through to Engine 3 only if speechSynthesis threw
    }
  }

  // Engine 3 (Last-resort fallback only when neither Native TTS nor speechSynthesis is available)
  const startedStream = playHtml5StreamTtsFallback(
    text,
    activeRate,
    onStart,
    onEnd
  );
  if (startedStream) {
    onVoiceResolved?.('Voz PT-BR (1.30x)');
  } else {
    onError?.();
  }
}

function formatShortNumberPt(val: number): string {
  return val.toFixed(2).replace('.', ',');
}

function formatSpokenEurosPtBr(val: number): string {
  const whole = Math.floor(val);
  const cents = Math.round((val - whole) * 100);
  if (cents > 0) {
    return `${whole} euros e ${cents}`;
  }
  return `${whole} euros`;
}

function formatSpokenPerKmPtBr(val: number): string {
  const whole = Math.floor(val);
  const cents = Math.round((val - whole) * 100);
  if (cents > 0) {
    return `${whole} e ${String(cents).padStart(2, '0')}`;
  }
  return `${whole}`;
}

export function buildSurgicalOfferStreetTts(input: {
  platform: PlatformName;
  verdictCode: 'ACEITAR' | 'RECUSAR';
  netProfitEur: number;
  netEurPerKm: number;
  grossAmountEur?: number;
  isOverweight?: boolean;
  totalWeightKg?: number;
}): string {
  if (input.isOverweight && (input.totalWeightKg ?? 0) > 10) {
    const roundedKg = Math.round(input.totalWeightKg || 14);
    return `Atenção: ${roundedKg} quilos. Diga dividir pedido.`;
  }

  const baseEur = input.grossAmountEur ?? input.netProfitEur;
  const eurosSpoken = formatSpokenEurosPtBr(baseEur);
  const perKmSpoken = formatSpokenPerKmPtBr(input.netEurPerKm);

  if (input.verdictCode === 'ACEITAR') {
    return `${eurosSpoken}, dá ${perKmSpoken} por quilômetro. Compensa!`;
  }

  return `${eurosSpoken}, dá ${perKmSpoken} por quilômetro. Não compensa!`;
}

export function buildSurgicalHeavyOrderStreetTts(totalWeightKg: number): string {
  const roundedKg = Math.max(11, Math.round(totalWeightKg || 14));
  return `Atenção: ${roundedKg} quilos estimados. Diga 'dividir pedido' para acionar suporte.`;
}

export function buildSurgicalMarketQueryStreetTts(
  onlineCouriersCount: number,
  avgEurPerKm: number
): string {
  const rateStr = formatShortNumberPt(avgEurPerKm > 0 ? avgEurPerKm : 1.48);
  return `${onlineCouriersCount} estafetas online agora. Média de ${rateStr} por km nesta hora.`;
}
